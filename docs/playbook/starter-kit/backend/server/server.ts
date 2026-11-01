// Entry point, run as tsc compiled it (dist/server/server.js): npm start, the Procfile's web process on Heroku, the
// Dockerfile's CMD. npm run dev runs this file as it stands (Node strips the types) and restarts it on every save.
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig();
const server = createApp(config, config.logRequests ? (line) => console.log(line) : null).listen(config.port, () => {
  console.log(`__SLUG__ ${config.version} listening on :${config.port} (${config.backendKind})`);
});

// Heroku and docker stop both send SIGTERM and wait a while before they kill.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
