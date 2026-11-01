# syntax=docker/dockerfile:1
# The production image. Built from the repo root (docker-compose.yml: context ..), in the repo's own layout
# (/srv/backend), so a frontend added later sits beside it as it does in a checkout. Stage one compiles the server
# (TypeScript, tsc); the last runs the compiled server with production dependencies only, as the node user.
# Dockerfile.dockerignore, beside this file, keeps the context to what this file reads (an allowlist).
# Same Node line as the engines field in both package.json files and NODE_VERSION in the pipeline
# (test/platform.test.ts holds them together).

FROM node:26-bookworm-slim AS build
ENV CI=1
WORKDIR /srv/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/tsconfig.server.json ./
COPY backend/server/ server/
RUN npm run build

FROM node:26-bookworm-slim
# GIT_COMMIT: what /healthz reports as the commit (the pipeline's docker job passes its own; Heroku has its own).
ARG GIT_COMMIT=""
ENV NODE_ENV=production PORT=3000 BACKEND_KIND=docker GIT_COMMIT=$GIT_COMMIT
WORKDIR /srv/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /srv/backend/dist dist
USER node
EXPOSE 3000
# The slim image has no curl or wget; Node's own fetch does the probe.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "--enable-source-maps", "dist/server/server.js"]
