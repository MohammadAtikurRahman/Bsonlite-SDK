'use strict';
const http = require('node:http');
const path = require('node:path');
const BsonLite = require('bsonlite-sdk');
let server, shutdown;

function stop() {
  return shutdown ||= (async () => {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await BsonLite.stop();
  })();
}

async function main() {
  await BsonLite.connect({
    name: 'console_demo',
    directory: path.join(process.cwd(), 'BsonLiteConsoleDemo')
  });
  server = http.createServer((request, response) => {
    const health = request.url === '/health';
    response.writeHead(health ? 200 : 404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(health ? { connected: BsonLite.status().connected, name: 'console_demo' } : { error: 'Not found' }));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(3000, '127.0.0.1', resolve);
  });
  console.log('Demo app ready: http://127.0.0.1:3000/health');
  console.log('Leave this terminal running. Open BsonLite Console and click Connect.');
  console.log('This demo uses ./BsonLiteConsoleDemo and inserts no records at startup.');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop().catch(console.error));
}
main().catch(async error => {
  console.error(error.code || 'STARTUP_ERROR', error.message);
  process.exitCode = 1;
  await stop();
});
