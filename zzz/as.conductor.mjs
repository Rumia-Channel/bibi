/*! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 *  # zzZ..., as the conductor.                                                                                                                                                             (℠)
 *
 */ ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import zzZ from 'zzz';  export default zzZ;

const { PACKAGE, WEBSITE_ADDRESS, LICENSE_ADDRESS, SRC, SRC_BC, DIST, ARCHIVES, ARCHIVES_TMP, ARCHIVES_TMP_DIST, LOG_CHARM, LOG_HEADER, ARGUMENTS, ENVARS, Composer, Conductor } = zzZ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Conductor.Baton = {};

Object.assign(Conductor.Baton, {  // ===========================================================================================

    'clean': (Opt) => { if(typeof Opt !== 'string') Opt = undefined;
        switch(Opt) {
            case undefined:
            case 'tmp':
                Conductor.delete(ARCHIVES_TMP);
                if(Opt) break;
            case 'dist':
                // Conductor.log(`is cleaning...`);
                Conductor.deleteIn(DIST, [
                    '**/.DS_Store',
                    '**/Thumbs.db',
                    'bibi/*.html',
                    'bibi/and',
                    'bibi/extensions',
                    'bibi/info',
                    'bibi/presets',
                    'bibi/resources',
                    'bibi/wardrobe',
                    'bibi-bookshelf/__samples',
                    'bibi-demo',
                    'bib/i/*.html',
                    'bib/i.js',
                    'bib/i/presets'
                ]);
                [
                    'bibi',
                    'bibi-bookshelf',
                    'bib/bookshelf',
                    'bib/i',
                    'bib'
                ].forEach(Dir => Conductor.removeDirectoryIfEmpty(DIST + '/' + Dir));
                Conductor.log(`cleaned`, Conductor.log.w('./') + DIST);
        }
    },

// -----------------------------------------------------------------------------------------------------------------------------

    'weave': (Opt) => { if(typeof Opt !== 'string') return;
        const Matched = Opt.match(/^(\w+)(?:@(\w+))?(?:\+(\w+))?(?:\:(\w+))?$/);
        Conductor.log(
            Matched[4] ? 'wove' : `is weaving` + (Matched[3] ? ` & watching` : '') + '...',
            `(${ Matched[1] })` + (Matched[2] ? ' ' + Conductor.log.w(`w/back-compat-kit`) : '')
        );
    },

    'wove': (Opt) => typeof Opt === 'string' && Conductor.Baton['weave'](Opt + ':done'),

// -----------------------------------------------------------------------------------------------------------------------------

    'make:dress-template': () => {
        // Conductor.log(`is making a dress-template...`);
        const Wardrobe = SRC + '/bibi/wardrobe';
        const TemplateName = 'DRESS-TEMPLATE_' + Conductor.now();
        Conductor.copyIn(Wardrobe, '_dress-codes', TemplateName);
        Conductor.log(`made`, Conductor.log.w('./' + Wardrobe + '/') + TemplateName);
    },

// -----------------------------------------------------------------------------------------------------------------------------

    'archive': (Opt) => { const WithBCK = Opt === 'wbck';
        // Conductor.log(`is making ${ WithBCK ? 'packages' : 'a package' }...`);
        const PackageName = PACKAGE.name == 'bibi' ? 'Bibi' : PACKAGE.name;
        const ArchiveName = PackageName + '-v' + PACKAGE.version;
        const BCKPostfix = '+BackCompatKit';
        const zip = (ArchiveName) => new Promise(resolve => {
            const PackageZipName = ArchiveName + '.zip';
            const WriteStream = Conductor.createWriteStream(ARCHIVES_TMP + '/' + PackageZipName);
            const Zip = new ZipArchive({ forceLocalTime: true, zlib: { level: 9 } });
            Zip.pipe(WriteStream);
            Zip.directory(ARCHIVES_TMP_DIST, ArchiveName);
            Zip.finalize();
            WriteStream.on('close', () => resolve([PackageZipName, Zip.pointer()]));
        });
        const formatNum = (Num) => {
            let NumStr = String(Num), Matched = null;
            while(Matched = NumStr.match(/^(\d+?)(\d{3})((,\d{3})*)$/)) NumStr = Matched[1] + ',' + Matched[2] + Matched[3];
            return NumStr;
        };
        const Results = [], addResult = (Result) => Results.push(Result);
        const Now = Conductor.now();
        Promise.resolve(Conductor.makeDirectory(ARCHIVES_TMP_DIST + '/bibi-bookshelf'))
            .then(() => WithBCK && zip(ArchiveName + BCKPostfix).then(addResult).then(() => Conductor.deleteIn(ARCHIVES_TMP_DIST, ['bib', 'README.BackCompatKit.md'])))
            .then(() => zip(ArchiveName).then(addResult))
            .catch(console.error)
            .then(() => Results.forEach((Result, i) => {
                const Dest = ARCHIVES + '/' + PackageName + '_' + Now;
                Conductor.move(ARCHIVES_TMP + '/' + Result[0], Dest);
                Conductor.log(`archived`, Conductor.log.w('./' + Dest + '/') + Result[0] + (i ? BCKPostfix.replace(/./g, ' ') : '') + ' ' + Conductor.log.w(`${ formatNum(Result[1]) } bytes`));
            })).then(() => Conductor.wave('clean')('tmp'));
    }

});  // ========================================================================================================================

