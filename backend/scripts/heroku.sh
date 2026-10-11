#!/usr/bin/env bash
# Heroku helper for the backend. Run from anywhere in the repo:
#   bash backend/scripts/heroku.sh setup <app-name>   create or adopt the app, set config vars, add the git remote
#   bash backend/scripts/heroku.sh deploy             push the committed backend/ to Heroku, then prove it is live
#   bash backend/scripts/heroku.sh verify             prove the live dyno runs the last deployed commit
#   bash backend/scripts/heroku.sh status             dynos, release, /healthz
#   bash backend/scripts/heroku.sh logs               tail the logs
#   bash backend/scripts/heroku.sh open               open /admin/ in the browser
#
# Why the deploy is not a plain `git push heroku main`: the repo root is the GitHub Pages site, and Heroku wants
# package.json and the Procfile at the root of what it receives. So deploy makes a commit whose tree is backend/
# alone (git commit-tree, no git subtree needed) on top of what Heroku already has, and pushes that.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BACKEND_DIR"
PREFIX="$(git rev-parse --show-prefix)"
PREFIX="${PREFIX%/}"                      # "backend"
REMOTE="${HEROKU_REMOTE:-heroku-backend}"
DEFAULT_ORIGINS="https://bigyerr.github.io,app://localhost"

die() { echo "heroku.sh: $*" >&2; exit 1; }

need_cli() {
  command -v heroku >/dev/null 2>&1 || die "install the Heroku CLI first: brew tap heroku/brew && brew install heroku"
  heroku auth:whoami >/dev/null 2>&1 || die "log in first: heroku login"
}

app_name() {
  local url
  url="$(git remote get-url "$REMOTE" 2>/dev/null)" || die "no '$REMOTE' remote; run: bash backend/scripts/heroku.sh setup <app-name>"
  basename "$url" .git
}

web_url() {
  heroku apps:info -a "$1" --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).app.web_url.replace(/\/$/,"")))'
}

cmd_setup() {
  local app="${1:-${HEROKU_APP:-}}"
  [ -n "$app" ] || die "usage: bash backend/scripts/heroku.sh setup <app-name>"
  need_cli

  if heroku apps:info -a "$app" >/dev/null 2>&1; then
    echo "Using the existing app $app."
  else
    echo "Creating $app."
    heroku create "$app" --no-remote
  fi
  heroku buildpacks:set heroku/nodejs -a "$app" >/dev/null 2>&1 || true
  # Puts HEROKU_SLUG_COMMIT in the dyno's environment, so /healthz can say which commit is live.
  heroku labs:enable runtime-dyno-metadata -a "$app" >/dev/null 2>&1 ||
    heroku labs -a "$app" | grep -q '\[+\].*runtime-dyno-metadata' ||
    die "could not turn on runtime-dyno-metadata; deploy verify needs it"

  if git remote get-url "$REMOTE" >/dev/null 2>&1; then
    git remote set-url "$REMOTE" "https://git.heroku.com/$app.git"
  else
    git remote add "$REMOTE" "https://git.heroku.com/$app.git"
  fi

  # The admin login. Taken from ADMIN_USER / ADMIN_PASSWORD if exported, otherwise asked for. Never printed.
  local user="${ADMIN_USER:-}" pass="${ADMIN_PASSWORD:-}"
  if [ -z "$(heroku config:get ADMIN_PASSWORD -a "$app")" ] || [ -n "$pass" ]; then
    [ -n "$user" ] || read -r -p "Admin username [admin]: " user
    user="${user:-admin}"
    [ -n "$pass" ] || { read -r -s -p "Admin password: " pass; echo; }
    [ -n "$pass" ] || die "the admin password cannot be empty"
    heroku config:set ADMIN_USER="$user" ADMIN_PASSWORD="$pass" -a "$app" >/dev/null
    echo "Admin login set."
  else
    echo "Admin login already set; export ADMIN_PASSWORD to change it."
  fi
  heroku config:set NODE_ENV=production CORS_ORIGINS="${CORS_ORIGINS:-$DEFAULT_ORIGINS}" -a "$app" >/dev/null

  echo
  echo "Ready. App $app at $(web_url "$app"), git remote '$REMOTE'."
  echo "Next: commit backend/, then run: bash backend/scripts/heroku.sh deploy"
}

cmd_deploy() {
  need_cli
  local app; app="$(app_name)"

  # Only committed files deploy. Refuse rather than ship something other than what is on screen.
  [ -z "$(git status --porcelain -- .)" ] || die "backend/ has uncommitted changes; commit them first"

  local source tree parent commit
  source="$(git rev-parse --short HEAD)"
  tree="$(git rev-parse "HEAD:$PREFIX")"
  # Build on what Heroku already has, so every deploy is a fast-forward and no force push is needed.
  parent=""
  if git fetch --quiet "$REMOTE" main 2>/dev/null; then parent="$(git rev-parse FETCH_HEAD)"; fi
  if [ -n "$parent" ] && [ "$(git rev-parse "$parent^{tree}")" = "$tree" ] && [ -z "${FORCE:-}" ]; then
    echo "Heroku already has this backend/ (from $parent). Nothing to deploy; FORCE=1 to rebuild anyway."
    cmd_verify "$parent"
    return
  fi
  commit="$(git commit-tree "$tree" ${parent:+-p "$parent"} -m "Deploy backend/ from $source")"

  echo "Deploying backend/ from $source to $app as $commit."
  git push "$REMOTE" "$commit:refs/heads/main"
  cmd_verify "$commit"
}

# A push is not a deploy. Poll /healthz, cache-busted, until it reports the commit that was pushed.
cmd_verify() {
  need_cli
  local app want url got=""
  app="$(app_name)"
  want="${1:-}"
  if [ -z "$want" ]; then
    git fetch --quiet "$REMOTE" main || die "cannot read $REMOTE main"
    want="$(git rev-parse FETCH_HEAD)"
  fi
  url="$(web_url "$app")"
  for _ in $(seq 1 40); do
    got="$(curl -fsS "$url/healthz?cb=$(date +%s)" 2>/dev/null |
      node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).commit||"")}catch{console.log("")}})' || true)"
    if [ "$got" = "$want" ]; then
      echo "Live: $url/healthz reports $want."
      echo "Admin: $url/admin/"
      return 0
    fi
    sleep 3
  done
  die "pushed, but $url/healthz did not report $want within 2 minutes (it reports '${got:-nothing}'). Check: bash backend/scripts/heroku.sh logs"
}

cmd_status() {
  need_cli
  local app; app="$(app_name)"
  heroku ps -a "$app"
  heroku releases -a "$app" -n 3
  curl -fsS "$(web_url "$app")/healthz?cb=$(date +%s)"; echo
}

cmd_logs() { need_cli; heroku logs --tail -a "$(app_name)"; }
cmd_open() { need_cli; heroku open /admin/ -a "$(app_name)"; }

case "${1:-}" in
  setup) shift; cmd_setup "$@" ;;
  deploy) cmd_deploy ;;
  verify) shift; cmd_verify "$@" ;;
  status) cmd_status ;;
  logs) cmd_logs ;;
  open) cmd_open ;;
  *) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
