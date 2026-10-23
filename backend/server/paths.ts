// The backend folder, wherever this module runs from: server/ when Node runs the TypeScript source (the tests,
// npm run dev), or dist/server/ once tsc has compiled it (npm start, the Procfile, the Dockerfile). Every file the
// server reads beside itself (package.json, the built UIs, app-web/, client/) is found from here.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;

export const BACKEND_DIR = existsSync(join(here, '..', 'package.json')) ? join(here, '..') : join(here, '..', '..');
