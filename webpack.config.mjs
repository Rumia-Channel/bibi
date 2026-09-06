/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # Webpack Config for Bibi                                                                                                                                                               (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import zzZ from 'zzz/as.composer.mjs';

const { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor } = zzZ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import Webpack from 'webpack';
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
    devServer    : { port: 61671, static: { directory: resolvePath(Composer.IsArchiving ? ARCHIVES_TMP_DIST : DIST), watch: true }, open: ['bibi/?book='], compress: true },
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
    new MiniCSSExtractPlugin({ filename: '[name]' })
);

// =============================================================================================================================

const CommonLoadersForCSS = [
    { loader: 'css-loader',     options: { url: true, import: true, importLoaders: 2 } },
    { loader: 'postcss-loader', options: {} },
    { loader: 'sass-loader',    options: { additionalData: Object.entries(ENVARS).map(([N, V]) => '$' + N + ': ' + V + ';').join(' '), sassOptions: { quietDeps: true } } } // quietDeps silences material-symbols/_core.scss (upstream still on deprecated globals as of 0.35.1-0.47.1); our __src stays loud
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
