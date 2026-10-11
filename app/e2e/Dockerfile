# syntax=docker/dockerfile:1
# The e2e images. Build context is the repo root (see docker-compose.yml), because the app is generated from
# ../index.html. Dockerfile.dockerignore keeps the context to the files these stages read.
#   web     the Angular app built from source, served by nginx at /, with the original index.html at /reference/
#   runner  the Puppeteer suite (TypeScript, run by Node's type stripping) and the Chrome for Testing it pins
# Both start from one npm ci layer, so a dependency change rebuilds once.

FROM node:26-bookworm-slim AS deps
ENV CI=1 NG_CLI_ANALYTICS=false PUPPETEER_SKIP_DOWNLOAD=1
WORKDIR /repo/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY app/angular.json app/tsconfig.json app/tsconfig.app.json ./
COPY app/scripts/ ./scripts/
COPY app/src/ ./src/
COPY index.html apple-touch-icon.png /repo/
RUN npm run build

FROM nginx:1.29-alpine AS web
COPY app/e2e/nginx.conf /etc/nginx/conf.d/default.conf
# The Angular build under test, at /
COPY --from=build /repo/app/www /usr/share/nginx/html
# The original single-file app, at /reference/, as the reference the Angular screens are compared against
COPY index.html apple-touch-icon.png /srv/reference/

FROM deps AS runner
ENV PUPPETEER_CACHE_DIR=/opt/puppeteer HOME=/tmp
# Chrome for Testing at the exact build the lockfile's Puppeteer pins, with the system libraries it needs
# (--install-deps), unzip to unpack it, and fonts for any glyph the app's web font (Geist) does not cover.
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip fonts-dejavu-core fonts-liberation fonts-noto-color-emoji \
 && env -u PUPPETEER_SKIP_DOWNLOAD npx puppeteer browsers install chrome --install-deps \
 && rm -rf /var/lib/apt/lists/* \
 && chmod -R a+rX /opt/puppeteer \
 && install -d -o node -g node /report
COPY app/tsconfig.node.json ./
COPY app/e2e/ ./e2e/
USER node
CMD ["node", "e2e/run.ts"]
