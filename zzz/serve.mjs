import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import Webpack from 'webpack';
import middleware from 'webpack-dev-middleware';
import express from 'express';
import compression from 'compression';
import { watch } from 'chokidar';
import open from 'open';

export async function serve(Config, { directory = Config.output.path, port = 62222 } = {}) {
    const Client = resolve(import.meta.dirname, 'serve.client.js');
    const Compiler = Webpack({ ...Config, plugins: [
        ...(Config.plugins || []),
        new Webpack.HotModuleReplacementPlugin(),
        ...Object.keys(Config.entry).filter(Name => !Name.endsWith('.css')).map(Name => new Webpack.EntryPlugin(Config.context || process.cwd(), Client, { name: Name }))
    ] });
    const Middleware = middleware(Compiler, { publicPath: '/', stats: Config.stats, cacheControl: false, hot: true });
    const HotPath = Middleware.context.hot.path;
    const App = express();
    App.disable('x-powered-by');
    App.use((Request, Response, Next) => {
        const Host = Request.headers.host || '';
        if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(Host) || (Request.headers.origin && Request.headers.origin !== `http://${Host}`)) return Response.status(403).send('Invalid development-server host or origin');
        Response.setHeader('Cache-Control', 'no-store');
        Next();
    });
    // SSE must not be buffered by compression. The middleware also serves in-memory assets and byte ranges.
    App.use(compression({ filter: (Request, Response) => Request.path !== HotPath && compression.filter(Request, Response) }));
    App.use(Middleware);
    App.use(express.static(directory, { cacheControl: false }));

    // HTML and standalone CSS have no loaded HMR module; reload only when their unversioned contents change.
    let PreviousAssets, NextAssets;
    Compiler.hooks.thisCompilation.tap('BibiLiveAssets', Compilation => {
        Compilation.hooks.processAssets.tap({ name: 'BibiLiveAssets', stage: Webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE }, () => {
            NextAssets = new Map(Compilation.getAssets().filter(Asset => /\.(html?|css)$/.test(Asset.name)).map(Asset => [Asset.name, createHash('sha256').update(Asset.source.buffer()).digest('hex')]));
        });
    });
    Compiler.hooks.done.tap('BibiLiveAssets', Stats => {
        if(Stats.hasErrors()) return;
        if(PreviousAssets && (PreviousAssets.size !== NextAssets.size || [...NextAssets].some(([Name, Hash]) => PreviousAssets.get(Name) !== Hash))) Middleware.context.hot.publish({ action: 'static-changed' });
        PreviousAssets = NextAssets;
    });

    const Watcher = watch(directory, { ignoreInitial: true });
    Watcher.on('all', () => Middleware.context.hot.publish({ action: 'static-changed' }));
    const Server = createServer(App);
    const close = async () => {
        await Watcher.close();
        await new Promise((Resolve, Reject) => Middleware.close(Error => Error ? Reject(Error) : Resolve()));
        await new Promise((Resolve, Reject) => Compiler.close(Error => Error ? Reject(Error) : Resolve()));
        if(Server.listening) await new Promise((Resolve, Reject) => {
            Server.close(Error => Error ? Reject(Error) : Resolve());
            Server.closeAllConnections();
        });
    };
    try {
        await new Promise((Resolve, Reject) => {
            Server.once('error', Reject);
            Server.listen(port, '127.0.0.1', () => { Server.off('error', Reject); Resolve(); });
        });
    } catch(Error) {
        await close();
        throw Error;
    }
    return { server: Server, close };
}

if(import.meta.main) {
    const { default: zzZ } = await import('./index.mjs');
    const { default: Config } = await import('../webpack.config.mjs');
    const Port = zzZ.ARGUMENTS.port === undefined ? 62222 : Number(zzZ.ARGUMENTS.port);
    const Development = await serve(Config, { port: Port });
    const URL = `http://localhost:${Development.server.address().port}/bibi/?book=`;
    console.log(`Bibi development server: ${URL}`);
    if(!zzZ.ARGUMENTS['no-open']) open(URL).catch(Error => console.error(`Could not open the browser: ${Error.message}`));
    const stop = () => {
        process.off('SIGINT', stop);
        process.off('SIGTERM', stop);
        Development.close().catch(Error => { console.error(Error); process.exitCode = 1; });
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
