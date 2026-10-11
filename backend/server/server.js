// Entry point: `npm start` locally, `web` in the Procfile on Heroku, CMD in the Dockerfile.
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { DeviceStore } from './store.js';

const config = loadConfig();
const store = new DeviceStore(config);
const restored = store.load();

if (config.production && (!config.adminUser || !config.adminPassword)) {
  console.warn('admin: ADMIN_USER or ADMIN_PASSWORD is not set, so /admin answers 503 until both are.');
}

const server = createApp({ config, store, log: config.logRequests ? (line) => console.log(line) : null }).listen(config.port, () => {
  console.log(
    `iron-asylum-backend ${config.version} listening on :${config.port}` +
      (config.dataFile ? ` (devices file ${config.dataFile}, ${restored} restored)` : ' (devices in memory)'),
  );
});

// Heroku sends SIGTERM on every restart and deploy, then waits 30 s. Save, stop taking requests, exit.
// Save again on the way out: a request still in flight at the signal changes the store after the first save.
function shutdown(signal) {
  console.log(`${signal}: saving and closing`);
  store.flush();
  const exit = () => {
    store.flush();
    process.exit(0);
  };
  server.close(exit);
  setTimeout(exit, 5_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
