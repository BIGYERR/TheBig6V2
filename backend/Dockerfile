# syntax=docker/dockerfile:1
# Iron Asylum backend. Stage one builds the admin UI; stage two runs the API with production dependencies only.
# Same Node line as app/e2e/Dockerfile and the engines field in package.json.

FROM node:26-bookworm-slim AS build
ENV CI=1 NG_CLI_ANALYTICS=false
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY angular.json tsconfig.json ./
COPY admin/ admin/
RUN npm run build

FROM node:26-bookworm-slim
ENV NODE_ENV=production PORT=3000
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/ server/
COPY client/ client/
COPY --from=build /srv/dist/admin dist/admin
# Where DATA_FILE points in docker-compose.yml; owned by node so the volume mounted there is writable.
RUN mkdir -p /srv/data && chown node:node /srv/data
USER node
EXPOSE 3000
# The slim image has no curl or wget; Node's own fetch does the probe.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server/server.js"]
