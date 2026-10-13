import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

export const RequiredAssets = [
    'index.html', 'and/jo.js', 'presets/default.js',
    'resources/scripts/bibi.js', 'resources/scripts/bibi.wand.js', 'resources/styles/bibi.css',
    'wardrobe/everyday/bibi.dress.css', 'extensions/sanitizer.js',
    'extensions/extractor/at-once.js', 'extensions/extractor/on-the-fly.js',
    'extensions/extractor/on-the-fly.worker.js', 'extensions/extractor/on-the-fly.bibi-zip-loader.worker.js'
];
const ManifestName = 'build-manifest.json';
const hash = Bytes => crypto.createHash('sha256').update(Bytes).digest('hex');
const Repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (Binary, Args) => execFileSync(Binary, Args, { cwd: Repository, encoding: 'utf8' }).trim();
const safePath = Name => typeof Name === 'string' && Name && !Name.includes('\\') && !Name.startsWith('/') && !Name.split('/').some(Part => !Part || Part === '.' || Part === '..');
export const walkFiles = Root => {
    const Files = [];
    const visit = (Directory, Prefix = '') => {
        for(const Entry of fs.readdirSync(Directory, { withFileTypes: true }).sort((A, B) => A.name < B.name ? -1 : A.name > B.name ? 1 : 0)) {
            const Name = Prefix + Entry.name, FullPath = path.join(Directory, Entry.name);
            if(Entry.isSymbolicLink()) throw new Error('Distribution symlinks are not allowed: ' + Name);
            if(Entry.isDirectory()) visit(FullPath, Name + '/');
            else if(Entry.isFile()) Files.push(Name);
        }
    };
    visit(Root); return Files.sort();
};
const requireAssets = Names => {
    for(const Name of RequiredAssets) if(!Names.includes(Name)) throw new Error('Missing distribution asset: ' + Name);
};
export const createDistributionManifest = Root => {
    const Names = walkFiles(Root).filter(Name => Name !== ManifestName);
    requireAssets(Names);
    const Package = JSON.parse(fs.readFileSync(path.join(Repository, 'package.json'), 'utf8'));
    const Commit = run('git', ['rev-parse', 'HEAD']);
    const Epoch = Number(process.env.SOURCE_DATE_EPOCH ?? run('git', ['show', '-s', '--format=%ct', 'HEAD']));
    if(!/^[a-f0-9]{40,64}$/.test(Commit) || !Number.isSafeInteger(Epoch) || Epoch < 0) throw new Error('Invalid source commit or SOURCE_DATE_EPOCH.');
    const Manifest = {
        schemaVersion: 1, version: Package.version,
        source: { commit: Commit, dirty: !!run('git', ['status', '--porcelain', '--untracked-files=normal']), sourceDateEpoch: Epoch, lockSha256: hash(fs.readFileSync(path.join(Repository, 'bun.lock'))) },
        toolchain: { node: run('node', ['--version']).replace(/^v/, ''), bun: run('bun', ['--version']) },
        files: Names.map(Name => { const Bytes = fs.readFileSync(path.join(Root, Name)); return { path: Name, bytes: Bytes.length, sha256: hash(Bytes) }; })
    };
    fs.writeFileSync(path.join(Root, ManifestName), JSON.stringify(Manifest, null, 2) + '\n');
    return Manifest;
};
const verifyManifest = async (Manifest, Names, ReadBytes) => {
    if(Manifest?.schemaVersion !== 1 || typeof Manifest.version !== 'string' || !/^[a-f0-9]{40,64}$/.test(Manifest.source?.commit || '') || !/^[a-f0-9]{64}$/.test(Manifest.source?.lockSha256 || '') || !Number.isSafeInteger(Manifest.source?.sourceDateEpoch) || !Array.isArray(Manifest.files)) throw new Error('Invalid distribution manifest.');
    const Listed = Manifest.files.map(File => File.path);
    if(Listed.some(Name => !safePath(Name) || Name === ManifestName) || new Set(Listed).size !== Listed.length || JSON.stringify(Listed) !== JSON.stringify([...Listed].sort())) throw new Error('Invalid manifest file inventory.');
    requireAssets(Listed);
    if(JSON.stringify([...Names].filter(Name => Name !== ManifestName).sort()) !== JSON.stringify(Listed)) throw new Error('The distribution inventory differs from its manifest.');
    for(const File of Manifest.files) {
        if(!Number.isSafeInteger(File.bytes) || File.bytes <= 0 || !/^[a-f0-9]{64}$/.test(File.sha256)) throw new Error('Invalid file digest: ' + File.path);
        const Bytes = await ReadBytes(File.path);
        if(Bytes.length !== File.bytes || hash(Bytes) !== File.sha256) throw new Error('Distribution digest mismatch: ' + File.path);
    }
    return Manifest;
};
export const verifyDistribution = async Root => {
    const Manifest = JSON.parse(fs.readFileSync(path.join(Root, ManifestName), 'utf8'));
    return verifyManifest(Manifest, walkFiles(Root), Name => fs.readFileSync(path.join(Root, Name)));
};
export const verifyArchive = async ArchivePath => {
    const Zip = await JSZip.loadAsync(fs.readFileSync(ArchivePath), { checkCRC32: true });
    for(const Entry of Object.values(Zip.files)) {
        const Name = Entry.name.replace(/\/$/, '');
        if(!safePath(Name) || (Entry.unsafeOriginalName && Entry.unsafeOriginalName !== Entry.name) || (Number(Entry.unixPermissions) & 0o170000) === 0o120000) throw new Error('Unsafe archive member: ' + Entry.name);
    }
    const Roots = Object.keys(Zip.files).filter(Name => Name.endsWith('/bibi/' + ManifestName));
    if(Roots.length !== 1) throw new Error('Expected one Bibi distribution manifest in the ZIP.');
    const Prefix = Roots[0].slice(0, -ManifestName.length);
    const Names = Object.keys(Zip.files).filter(Name => Name.startsWith(Prefix) && !Zip.files[Name].dir).map(Name => Name.slice(Prefix.length));
    const Manifest = JSON.parse(await Zip.files[Roots[0]].async('string'));
    if(!['Bibi-v' + Manifest.version + '/bibi/', 'Bibi-v' + Manifest.version + '+BackCompatKit/bibi/'].includes(Prefix)) throw new Error('Archive root does not match the manifest version.');
    return verifyManifest(Manifest, Names, Name => Zip.files[Prefix + Name].async('nodebuffer'));
};

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [Operation, Target] = process.argv.slice(2);
    if(!Target || !['finalize', 'verify', 'verify-zip'].includes(Operation)) throw new Error('Usage: bun zzz/distribution.mjs finalize|verify|verify-zip PATH');
    if(Operation === 'finalize') createDistributionManifest(Target);
    const Manifest = await (Operation === 'verify-zip' ? verifyArchive(Target) : verifyDistribution(Target));
    console.log(JSON.stringify({ verified: Target, version: Manifest.version, sourceCommit: Manifest.source.commit, sourceDirty: Manifest.source.dirty, files: Manifest.files.length }));
}
