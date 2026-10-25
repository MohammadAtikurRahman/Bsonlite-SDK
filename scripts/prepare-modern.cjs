'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const REPOSITORY = 'MohammadAtikurRahman/BsonLite';
const ENGINE = '9.0.4', DRIVER = '7.7.0';
const requiredReports = { sourceNative: 7, runtimeAndMigration: 3, finalNative: 9 };
const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return !relative || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};
async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const bytes of fs.createReadStream(file)) hash.update(bytes);
  return hash.digest('hex');
}

async function prepare(options) {
  assert.match(options.commit || '', /^[a-f0-9]{40}$/, 'Supply the exact successful core commit');
  assert.match(String(options.runId || ''), /^\d+$/, 'Supply the successful core workflow run ID');
  const version = options.version || '0.7.0-alpha.0';
  assert.match(version, /^0\.7\.0-(alpha|beta|rc)\.\d+$/, 'The modern package must use an explicit 0.7 prerelease version');
  const root = fs.realpathSync(path.resolve(options.artifact));
  const desired = path.resolve(options.out);
  const out = path.join(fs.realpathSync(path.dirname(desired)), path.basename(desired));
  assert(!fs.existsSync(out) && !inside(root, out) && !inside(out, root), 'Use a new output folder outside the input artifact');
  function input(name, max = 1024 * 1024 * 1024) {
    const file = path.join(root, name), stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink() && stat.size <= max, 'Unsafe artifact file: ' + name);
    assert(inside(root, fs.realpathSync(file)), 'Artifact path leaves its root');
    return file;
  }
  const json = name => JSON.parse(fs.readFileSync(input(name, 1024 * 1024), 'utf8'));
  const build = json('dist-modern/build-info.json'), validation = json('dist-modern/validation.json');
  const native = json('assets/modern-win32-x64/native-engine.json');
  assert.equal(build.engineVersion, ENGINE); assert.equal(build.driverVersion, DRIVER);
  assert.equal(build.engineProfile, 'modern'); assert.equal(build.experimental, true);
  assert.equal(build.nativeReady, true, 'Source previews cannot become npm packages');
  assert.equal(build.distributionMode, 'native-encrypted');
  assert.equal(build.platform, 'win32'); assert.equal(build.arch, 'x64');
  assert.equal(validation.status, 'experimental-validated');
  assert.equal(validation.repository, REPOSITORY); assert.equal(validation.commit, options.commit);
  const run = `https://github.com/${REPOSITORY}/actions/runs/${options.runId}`;
  assert.equal(validation.run, run, 'Evidence belongs to a different workflow run');
  assert.equal(validation.engineVersion, ENGINE); assert.equal(validation.driverVersion, DRIVER);
  assert.equal(native.version, 2); assert.equal(native.engineVersion, ENGINE);
  assert.equal(native.windowsIntegration, 'passed'); assert.equal(native.finalBundleIntegration, 'passed');
  assert.equal(native.cipher, 'xchacha20-poly1305'); assert.equal(native.temporaryFiles, true);
  assert.equal(native.engineManagedDumps, false); assert.equal(native.staticCRuntime, true);
  assert.equal(native.mode, 'builtin'); assert.equal(native.platform, 'win32'); assert.equal(native.arch, 'x64');
  assert.equal(native.tlsProvider, 'Windows SChannel'); assert.equal(native.libsodiumVersion, '1.0.22');
  assert.match(native.patchSha256 || '', /^[a-f0-9]{64}$/);
  assert.equal(native.windowsCodePage, 'UTF-8'); assert.equal(native.minimumWindowsBuild, 20348);
  assert.equal(native.upstreamCommit, '246de92935f8636f4f90889d418b31ae70dbaafd');
  const sdkFile = input('dist-modern/BsonLite.cjs');
  const engineFile = input('assets/modern-win32-x64/mongod.exe');
  const sourceFile = input('native/build/modern/BsonLite-modern-engine-source.tar.gz');
  assert.equal(await digest(sdkFile), validation.sdkSha256, 'SDK checksum mismatch');
  assert.equal(fs.statSync(sdkFile).size, build.distributionBytes);
  const engineHash = await digest(engineFile), sourceHash = await digest(sourceFile);
  assert.equal(engineHash, native.engineSha256); assert.equal(engineHash, validation.engineSha256);
  assert.equal(engineHash, build.engineSha256);
  assert.equal(sourceHash, validation.modifiedEngineSourceSha256); assert.equal(sourceHash, native.sourceArchiveSha256);
  const reportFiles = { sourceNative: 'source-native.xml', runtimeAndMigration: 'runtime.xml', finalNative: 'final-native.xml' };
  const reportInputs = {};
  for (const [name, count] of Object.entries(requiredReports)) {
    assert.equal(validation.reports?.[name]?.requiredPassed, count, 'Missing runtime validation: ' + name);
    reportInputs[name] = input('native/build/modern/' + reportFiles[name], 4 * 1024 * 1024);
    assert.equal(await digest(reportInputs[name]), validation.reports[name].reportSha256);
  }
  // Validate every input before reserving a destination. No existing checkout
  // or published 0.6 payload is replaced by this operation.
  const notices = [];
  for (const folder of ['licenses/modern', 'licenses/modern-sdk']) {
    for (const name of fs.readdirSync(path.join(root, folder))) {
      assert(/^[a-zA-Z0-9_.-]+\.(txt|md)$/.test(name), 'Unexpected notice filename');
      notices.push({ name: (folder.endsWith('modern-sdk') ? 'sdk-' : '') + name, file: input(folder + '/' + name, 4 * 1024 * 1024) });
    }
  }
  assert(notices.some(n => n.name.includes('acorn-8.19.0-LICENSE')), 'The embedded Console parser notice is required');
  assert(notices.some(n => n.name === 'MongoDB-SSPL-1.0.txt'), 'The matching engine license is required');
  const temporary = fs.mkdtempSync(path.join(path.dirname(out), '.bsonlite-modern-package-'));
  try {
    const put = (name, content) => {
      const file = path.join(temporary, name); fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    };
    fs.copyFileSync(sdkFile, path.join(temporary, 'BsonLite.cjs'));
    put('build-info.json', JSON.stringify(build, null, 2) + '\n');
    put('validation.json', JSON.stringify(validation, null, 2) + '\n');
    for (const [name, file] of Object.entries(reportFiles)) put('validation/' + file, fs.readFileSync(reportInputs[name]));
    put('index.cjs', '"use strict";\nmodule.exports = require("./BsonLite.cjs");\n');
    fs.mkdirSync(path.join(temporary, 'source'));
    fs.copyFileSync(sourceFile, path.join(temporary, 'source/BsonLite-modern-engine-source.tar.gz'));
    for (const notice of notices) put('licenses/' + notice.name, fs.readFileSync(notice.file));
    put('licenses/BsonLite-MIT.txt', fs.readFileSync(path.resolve(__dirname, '../licenses/BsonLite-MIT.txt')));
    put('licenses/SOURCE_AND_NOTICES.md', '# Source and notices\n\nThe JavaScript wrapper is MIT licensed. The modified engine remains SSPL-1.0; its matching source is source/BsonLite-modern-engine-source.tar.gz. Other components retain the licenses included here. The MIT wrapper does not relicense the engine.\n');
    const pkg = {
      name: 'bsonlite-sdk', version,
      description: 'Experimental portable database SDK with native encryption and BsonLite Console connections.',
      main: './index.cjs', exports: { '.': './index.cjs', './package.json': './package.json' },
      engines: { node: '>=20.19.0' }, os: ['win32'], cpu: ['x64'],
      license: 'SEE LICENSE IN licenses/SOURCE_AND_NOTICES.md', author: 'Atikur Rahman',
      homepage: 'https://bsonlite.com/',
      repository: { type: 'git', url: 'git+https://github.com/MohammadAtikurRahman/Bsonlite-SDK.git' },
      files: ['BsonLite.cjs', 'index.cjs', 'build-info.json', 'validation.json', 'validation/', 'SHA256SUMS.txt', 'source/', 'licenses/', 'MODERN_VALIDATION.md', 'scripts/verify-modern.cjs'],
      scripts: { test: 'node scripts/verify-modern.cjs', verify: 'node scripts/verify-modern.cjs', prepack: 'node scripts/verify-modern.cjs', prepublishOnly: 'node scripts/verify-modern.cjs' },
      publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/', tag: 'next' },
      bsonlite: { sdkVersion: build.bsonliteVersion, engineVersion: ENGINE, consoleVersion: '0.2.0', experimental: true }
    };
    put('package.json', JSON.stringify(pkg, null, 2) + '\n');
    put('MODERN_VALIDATION.md', `# Experimental validation\n\nCore commit: ${options.commit}\n\nSuccessful runtime evidence: ${run}\n\nEngine ${ENGINE}, driver ${DRIVER}. Required native/source, migration/CLI and final bundled tests passed (7, 3 and 9 respectively; these overlap). The original JUnit reports are preserved in validation/source-native.xml, validation/runtime.xml and validation/final-native.xml; their hashes match validation.json and remain available with the package. Clean Windows desktop/installer testing and independent security audit are not claimed.\n`);
    put('README.md', `# BsonLite\n\nExperimental ${version}: a portable database SDK for Node.js and Windows x64 applications. Node.js 20.19+ and Windows build 20348+ are required. This is an independently developed product using a custom MongoDB Community ${ENGINE} engine.\n\n\`\`\`sh\nnpm install bsonlite-sdk@next\n\`\`\`\n\n\`\`\`js\nconst BsonLite = require('bsonlite-sdk');\nasync function main() {\n  try {\n    await BsonLite.connect();\n    console.log(await BsonLite.collection('users').find({}).toArray());\n  } finally { await BsonLite.disconnect(); }\n}\nmain().catch(console.error);\n\`\`\`\n\nConnect once during application startup. Data defaults to ./Database. Import is inert; the package includes its engine and JavaScript dependencies. BsonLite Console 0.2.0 and its CLI can discover a running app automatically. [Desktop software and CLI](https://bsonlite.com/console.html).\n\nExisting 4.0.28 stores require a logical upgrade into a new directory using the previous SDK. Do not point the new engine at old files. [Upgrade guide](https://github.com/${REPOSITORY}/blob/main/native/modern/UPGRADE.md). Preserve encrypted backups and the matching protected vault.\n\nServer-side JavaScript is disabled. Replica-set transactions, change streams and Atlas-only features are outside this standalone profile. This is an experimental release, with validation and limits in MODERN_VALIDATION.md. Matching modified engine source and component licenses accompany the package.\n`);
    const names = ['BsonLite.cjs', 'index.cjs', 'package.json', 'build-info.json', 'validation.json', 'README.md', 'MODERN_VALIDATION.md', 'source/BsonLite-modern-engine-source.tar.gz', ...Object.values(reportFiles).map(n => 'validation/' + n), ...fs.readdirSync(path.join(temporary, 'licenses')).map(n => 'licenses/' + n)];
    const hashes = {};
    for (const name of names) hashes[name] = await digest(path.join(temporary, name));
    // Bind the bytes actually copied into the package to the runtime evidence,
    // including an input changed while preparation was in progress.
    assert.equal(hashes['BsonLite.cjs'], validation.sdkSha256, 'Copied SDK checksum mismatch');
    assert.equal(hashes['source/BsonLite-modern-engine-source.tar.gz'], validation.modifiedEngineSourceSha256, 'Copied source checksum mismatch');
    for (const [name, file] of Object.entries(reportFiles)) assert.equal(hashes['validation/' + file], validation.reports[name].reportSha256, 'Copied runtime report checksum mismatch: ' + name);
    put('scripts/verify-modern.cjs', `'use strict';\nconst fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');\nconst root=path.resolve(__dirname,'..'),expected=${JSON.stringify(hashes)};\n(async()=>{\n for(const [name,hash] of Object.entries(expected)){const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(path.join(root,name)))h.update(b);assert.equal(h.digest('hex'),hash,name+' checksum mismatch');}\n const pkg=require('../package.json'),sdk=require('../index.cjs');\n assert.equal(pkg.publishConfig.tag,'next');assert.equal(sdk.engineVersion,'${ENGINE}');assert.equal(sdk.driverVersion,'${DRIVER}');assert.equal(sdk.version,pkg.bsonlite.sdkVersion);assert.equal(sdk.consoleVersion,'0.2.0');assert.equal(sdk.connectionURL,null);\n for(const n of ['open','connect','collection','disconnect','backup','restore','upgrade'])assert.equal(typeof sdk[n],'function');\n assert.equal(typeof sdk.BSON.serialize,'function');assert.equal(typeof sdk.BSON.deserialize,'function');\n const esm=await import(require('node:url').pathToFileURL(path.join(root,'index.cjs')).href);assert.equal(esm.default,sdk);\n console.log('Verified experimental '+pkg.version+': SDK, matching source, runtime evidence, licenses and inert CJS/ESM exports.');\n})().catch(e=>{console.error(e.message);process.exitCode=1;});\n`);
    hashes['scripts/verify-modern.cjs'] = await digest(path.join(temporary, 'scripts/verify-modern.cjs'));
    put('SHA256SUMS.txt', Object.entries(hashes).map(([name, hash]) => hash + '  ' + name + '\n').join(''));
    fs.renameSync(temporary, out);
    return { directory: out, version, coreCommit: options.commit, coreRun: run, tag: 'next' };
  } catch (error) { fs.rmSync(temporary, { recursive: true, force: true }); throw error; }
}

async function main() {
  const args = process.argv.slice(2), values = {};
  if (args.includes('--help')) return console.log('node scripts/prepare-modern.cjs --artifact <expanded-core-artifact> --out <new-folder> --commit <core-sha> --run-id <successful-run> [--version 0.7.0-alpha.0]');
  const allowed = new Set(['--artifact', '--out', '--commit', '--run-id', '--version']);
  for (let i = 0; i < args.length; i++) {
    const key = args[i]; assert(allowed.has(key) && values[key] === undefined && args[i + 1] && !args[i + 1].startsWith('--'), 'Invalid argument: ' + key);
    values[key] = args[++i];
  }
  assert(values['--artifact'] && values['--out'], 'Supply --artifact and --out; see --help');
  console.log(JSON.stringify(await prepare({ artifact: values['--artifact'], out: values['--out'], commit: values['--commit'], runId: values['--run-id'], version: values['--version'] }), null, 2));
}
module.exports = { prepare };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
