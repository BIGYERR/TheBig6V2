// Everything the server reads from its environment, in one place. Heroku, the Docker image and npm run dev differ only
// in these variables.
import { existsSync, readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Config {
  port: number;
  production: boolean;
  /** backend/package.json's version: the release (CLAUDE.md, PRIORITY 1). */
  version: string;
  /** The commit this process runs. On Heroku it comes from runtime-dyno-metadata (scripts/heroku.sh setup turns it on). */
  commit: string;
  release: string;
  /** heroku (Heroku sets DYNO), docker (the images set BACKEND_KIND), else local. */
  backendKind: string;
  /** Tells two of a kind apart: the Heroku app, or the machine. */
  backendName: string;
  logRequests: boolean;
}

/** backend/package.json, found from server/ (the source, as npm run dev and the tests run it) or dist/server/ (compiled). */
function packageVersion(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let up = 0; up < 3; up++) {
    const file = join(dir, 'package.json');
    if (existsSync(file)) return (JSON.parse(readFileSync(file, 'utf8')) as { version?: string }).version ?? '';
    dir = dirname(dir);
  }
  return '';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT) || 3000,
    production: env.NODE_ENV === 'production',
    version: packageVersion(),
    commit: env.HEROKU_SLUG_COMMIT || env.GIT_COMMIT || '',
    release: env.HEROKU_RELEASE_VERSION || '',
    backendKind: env.BACKEND_KIND || (env.DYNO ? 'heroku' : 'local'),
    backendName: env.BACKEND_NAME || env.HEROKU_APP_NAME || hostname(),
    // One stdout line per request. On unless LOG_REQUESTS=0.
    logRequests: env.LOG_REQUESTS ? env.LOG_REQUESTS === '1' : true,
  };
}
