# syntax=docker/dockerfile:1
# Iron Asylum backend. Stage one compiles the server (TypeScript, tsc) and builds the website and the admin UI; stage
# two runs the compiled server with production dependencies only.
# Same Node line as app/e2e/Dockerfile and the engines field in package.json.

FROM node:26-bookworm-slim AS build
ENV CI=1 NG_CLI_ANALYTICS=false
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY angular.json tsconfig.json tsconfig.server.json ./
COPY server/ server/
COPY admin/ admin/
COPY site/ site/
# The server and the two Angular builds; the app (app-web/) is bundled on the host by npm run docker:up and copied below.
RUN npm run build:server && npm run build:ui

FROM node:26-bookworm-slim
# IA_BACKEND_KIND: /healthz, each heartbeat reply and the admin header say this backend is the docker one.
ENV NODE_ENV=production PORT=3000 IA_BACKEND_KIND=docker
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY client/ client/
COPY --from=build /srv/dist/server dist/server
COPY --from=build /srv/dist/admin dist/admin
COPY --from=build /srv/dist/site dist/site
# The app served at /app/: npm run docker:up bundles it from the repo root first (scripts/app-bundle.ts).
COPY app-web/ app-web/
# Where DATA_FILE points in docker-compose.yml; owned by node so the volume mounted there is writable.
RUN mkdir -p /srv/data && chown node:node /srv/data
USER node
EXPOSE 3000
# The slim image has no curl or wget; Node's own fetch does the probe.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "--enable-source-maps", "dist/server/server.js"]
