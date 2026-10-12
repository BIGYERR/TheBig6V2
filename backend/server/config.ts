// Every setting comes from the environment: Heroku config vars, docker compose, or variables you export locally.
// backend/.env.example lists them all.

import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { BACKEND_DIR } from './paths.ts';

const PKG = JSON.parse(readFileSync(join(BACKEND_DIR, 'package.json'), 'utf8')) as { version: string };

// The GitHub Pages app, the Cordova iOS app (app://localhost, see frontends/app/config.xml), and local dev servers.
const DEFAULT_ORIGINS = 'https://bigyerr.github.io,app://localhost,http://localhost:*,http://127.0.0.1:*';

export type Env = Record<string, string | undefined>;
export type Config = ReturnType<typeof loadConfig>;

export function loadConfig(env: Env = process.env) {
  const production = env.NODE_ENV === 'production';
  return {
    port: int(env.PORT, 3000),
    production,
    // Heroku's router is the one proxy in front, and it sets X-Forwarded-For and X-Forwarded-Proto. Trust them
    // there only (Heroku sets DYNO on every dyno). Locally and in docker any client could forge them.
    trustProxy: env.TRUST_PROXY ? env.TRUST_PROXY === '1' : Boolean(env.DYNO),
    version: PKG.version,
    // HEROKU_SLUG_COMMIT exists once runtime-dyno-metadata is on (scripts/heroku.sh setup turns it on).
    commit: env.HEROKU_SLUG_COMMIT || env.GIT_COMMIT || '',
    release: env.HEROKU_RELEASE_VERSION || '',
    // Which backend this is, so the app's debug section, /healthz and the admin header can say so: heroku (Heroku
    // sets DYNO), docker (the image sets IA_BACKEND_KIND), mac-local (scripts/mac-local-backend.sh sets it), else
    // local (npm start, npm run dev). The name tells two of a kind apart: the Heroku app, or the machine.
    backendKind: env.IA_BACKEND_KIND || (env.DYNO ? 'heroku' : 'local'),
    backendName: env.IA_BACKEND_NAME || env.HEROKU_APP_NAME || hostname(),
    // Admin is off in production until both are set. Locally it falls back to admin / asylum.
    adminUser: env.ADMIN_USER || (production ? '' : 'admin'),
    adminPassword: env.ADMIN_PASSWORD || (production ? '' : 'asylum'),
    // How long a staff sign in lasts before the admin asks again.
    sessionTtlMs: int(env.ADMIN_SESSION_MINUTES, 720) * 60_000,
    // The newest app version, when you want to say so. Empty: the newest version any device has reported.
    latestAppVersion: env.APP_LATEST_VERSION || '',
    corsOrigins: list(env.CORS_ORIGINS ?? DEFAULT_ORIGINS),
    // How often the app should beat, and how long after its last beat a device still counts as connected.
    beatMs: int(env.BEAT_MS, 15_000),
    connectedWindowMs: int(env.CONNECTED_WINDOW_MS, 45_000),
    maxDevices: int(env.MAX_DEVICES, 5_000),
    // Empty keeps devices in memory only. Heroku's disk is wiped on every restart, so set this only where
    // the path survives (the docker compose volume does).
    dataFile: env.DATA_FILE || '',
    // One stdout line per request (server/app.ts). On unless LOG_REQUESTS=0.
    logRequests: env.LOG_REQUESTS ? env.LOG_REQUESTS === '1' : true,
    // npm run dev: pages reload themselves after each rebuild (server/dev.ts). Never on otherwise.
    dev: env.IA_DEV === '1',
    // The indicator demo page at /client/. On by default everywhere but production.
    clientDemo: env.CLIENT_DEMO ? env.CLIENT_DEMO === '1' : !production,
  };
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function list(value: string): string[] {
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
