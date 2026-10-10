# syntax=docker/dockerfile:1
# The e2e frontend: builds the Angular app from source in a clean container and serves it with nginx.
# Build context is the repo root (see docker-compose.yml), because the app is generated from ../index.html.
# Dockerfile.dockerignore keeps the context to the files the build reads.

FROM node:26-bookworm-slim AS build
ENV CI=1 NG_CLI_ANALYTICS=false PUPPETEER_SKIP_DOWNLOAD=1
WORKDIR /repo/app
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
COPY index.html apple-touch-icon.png /repo/
RUN npm run build

FROM nginx:1.29-alpine
COPY app/e2e/nginx.conf /etc/nginx/conf.d/default.conf
# The Angular build under test, at /
COPY --from=build /repo/app/www /usr/share/nginx/html
# The original single-file app, at /reference/, as the reference the Angular screens are compared against
COPY index.html apple-touch-icon.png /srv/reference/
