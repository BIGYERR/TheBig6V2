#!/usr/bin/env bash
# mac-local-backend: the backend on this Mac with no docker. The same server the image runs (NODE_ENV=production,
# the local admin login, the demo page on, devices kept in a file across restarts), run by the Mac's own Node in the
# background. Run it from backend/:
#
#   npm run mac-local-backend                  build what changed, start, wait for /healthz, print the URLs
#   npm run mac-local-backend -- down          stop it (SIGTERM, so the devices file is saved first)
#   npm run mac-local-backend -- restart       down, then up
#   npm run mac-local-backend -- status        running or not, and what /healthz says
#   npm run mac-local-backend -- logs          follow the server log
#   npm run mac-local-backend -- open          open the site in the browser
#
# up takes --build (rebuild the site and admin even if nothing changed) or --no-build (start whatever dist/ holds).
# API_PORT moves the port (default 3000, the same as docker: stop one before starting the other).
# ADMIN_USER, ADMIN_PASSWORD, CLIENT_DEMO and CORS_ORIGINS pass through, as they do for docker compose.
# MAC_LOCAL_DIR moves the pid file, the log and the devices file (default backend/data/mac-local, git-ignored).
set -euo pipefail

cd "$(dirname "$0")/.."
PORT=${API_PORT:-3000}
RUN_DIR=${MAC_LOCAL_DIR:-$PWD/data/mac-local}
PID_FILE=$RUN_DIR/server.pid
LOG_FILE=$RUN_DIR/server.log
DEVICES_FILE=$RUN_DIR/devices.json
BASE=http://localhost:$PORT

say() { printf 'mac-local-backend: %s\n' "$*"; }
die() {
  printf 'mac-local-backend: %s\n' "$*" >&2
  exit 1
}

# The pid on file, if that process is still our server (not some other process that got the number since).
running_pid() {
  [[ -f $PID_FILE ]] || return 1
  local pid
  pid=$(<"$PID_FILE")
  [[ $pid =~ ^[0-9]+$ ]] || return 1
  ps -p "$pid" -o command= 2>/dev/null | grep -q 'server/server.js' || return 1
  echo "$pid"
}

# Node's own fetch, as the Dockerfile's HEALTHCHECK does, so nothing beyond Node is needed.
healthz() {
  node -e "fetch('$BASE/healthz', { signal: AbortSignal.timeout(2000) }).then(async (r) => { if (!r.ok) process.exit(1); console.log(await r.text()); }, () => process.exit(1))"
}

port_taken() {
  command -v lsof >/dev/null || return 1
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

# A build is due when either app was never built, or anything it builds from is newer than its last build.
needs_build() {
  local app out
  for app in admin site; do
    out=dist/$app/index.html
    [[ -f $out ]] || return 0
    [[ -z $(find "$app" angular.json tsconfig.json package-lock.json -newer "$out" -print -quit) ]] || return 0
  done
  return 1
}

up() {
  local build=auto arg pid
  for arg in "$@"; do
    case $arg in
      --build) build=always ;;
      --no-build) build=never ;;
      *) die "unknown flag $arg (up takes --build or --no-build)" ;;
    esac
  done

  if pid=$(running_pid); then
    say "already running (pid $pid) on $BASE"
    return 0
  fi
  command -v node >/dev/null || die 'node is not installed. brew install node, or use nvm (package.json asks for 26.x).'
  if port_taken; then
    die "port $PORT is already taken. If it is the docker backend: npm run docker:down. Or pick another port: API_PORT=3001 npm run mac-local-backend"
  fi
  local major
  major=$(node -p 'process.versions.node.split(".")[0]')
  [[ $major == 26 ]] || say "note: this is Node $major; package.json, the docker image and Heroku run 26."

  if [[ ! -d node_modules ]]; then
    say 'installing dependencies (npm ci)'
    npm ci --no-audit --no-fund
  fi
  if [[ $build == always ]] || { [[ $build == auto ]] && needs_build; }; then
    say 'building the website and the admin UI'
    npm run --silent build
  fi

  mkdir -p "$RUN_DIR"
  printf '\n=== %s start, port %s ===\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$PORT" >>"$LOG_FILE"
  # nohup and a closed stdin: the server outlives this script and the terminal that ran it.
  NODE_ENV=production \
    PORT=$PORT \
    ADMIN_USER=${ADMIN_USER:-admin} \
    ADMIN_PASSWORD=${ADMIN_PASSWORD:-asylum} \
    CLIENT_DEMO=${CLIENT_DEMO:-1} \
    DATA_FILE=$DEVICES_FILE \
    GIT_COMMIT=${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || true)} \
    nohup node server/server.js >>"$LOG_FILE" 2>&1 </dev/null &
  pid=$!
  echo "$pid" >"$PID_FILE"

  local i
  for i in $(seq 1 40); do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      tail -n 20 "$LOG_FILE" >&2
      die "the server exited during start; the lines above are the end of $LOG_FILE"
    fi
    healthz >/dev/null && break
    [[ $i == 40 ]] && die "no answer from $BASE/healthz after 10 s (pid $pid still running; see npm run mac-local-backend -- logs)"
    sleep 0.25
  done

  say "up on $BASE (pid $pid)"
  local login='admin / asylum'
  [[ -z ${ADMIN_USER:-}${ADMIN_PASSWORD:-} ]] || login='the ADMIN_USER and ADMIN_PASSWORD you set'
  cat <<EOF
  website   $BASE/
  admin     $BASE/admin/   (Staff Login in the site's footer; login $login)
  demo      $BASE/client/
  devices   $DEVICES_FILE
  log       npm run mac-local-backend -- logs
  stop      npm run mac-local-backend -- down
EOF
}

down() {
  local pid i
  if ! pid=$(running_pid); then
    rm -f "$PID_FILE"
    say 'not running'
    return 0
  fi
  kill -TERM "$pid"
  for i in $(seq 1 40); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.25
  done
  if kill -0 "$pid" 2>/dev/null; then
    say 'still up after 10 s, killing it'
    kill -KILL "$pid"
  fi
  rm -f "$PID_FILE"
  say "stopped (devices kept in $DEVICES_FILE)"
}

status() {
  local pid
  if pid=$(running_pid); then
    say "running (pid $pid) on $BASE"
    healthz || say "but $BASE/healthz does not answer"
  else
    say 'not running'
  fi
}

logs() {
  [[ -f $LOG_FILE ]] || die "no log yet at $LOG_FILE. Start it first: npm run mac-local-backend"
  exec tail -n 100 -f "$LOG_FILE"
}

cmd=${1:-up}
case $cmd in
  --*) cmd=up ;; # flags alone mean up: npm run mac-local-backend -- --build
  *) shift || true ;;
esac
case $cmd in
  up | start) up "$@" ;;
  down | stop) down ;;
  restart)
    down
    up "$@"
    ;;
  status) status ;;
  logs) logs ;;
  open) open "$BASE/" ;;
  help | -h) sed -n '2,17p' "$0" ;;
  *) die "unknown command $cmd (up, down, restart, status, logs, open)" ;;
esac
