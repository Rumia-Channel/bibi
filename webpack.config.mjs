/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # Webpack Config for Bibi                                                                                                                                                               (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import zzZ from 'zzz/as.composer.mjs';

const { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor } = zzZ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import Webpack from 'webpack';
import Crypto from 'node:crypto';
import CopyPlugin from 'copy-webpack-plugin';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';

import Path from 'node:path';
const resolvePath = (...PathSteps) => Path.resolve(import.meta.dirname, ...PathSteps);
const normalizePath = (...PathSteps) => Path.normalize(PathSteps.filter(Boolean).join('/')).replaceAll('\\', '/');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Config = {
    name         : Composer.ConfigName,
    mode         : Composer.IsDeveloping ? 'development'       : 'production',
    stats        : Composer.IsDeveloping ? 'errors-warnings'   : 'normal',
    devtool      : Composer.IsDeveloping ? 'inline-source-map' : undefined,
    performance  : { maxEntrypointSize: 1000000, maxAssetSize: 1000000, hints: false  },
    output       : { path: resolvePath(Composer.IsArchiving ? ARCHIVES_TMP_DIST : DIST), filename: '[name].js' },
    // Serves DIST for `bun run serve` (replaces browser-sync/bs-config.cjs; port and start path preserved).
    devServer    : { port: 62222, headers: { 'Cache-Control': 'no-store' }, static: { directory: resolvePath(Composer.IsArchiving ? ARCHIVES_TMP_DIST : DIST), watch: true }, open: ['bibi/?book='], compress: true }, // 61671 falls inside Windows' excluded port ranges on some machines (EACCES); 62222 sits clear of them. no-store: `bun serve` is the verification environment (README) — a fresh server must never serve stale bundles/HTML from browser cache, so caching is off entirely (the ?v= hashes remain as the production mechanism)
    module       : { rules: [] },
    optimization : { minimizer: [] },
    plugins      : [],
    entry        : {}
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Composer.FileTree.Process.forEach(({ Origin, Graft, FilePath }) => Config.entry[normalizePath(Graft, FilePath.replace(/\.scss$/, '.css').replace(/\.[cm]?js$/, ''))] = resolvePath(Origin, FilePath));

const CopyPatterns = [
    ...Composer.FileTree.Reflect.map(R => Object.assign(R, { transform: (CBuf, P) => /\.(x?html?|xml|css|[mc]?js|json|md|te?xt)$/.test(P) ? Object.entries(ENVARS).reduce((C, [N, V]) => C.replaceAll(N, V), CBuf.toString()) : CBuf })),
    ...Composer.FileTree.Copy
].map(({ Origin, Graft, FilePath, transform }) => ({ context: resolvePath(Origin), from: normalizePath(FilePath), to: normalizePath(Graft), transform }));
if(CopyPatterns.length) Config.plugins.push(new CopyPlugin({ patterns: CopyPatterns }));

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Config.plugins.push(
    new Webpack.DefinePlugin(ENVARS),
    new RemoveEmptyScriptsPlugin({ extensions: ['css', 'scss'] }),
    new MiniCSSExtractPlugin({ filename: '[name]' }),
    new BibiAssetVersionPlugin()
);

// Appends ?v=<base64url(sha256(content))> to same-project js/css references inside emitted HTML,
// so browsers can never serve a stale bundle/script/stylesheet from cache (the query is part of the cache key).
// Filenames stay fixed (embed publishers reference jo.js/bibi.js by stable path).
function BibiAssetVersionPlugin() {
    const digest = (Buf) => Crypto.createHash('sha256').update(Buf).digest('base64url');
    this.apply = (Compiler) => Compiler.hooks.thisCompilation.tap('BibiAssetVersion', (Compilation) => {
        Compilation.hooks.processAssets.tap({ name: 'BibiAssetVersion', stage: Webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
            const Names = new Set(Compilation.getAssets().map(A => A.name));
            const resolveAsset = (Ref, FromDir) => {
                const Bare = Ref.split('?')[0].split('#')[0];
                if(!/\.([cm]?js|css)$/.test(Bare) || /^(?:[a-z]+:)?\/\//i.test(Bare) || Bare.startsWith('data:')) return null;
                const Hit = normalizePath(FromDir, Bare);
                return Names.has(Hit) ? Hit : null;
            };
            for(const { name } of Compilation.getAssets()) {
                if(!/\.html?$/.test(name)) continue;
                const Dir = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : '';
                let Src = Compilation.getAsset(name).source.source().toString(), Touched = false;
                Src = Src.replace(/(src|href)="([^"]+)"/g, (M, Attr, Ref) => {
                    const Hit = resolveAsset(Ref, Dir);
                    if(!Hit) return M;
                    Touched = true;
                    return `${Attr}="${Ref.split('?')[0].split('#')[0]}?v=${digest(Compilation.getAsset(Hit).source.source())}"`;
                });
                if(Touched) Compilation.updateAsset(name, new Webpack.sources.RawSource(Src));
            }
        });
    });
}

// =============================================================================================================================

const CommonLoadersForCSS = [
    { loader: 'css-loader',     options: { url: true, import: true, importLoaders: 2 } },
    { loader: 'postcss-loader', options: {} },
    { loader: 'sass-loader',    options: { additionalData: Object.entries(ENVARS).map(([N, V]) => '$' + N + ': ' + V + ';').join(' ') } }
];

const StylesToBePacked = Composer.FileTree.Pack.map(({ Origin, FilePath }) => resolvePath(Origin, FilePath));

Config.module.rules.push({
    test: /\.scss$/,
    exclude: StylesToBePacked,
    use: [
        MiniCSSExtractPlugin.loader,
        ...CommonLoadersForCSS
    ]
});

Config.module.rules.push({
    include: StylesToBePacked,
    use: [
        { loader: 'style-loader' },
        ...CommonLoadersForCSS
    ]
});

Config.module.rules.push({
    test: /\.(gif|jpe?g|png|svg|webp|eot|[ot]tf|woff2?)$/i,
    type: 'asset/inline'
});

// =============================================================================================================================

!Composer.IsDeveloping && Config.optimization.minimizer.push(
    new TerserPlugin({
        // cache: true,
        exclude: Composer.TerserIgnore,
        parallel: true,
        extractComments: false,
        terserOptions: {
            ecma: 6,
            compress: true,
            output: {
                comments: /^\! \/+\n/,
                beautify: false
            }
        }
    })
);

// -----------------------------------------------------------------------------------------------------------------------------

!Composer.IsDeveloping && Config.plugins.push(
    ...Object.entries(Composer.BannerTree).map(([FilePath, banner]) => new Webpack.BannerPlugin({ test: normalizePath(FilePath), banner, raw: true }))
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default Config;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
