# syntax=docker/dockerfile:1
# The e2e images. Build context is the repo root (see docker-compose.yml), because the app's page is built from its
# source files (frontends/app/src/legacy/src) and its icon sits at the root. Dockerfile.dockerignore keeps the context
# to the files these stages read.
#   web     the Angular app built from source, served by nginx at /, with the single-file page (what GitHub Pages
#           deploys, built from the same sources) at /reference/
#   runner  the Puppeteer suite (TypeScript, run by Node's type stripping) in the tests package, with @ia/core, which it
#           reads versions through, and the Chrome for Testing its Puppeteer pins

FROM node:26-bookworm-slim AS deps
ENV CI=1 NG_CLI_ANALYTICS=false PUPPETEER_SKIP_DOWNLOAD=1
WORKDIR /repo/frontends/app
COPY frontends/app/package.json frontends/app/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY frontends/app/angular.json frontends/app/tsconfig.json frontends/app/tsconfig.app.json ./
COPY frontends/app/scripts/ ./scripts/
COPY frontends/app/src/ ./src/
COPY core/src/ /repo/core/src/
COPY apple-touch-icon.png /repo/
# The single-file page and its icon, as GitHub Pages deploys them (frontends/app/scripts/build-index.mjs)
RUN node --input-type=module -e "(await import('./scripts/build-index.mjs')).writePages()"
RUN npm run build

FROM nginx:1.29-alpine AS web
COPY tests/e2e/nginx.conf /etc/nginx/conf.d/default.conf
# The Angular build under test, at /
COPY --from=build /repo/frontends/app/www /usr/share/nginx/html
# The single-file page, at /reference/, as the reference the Angular screens are compared against
COPY --from=build /repo/dist-github-pages/ /srv/reference/

FROM node:26-bookworm-slim AS runner
ENV CI=1 PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_CACHE_DIR=/opt/puppeteer HOME=/tmp
WORKDIR /repo/tests
# The tests package links @ia/core (file:../core), so core sits where the repo keeps it before npm ci.
COPY core/package.json core/tsconfig.json core/tsconfig.base.json /repo/core/
COPY core/src/ /repo/core/src/
COPY tests/package.json tests/package-lock.json ./
RUN npm ci --no-audit --no-fund
# Chrome for Testing at the exact build the lockfile's Puppeteer pins, with the system libraries it needs
# (--install-deps), unzip to unpack it, and fonts for any glyph the app's web font (Geist) does not cover.
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip fonts-dejavu-core fonts-liberation fonts-noto-color-emoji \
 && env -u PUPPETEER_SKIP_DOWNLOAD npx puppeteer browsers install chrome --install-deps \
 && rm -rf /var/lib/apt/lists/* \
 && chmod -R a+rX /opt/puppeteer \
 && install -d -o node -g node /report
COPY tests/e2e/ ./e2e/
USER node
CMD ["node", "e2e/run.ts"]
