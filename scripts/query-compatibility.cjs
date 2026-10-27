'use strict';
// Differential tests of the published SDK against the same Community engine version.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createRequire } = require('node:module');
const { cases, seed, typeSeed } = require('./query-compatibility-cases.cjs');
const { generatedSeed } = require('./query-compatibility-extra.cjs');
require('./query-compatibility-boundaries.cjs').extend(cases);
const deps = createRequire(path.resolve(process.env.QUERY_RUNTIME || '.query-runtime', 'package.json'));
const { MongoClient, BSON } = deps('mongodb');
const sdk = deps('bsonlite-sdk');
const expectedVersion = '9.0.4';
const reportDirectory = path.resolve(process.env.QUERY_REPORT || 'query-report');
fs.mkdirSync(reportDirectory, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bsonlite-query-comparison-'));
const name = 'query_compat';
const report = {
  format: 1, started: new Date().toISOString(), run: process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  commit: process.env.GITHUB_SHA || null, platform: process.platform, node: process.version,
  mode: process.env.QUERY_TARGET || 'published-windows-sdk-vs-community-standalone', results: [],
  repositoryPins: { core: '31183756a2a3cde31bc04f67f5899b3606545ee4', sdk: '94a6ab7a290f332cbcdd620555ae489d31e786aa', console: '333b246d80472d69b1304a11e24d0c68bd2f05d9' },
  limitations: ['Finite regression matrix, not exhaustive Community feature parity.', 'No cluster, replica-set, Atlas or mongosh parity claim.', 'No performance, power-loss or independent security certification.', 'Comparison preserves driver-decoded BSON via canonical EJSON, normalizes object-key order and preserves array order. Server-side $type is checked separately.', 'Random sample/rand and currentDate tests compare validity contracts, not identical random values or timestamps.']
};
function digest(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function canonical(value, bson, unordered = false) {
  const json = bson.EJSON.serialize(value, { relaxed: false });
  const normalized = stable(json);
  if (unordered && Array.isArray(normalized)) normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify(normalized);
}
function errorInfo(error) {
  return { name: error.name, code: error.code ?? null, codeName: error.codeName ?? null, message: String(error.message).slice(0, 1600) };
}
async function attempt(env, test) {
  const started = performance.now();
  try {
    const value = await test.run(env);
    return { ok: true, value: JSON.parse(canonical(value, env.BSON, test.unordered)), elapsedMS: Math.round(performance.now() - started) };
  } catch (error) {
    return { ok: false, error: errorInfo(error), elapsedMS: Math.round(performance.now() - started) };
  }
}
function classify(test, a, b) {
  if (a.ok && b.ok) return JSON.stringify(a.value) === JSON.stringify(b.value) ? 'match' : 'difference';
  if (!a.ok && !b.ok) {
    if (test.expectedError && a.error.code === test.expectedError && b.error.code === test.expectedError && a.error.name === b.error.name && a.error.codeName === b.error.codeName) return 'expected-error-match';
    if (test.topologyLimit && a.error.code === b.error.code && [20,40573].includes(a.error.code)) return 'standalone-limit';
    return 'shared-rejection';
  }
  if (test.profileLimit && !a.ok && b.ok && [6108304,31264].includes(a.error.code) && /script/i.test(a.error.message)) return 'profile-limit';
  return 'difference';
}
function save() {
  report.finished = new Date().toISOString();
  report.summary = report.results.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});
  const groups = {};
  for (const r of report.results) { groups[r.group] ||= {}; groups[r.group][r.status] = (groups[r.group][r.status] || 0) + 1; }
  report.groups = groups;
  if (report.console) report.consoleSummary = report.console.results.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});
  fs.writeFileSync(path.join(reportDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const lines = ['# BsonLite query compatibility audit', '', `Run: ${report.run || 'local'}`, '', `Commit: ${report.commit || 'local'}`, '',
    `Published npm: ${report.packageVersion || 'unknown'}; embedded SDK: ${report.sdkVersion || 'unknown'}; expected Community: ${expectedVersion}.`, '',
    `Cases completed: ${report.results.length}. Full per-case canonical BSON results and errors are in report.json.`, '',
    '| Classification | Cases |', '| --- | ---: |', ...Object.entries(report.summary).map(([k, v]) => `| ${k} | ${v} |`), '',
    '| Category | Results |', '| --- | --- |', ...Object.entries(groups).map(([k, v]) => `| ${k} | ${Object.entries(v).map(([a, b]) => `${a}: ${b}`).join(', ')} |`), '',
    '## Differences and rejected cases', '', ...report.results.filter(r => !['match', 'expected-error-match'].includes(r.status)).map(r => `- **${r.id}** (${r.status}): BsonLite ${r.bsonlite.ok ? 'succeeded' : `${r.bsonlite.error.code}: ${r.bsonlite.error.message.replace(/\n/g, ' ')}`}; Community ${r.community.ok ? 'succeeded' : `${r.community.error.code}: ${r.community.error.message.replace(/\n/g, ' ')}`}.`), '',
    '## Scope', '', ...report.limitations.map(x => '- ' + x), '', 'Generated durations are diagnostic timing only, not a performance benchmark.', ''];
  if (report.fatal) lines.push('## Infrastructure failure', '', '```json', JSON.stringify(report.fatal, null, 2), '```');
  fs.writeFileSync(path.join(reportDirectory, 'report.md'), lines.join('\n'));
}
async function freePort() {
  const server = net.createServer(); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
async function waitCommunity(uri, child) {
  let last;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error('Community exited before ready: ' + child.exitCode);
    const client = new MongoClient(uri, { directConnection: true, serverSelectionTimeoutMS: 400, connectTimeoutMS: 400 });
    try { await client.connect(); await client.db('admin').command({ ping: 1 }); return client; }
    catch (error) { last = error; await client.close(); await new Promise(resolve => setTimeout(resolve, 500)); }
  }
  throw last;
}
async function fixture(env) {
  await env.db.collection('people').insertMany(seed(env.BSON));
  await env.db.collection('types').insertMany(typeSeed(env.BSON));
  await env.db.collection('generated').insertMany(generatedSeed());
  await env.db.collection('departments').insertMany([{ _id: 'dev', lead: 'A', parent: null }, { _id: 'qa', lead: 'C', parent: 'dev' }, { _id: 'ops', lead: 'D', parent: 'dev' }]);
  await env.db.collection('people').createIndex({ age: 1 }, { name: 'age_1' });
}
function makeEnvironment(db, bson, client) {
  let counter = 0;
  return { db, BSON: bson, client, col: name => db.collection(name),
    async work(prefix, docs, run, options) {
      const collName = prefix.replace(/[^a-zA-Z0-9_]/g, '_') + '_' + (++counter);
      const col = options ? await db.createCollection(collName, options) : db.collection(collName);
      if (docs?.length) await col.insertMany(docs);
      try { return await run(col, collName); }
      finally { await col.drop().catch(() => {}); }
    }
  };
}
(async () => {
  let lite, community, admin, child;
  try {
    assert.equal(process.platform, 'win32', 'The published native SDK must be tested on Windows; no mocks or Linux source previews allowed.');
    const sdkDirectory = path.dirname(deps.resolve('bsonlite-sdk/package.json'));
    report.packageVersion = deps('bsonlite-sdk/package.json').version;
    assert.equal(report.packageVersion, process.env.QUERY_PACKAGE_VERSION || '0.7.0-alpha.4');
    report.sdkVersion = sdk.version;
    const validation = JSON.parse(fs.readFileSync(path.join(sdkDirectory, 'validation.json')));
    report.sdkSha256 = digest(path.join(sdkDirectory, 'BsonLite.cjs'));
    assert.equal(report.sdkSha256, validation.sdkSha256);
    report.originalRuntimeEvidence = validation;
    if (process.env.QUERY_TARGET?.startsWith('core-')) {
      assert.equal(validation.commit, report.repositoryPins.core, 'Current-core artifact must match the inspected core commit');
      assert.equal(validation.run, 'https://github.com/MohammadAtikurRahman/BsonLite/actions/runs/40308893103');
    }
    const binary = path.resolve(process.env.COMMUNITY_BINARY || '');
    assert(fs.statSync(binary).isFile(), 'Set COMMUNITY_BINARY to the official 9.0.4 mongod.exe');
    report.communityBinarySha256 = digest(binary);
    assert.equal(report.communityBinarySha256, 'af268c8aceadfe93076b0fcbd87d47f9d448824b98632c778bcd06f560ace167');
    const data = path.join(work, 'community'); fs.mkdirSync(data);
    const port = await freePort(), uri = 'mongodb://127.0.0.1:' + port;
    child = spawn(binary, ['--dbpath', data, '--bind_ip', '127.0.0.1', '--port', String(port), '--auth', '--logpath', path.join(work, 'community.log'), '--wiredTigerCacheSizeGB', '0.25'], { windowsHide: true, stdio: 'ignore' });
    child.on('error', error => { report.communityProcessError = errorInfo(error); });
    const bootstrap = await waitCommunity(uri, child);
    const rootPassword = crypto.randomBytes(32).toString('hex');
    await bootstrap.db('admin').command({ createUser: 'audit_root', pwd: rootPassword, roles: ['root'] }); await bootstrap.close();
    admin = new MongoClient(uri, { directConnection: true, authSource: 'admin', auth: { username: 'audit_root', password: rootPassword }, serverSelectionTimeoutMS: 5000 }); await admin.connect();
    const appPassword = crypto.randomBytes(32).toString('hex');
    await admin.db(name).command({ createUser: 'audit_app', pwd: appPassword, roles: [{ role: 'readWrite', db: name }] });
    community = new MongoClient(uri, { directConnection: true, authSource: name, auth: { username: 'audit_app', password: appPassword }, writeConcern: { w: 1, j: true }, retryWrites: false, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 15000 }); await community.connect();
    // Both overrides are confined to this new temporary test root, outside the checkout.
    process.env.BSONLITE_DATA_HOME = path.join(work, 'private-managed');
    process.env.BSONLITE_CONSOLE_HOME = path.join(work, 'console-sessions');
    lite = await sdk.open({ name, directory: path.join(work, 'bsonlite'), console: true, startupTimeoutMS: 90000 });
    assert.equal(lite.info.authentication, 'SCRAM-SHA-256');
    assert.equal(lite.info.security.storageEncryption.required, true);
    assert.equal(lite.info.security.storageEncryption.verified, true);
    assert.equal(lite.info.security.storageEncryption.coverage, 'full');
    assert(lite.connectionURL, 'The real SDK app-link is required for Console coverage');
    const liteClient = lite.collection('probe').client;
    assert(liteClient && typeof liteClient.db === 'function', 'Driver collection must expose its public MongoClient');
    const buildA = await liteClient.db('admin').command({ buildInfo: 1 });
    const buildB = await community.db('admin').command({ buildInfo: 1 });
    report.bsonliteBuild = { version: buildA.version, gitVersion: buildA.gitVersion, modules: buildA.modules };
    report.communityBuild = { version: buildB.version, gitVersion: buildB.gitVersion, modules: buildB.modules };
    assert.equal(buildA.version, expectedVersion); assert.equal(buildB.version, expectedVersion);
    report.driverVersion = deps('mongodb/package.json').version; assert.equal(report.driverVersion, sdk.driverVersion);
    report.configuration = { topology: 'standalone on both sides', applicationRole: 'readWrite on both sides', writeConcern: { w: 1, j: true }, retryWrites: false, bsonliteEncryption: lite.info.security.storageEncryption, communityJavaScript: 'upstream default enabled' };
    const a = makeEnvironment(lite, sdk.BSON, liteClient), b = makeEnvironment(community.db(name), BSON, community);
    await fixture(a); await fixture(b);
    for (const test of cases) {
      const resultA = await attempt(a, test), resultB = await attempt(b, test);
      const status = classify(test, resultA, resultB);
      report.results.push({ id: test.id, group: test.group, operation: test.operation || test.id, status, bsonlite: resultA, community: resultB });
      console.log(`${report.results.length}/${cases.length} ${status} ${test.id}`);
      if (report.results.length % 20 === 0) save();
    }
    assert.equal(report.results.length, cases.length);
    report.caseSourceSha256 = Object.fromEntries(['query-compatibility.cjs','query-compatibility-cases.cjs','query-compatibility-extra.cjs','query-compatibility-boundaries.cjs','query-compatibility-console.cjs'].map(n => [n,digest(path.join(__dirname,n))]));
    if (process.env.BSONLITE_CONSOLE_REPO) {
      report.console = await require('./query-compatibility-console.cjs').run({lite, community, communityUri:uri, appPassword, name, sdk, canonical, consoleRoot:process.env.BSONLITE_CONSOLE_REPO});
    }
    report.applicationAPI = { commandOnDatabase: typeof lite.command, collectionIsDriverCollection: typeof lite.collection('people').find === 'function', note: 'Database exposes collection/createCollection/listCollections/ping/close; it is not a full MongoDB Db or MongoClient. Driver-level capabilities do not imply additional wrapper methods.' };
    report.complete = true;
  } catch (error) { report.fatal = errorInfo(error); process.exitCode = 2; console.error('AUDIT INFRASTRUCTURE FAILURE:', error.message); }
  finally {
    if (lite) await lite.close().catch(error => { report.cleanupError = errorInfo(error); });
    if (community) await community.close().catch(() => {});
    if (admin) { await admin.db('admin').command({ shutdown: 1, force: true }).catch(() => {}); await admin.close().catch(() => {}); }
    if (child && child.exitCode === null) {
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 7000))]);
      if (child.exitCode === null) child.kill();
    }
    save();
    if ((report.results.some(x => ['difference', 'shared-rejection'].includes(x.status)) || report.console?.results.some(x => x.status === 'difference')) && !process.exitCode) process.exitCode = 1;
    console.log(JSON.stringify({ complete: report.complete || false, summary: report.summary, report: reportDirectory }));
  }
})();
