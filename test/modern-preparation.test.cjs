'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { prepare } = require('../scripts/prepare-modern.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// Synthetic packaging fixtures only. Live native validation belongs to the
// core workflow; these tests exercise hashes, identity, gates and exports.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bsonlite-npm-modern-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const artifact = path.join(root, 'artifact'), out = path.join(root, 'prepared');
  const commit = '1'.repeat(40), runId = '12345';
  const write = (name, data) => { const file = path.join(artifact, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
  const json = (name, value) => write(name, JSON.stringify(value));
  const sdk = `module.exports={version:'0.7.0-alpha.0',engineVersion:'9.0.4',driverVersion:'7.7.0',consoleVersion:'0.2.0',connectionURL:null,BSON:{serialize(){},deserialize(){}},${['open','connect','collection','disconnect','backup','restore','upgrade'].map(n => n + '(){}').join(',')}};`;
  const engine = 'SYNTHETIC ENGINE FIXTURE', source = 'SYNTHETIC SOURCE FIXTURE';
  write('dist-modern/BsonLite.cjs', sdk);
  write('assets/modern-win32-x64/mongod.exe', engine);
  write('native/build/modern/BsonLite-modern-engine-source.tar.gz', source);
  write('licenses/modern/MongoDB-SSPL-1.0.txt', 'synthetic license fixture');
  write('licenses/modern-sdk/Dependency-acorn-8.19.0-LICENSE.txt', 'synthetic parser notice');
  const reports = {};
  for (const [name, file, count] of [['sourceNative','source-native.xml',7],['runtimeAndMigration','runtime.xml',3],['finalNative','final-native.xml',9]]) {
    const report = '<testsuites><testsuite/></testsuites>'; write('native/build/modern/' + file, report);
    reports[name] = { requiredPassed: count, reportSha256: hash(report) };
  }
  const build = { bsonliteVersion:'0.7.0-alpha.0',engineVersion:'9.0.4',driverVersion:'7.7.0',engineProfile:'modern',experimental:true,nativeReady:true,distributionMode:'native-encrypted',platform:'win32',arch:'x64',distributionBytes:Buffer.byteLength(sdk),engineSha256:hash(engine) };
  const native = { version:2,engineVersion:'9.0.4',windowsIntegration:'passed',finalBundleIntegration:'passed',cipher:'xchacha20-poly1305',temporaryFiles:true,engineManagedDumps:false,staticCRuntime:true,mode:'builtin',platform:'win32',arch:'x64',tlsProvider:'Windows SChannel',libsodiumVersion:'1.0.22',patchSha256:'a'.repeat(64),windowsCodePage:'UTF-8',minimumWindowsBuild:20348,upstreamCommit:'246de92935f8636f4f90889d418b31ae70dbaafd',engineSha256:hash(engine),sourceArchiveSha256:hash(source) };
  const validation = { status:'experimental-validated',repository:'MohammadAtikurRahman/BsonLite',commit,run:`https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/${runId}`,engineVersion:'9.0.4',driverVersion:'7.7.0',sdkSha256:hash(sdk),engineSha256:hash(engine),modifiedEngineSourceSha256:hash(source),reports };
  function save() { json('dist-modern/build-info.json',build);json('dist-modern/validation.json',validation);json('assets/modern-win32-x64/native-engine.json',native); }
  save();
  return { artifact,out,commit,runId,write,build,native,validation,save };
}

test('a prepared fixture preserves matching source, next tag and inert CJS/ESM exports', async t => {
  const f = fixture(t); await prepare(f);
  const canonicalReadme = fs.readFileSync(path.resolve(__dirname, '../README.md'));
  assert.deepEqual(fs.readFileSync(path.join(f.out, 'README.md')), canonicalReadme);
  const pkg = JSON.parse(fs.readFileSync(path.join(f.out,'package.json')));
  assert.equal(pkg.publishConfig.tag,'next'); assert.equal(pkg.engines.node,'>=20.19.0');
  assert.equal(pkg.scripts.install,undefined); assert.equal(pkg.scripts.postinstall,undefined);
  assert.equal(fs.existsSync(path.join(f.out,'auto-console.cjs')),false,'The integrated adapter must not be wrapped twice');
  for (const name of ['source-native.xml','runtime.xml','final-native.xml']) {
    assert.deepEqual(fs.readFileSync(path.join(f.out,'validation',name)),fs.readFileSync(path.join(f.artifact,'native/build/modern',name)));
  }
  const check = spawnSync(process.execPath,['scripts/verify-modern.cjs'],{cwd:f.out,encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
  assert(process.env.npm_execpath, 'Run this suite through npm run test:modern-preparation');
  const packed = spawnSync(process.execPath,[process.env.npm_execpath,'pack','--pack-destination',path.dirname(f.out)],{cwd:f.out,encoding:'utf8'});
  assert.equal(packed.status,0,packed.stderr);
  const unpacked = path.join(path.dirname(f.out),'unpacked');fs.mkdirSync(unpacked);
  const extract = spawnSync('tar',['-xzf',path.join(path.dirname(f.out),'bsonlite-sdk-0.7.0-alpha.0.tgz'),'-C',unpacked],{encoding:'utf8'});
  assert.equal(extract.status,0,extract.stderr);
  const packedCheck = spawnSync(process.execPath,['scripts/verify-modern.cjs'],{cwd:path.join(unpacked,'package'),encoding:'utf8'});
  assert.equal(packedCheck.status,0,packedCheck.stderr);
  const packedReadme = path.join(unpacked, 'package/README.md');
  assert.deepEqual(fs.readFileSync(packedReadme), canonicalReadme, 'npm tarball must retain the complete canonical README');
  fs.appendFileSync(packedReadme, '\nchanged');
  const damagedReadme = spawnSync(process.execPath, ['scripts/verify-modern.cjs'], { cwd: path.join(unpacked, 'package'), encoding: 'utf8' });
  assert.equal(damagedReadme.status, 1);
  assert.match(damagedReadme.stderr, /README\.md checksum mismatch/);
  fs.writeFileSync(packedReadme, canonicalReadme);
  fs.appendFileSync(path.join(unpacked,'package/validation/runtime.xml'),'\nchanged');
  const damagedReport = spawnSync(process.execPath,['scripts/verify-modern.cjs'],{cwd:path.join(unpacked,'package'),encoding:'utf8'});
  assert.equal(damagedReport.status,1);assert.match(damagedReport.stderr,/validation\/runtime\.xml checksum mismatch/);
  fs.appendFileSync(path.join(f.out,'BsonLite.cjs'),'\n// changed');
  const damaged = spawnSync(process.execPath,['scripts/verify-modern.cjs'],{cwd:f.out,encoding:'utf8'});
  assert.equal(damaged.status,1);assert.match(damaged.stderr,/checksum mismatch/);
});

test('input changed during copying cannot claim the earlier runtime evidence', async t => {
  const f = fixture(t), copy = fs.copyFileSync;
  const sdk = path.join(fs.realpathSync(f.artifact),'dist-modern','BsonLite.cjs');
  t.mock.method(fs,'copyFileSync',(from,to,...args)=>{
    if(from===sdk) fs.appendFileSync(from,'\n// changed during preparation');
    return copy(from,to,...args);
  });
  await assert.rejects(prepare(f),/Copied SDK checksum mismatch/);
  assert.equal(fs.existsSync(f.out),false);
});

test('source previews and incomplete runtime evidence cannot become a package', async t => {
  const f = fixture(t); f.build.nativeReady=false; f.save();
  await assert.rejects(prepare(f),/Source previews/); assert.equal(fs.existsSync(f.out),false);
  f.build.nativeReady=true; f.validation.reports.finalNative.requiredPassed=8; f.save();
  await assert.rejects(prepare(f),/Missing runtime validation/);assert.equal(fs.existsSync(f.out),false);
});

test('wrong workflow identity or altered source is rejected before output is created', async t => {
  const f = fixture(t);
  await assert.rejects(prepare({...f,commit:'2'.repeat(40)})); assert.equal(fs.existsSync(f.out),false);
  f.write('native/build/modern/BsonLite-modern-engine-source.tar.gz','tampered');
  await assert.rejects(prepare(f));assert.equal(fs.existsSync(f.out),false);
});

test('existing outputs and a latest/stable version are refused without overwriting files', async t => {
  const f = fixture(t); fs.mkdirSync(f.out);fs.writeFileSync(path.join(f.out,'keep'),'preserve');
  await assert.rejects(prepare(f),/new output folder/);
  assert.equal(fs.readFileSync(path.join(f.out,'keep'),'utf8'),'preserve');
  await assert.rejects(prepare({...f,version:'0.7.0'}),/prerelease/);
});

test('a later package version preserves the same complete README', async t => {
  const f = fixture(t);
  await prepare({ ...f, version: '0.7.0-alpha.1' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.out, 'package.json'))).version, '0.7.0-alpha.1');
  assert.deepEqual(fs.readFileSync(path.join(f.out, 'README.md')), fs.readFileSync(path.resolve(__dirname, '../README.md')));
});
