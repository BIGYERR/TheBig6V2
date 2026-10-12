# syntax=docker/dockerfile:1
# Iron Asylum backend. Built from the repo root (docker-compose.yml: context ..), in the repo's own layout, /srv/backend
# and /srv/frontends, so the server finds the website and the admin where it does in a checkout. Stage one builds the
# website and the admin (frontends/), stage two compiles the server (TypeScript, tsc); the last runs the compiled server
# with production dependencies only. Dockerfile.dockerignore, beside this file, keeps the context to what they read.
# Same Node line as frontends/app/e2e/Dockerfile and the engines field in package.json.

FROM node:26-bookworm-slim AS frontends
ENV CI=1 NG_CLI_ANALYTICS=false
WORKDIR /srv/frontends
COPY frontends/package.json frontends/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontends/angular.json frontends/tsconfig.json ./
COPY frontends/common/ common/
COPY frontends/website/ website/
COPY frontends/admin/ admin/
RUN npm run build

FROM node:26-bookworm-slim AS server
ENV CI=1
WORKDIR /srv/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/tsconfig.server.json ./
COPY backend/server/ server/
RUN npm run build:server

FROM node:26-bookworm-slim
# IA_BACKEND_KIND: /healthz, each heartbeat reply and the admin header say this backend is the docker one.
ENV NODE_ENV=production PORT=3000 IA_BACKEND_KIND=docker
WORKDIR /srv/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY backend/client/ client/
COPY --from=server /srv/backend/dist/server dist/server
COPY --from=frontends /srv/frontends/dist /srv/frontends/dist
# The app served at /app/: npm run docker:up bundles it from the repo root first (scripts/app-bundle.ts).
COPY backend/app-web/ app-web/
# Where DATA_FILE points in docker-compose.yml; owned by node so the volume mounted there is writable.
RUN mkdir -p /srv/data && chown node:node /srv/data
USER node
EXPOSE 3000
# The slim image has no curl or wget; Node's own fetch does the probe.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "--enable-source-maps", "dist/server/server.js"]