import { deleteSync } from 'del';
import fs from 'fs'; // import path from 'path';
import { ZipArchive } from 'archiver';

Conductor.wave = (Wave) => (Arg) => { try { Conductor.Baton[Wave].call(Conductor, Arg) } catch(Err) { console.error(Err); } };

Object.assign(Conductor.log = (Verb, What = '') => console.log(Conductor.log.f(Conductor.log.H + Conductor.log.bw(Verb) + ' ' + What)), {
    R: '\x1b[0m', f: Str => Str.replace(/(<r>)+/g, Conductor.log.R).replace(/(<b>)+/g, Conductor.log.B).replace(/(<w>)+/g, Conductor.log.W),
    B: '\x1b[1m', b: Str => '<b>' + Str + '<r>', bw: Str => Conductor.log.b(Conductor.log.w(Str)),
    W: '\x1b[2m', w: Str => '<w>' + Str + '<r>', wb: Str => Conductor.log.w(Conductor.log.b(Str)),
    H:        '', h: ( ) => Conductor.log.H = Conductor.log.b(Conductor.log.w(zzZ.LOG_CHARM)) + zzZ.LOG_HEADER
}).h();

Conductor.now = () => new Date(Date.now() + 1000 * 60 * 60 * (new Date().getTimezoneOffset() / -60)).toISOString().split('.')[0].replace(/[:-]/g, '').replace('T', '-');

Object.assign(Conductor, {
    // copy: (From, To) => fs.cpSync(From, To, { recursive: true }),
    copyIn: (In, From, To) => fs.cpSync(In + '/' + From, In + '/' + To, { recursive: true }),
    delete: (Targets) => deleteSync(Targets),
    deleteIn: (In, Targets) => deleteSync((Array.isArray(Targets) ? Targets : [Targets]).map(Target => In + '/' + Target)),
    makeDirectory: (DirName) => fs.existsSync(DirName) || fs.mkdirSync(DirName) || true,
    // removeDirectory: (DirName) => fs.rmdirSync(DirName),
    removeDirectoryIfEmpty: (DirName) => fs.existsSync(DirName) && fs.statSync(DirName).isDirectory() && !fs.readdirSync(DirName).length && fs.rmdirSync(DirName),
    // rename: (From, To) => fs.renameSync(From, To),
    // renameIn: (In, From, To) => fs.renameSync(In + '/' + From, In + '/' + To),
    move: (Target, DirName) => Conductor.makeDirectory(DirName) && fs.renameSync(Target, DirName + '/' + Target.split('/').pop()),
    createWriteStream: (Path) => fs.createWriteStream(Path) // fs.createWriteStream(path.resolve(Path))
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
