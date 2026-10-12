# frontends

Every UI of Iron Asylum, each built by Angular.

| Folder | What it is | Served at |
|---|---|---|
| `app/` | the athlete's app: its source (`app/src/legacy/src/`, built into the repo root `index.html`), the Angular host, the Cordova iOS project and the e2e (`app/README.md`). Its own package for now, because Cordova keeps its platform and plugin list in the project root's `package.json`. | GitHub Pages, and `/app/` on the backend |
| `website/` | the public site | `/` on the backend |
| `admin/` | the admin dashboard | `/admin/` on the backend |
| `common/` | what more than one frontend uses (the icon set) | |

The website, the admin and `common/` are one Angular workspace: this folder's `package.json` and `angular.json`.

| Command (from this folder) | What it does |
|---|---|
| `npm ci` | install (once, and after the lock file changes) |
| `npm run build` | build the website and the admin into `dist/website/` and `dist/admin/`, which the backend serves |
| `npm run website:dev` | the website on http://localhost:4300 with live reload; the API is proxied to the backend on :3000 |
| `npm run admin:dev` | the admin on http://localhost:4200/admin/, the same way |
| `npm run typecheck`, `npm run lint` | the type check and the lint, as the 60-second check and CI run them |

The fastest look at a change across the whole stack is still `cd backend && npm run dev`: the dev container rebuilds
the website and the admin from this folder on every save (`backend/README.md`).
