#!/usr/bin/env bash
# Heroku helper for the backend. Run from anywhere in the repo:
#   bash backend/scripts/heroku.sh setup <app-name>   create or adopt the app, set config vars, add the git remote
#   bash backend/scripts/heroku.sh deploy             push origin/main's backend/ to Heroku, then prove it is live
#   bash backend/scripts/heroku.sh verify             prove the live dyno runs the last deployed commit
#   bash backend/scripts/heroku.sh status             dynos, release, /healthz
#   bash backend/scripts/heroku.sh logs               tail the logs
#   bash backend/scripts/heroku.sh open               open /admin/ in the browser
#   bash backend/scripts/heroku.sh tree [ref]         print the tree deploy would push for ref (default HEAD)
#
# Why the deploy is not a plain `git push heroku main`: the repo root is the GitHub Pages site, and Heroku wants
# package.json and the Procfile at the root of what it receives. So deploy makes a commit (git commit-tree, no git
# subtree needed) on top of what Heroku already has, and pushes that. Its tree keeps the repo's layout, so the server
# finds the website and the admin where it does in a checkout: backend/, frontends/ without the app (the website, the
# admin, common/ and their workspace files), and at the root heroku/'s package.json, lock file and Procfile, which build
# the frontends and the server and start the server. The app the backend serves at /app/ is added as
# backend/app-web/: the page built from the same commit's source files (what Pages deploys from it) and its icon.
set -euo pipefail

# Always the checkout this script sits in. Git exports GIT_DIR and friends to hooks; with GIT_DIR set, git takes the
# current folder for the top of the checkout, the prefix below reads empty, and the deploy tree would be the whole repo.
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_PREFIX
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

# The page /app/ serves for a ref, as a blob: built from that ref's source files with that ref's own builder
# (frontends/app/scripts/build-index.mjs; exactly what Pages deploys from that commit); a ref from before the sources
# existed carries it as its root index.html.
# Runs in a command substitution, which set -e does not reach, so every step that can fail dies by name.
app_page_blob() {
  local ref="$1" tmp
  if git cat-file -e "$ref:frontends/app/scripts/build-index.mjs" 2>/dev/null; then
    tmp="$(mktemp -d)"
    # git archive takes paths from the current folder (backend/); from the top they name the repo's layout.
    git -C "$(git rev-parse --show-toplevel)" archive "$ref" frontends/app/scripts/build-index.mjs frontends/app/src/legacy/src |
      tar -x -C "$tmp" || die "cannot extract the app's source files at $ref"
    node --input-type=module -e "process.stdout.write((await import(process.argv[1])).buildIndex())" \
      "$tmp/frontends/app/scripts/build-index.mjs" > "$tmp/index.html" || die "the app's source files at $ref do not build"
    [ -s "$tmp/index.html" ] || die "the page built at $ref is empty"
    git hash-object -w "$tmp/index.html" || die "cannot store the page built at $ref"
    rm -rf "$tmp"
  else
    git rev-parse --verify --quiet "$ref:index.html" || die "no index.html at $ref"
  fi
}

# The tree deploy pushes for a ref: backend/ with app-web/ holding the page built from that ref and its
# apple-touch-icon.png (what the server serves at /app/, the same files Pages deploys; locally scripts/app-bundle.ts
# fills app-web/ from the working copy instead), frontends/ without the app, and backend/heroku/'s package.json,
# package-lock.json and Procfile at the root.
deploy_tree() {
  local ref="$1" app_tree backend_tree frontends_tree file blob page icon
  page="$(app_page_blob "$ref")" || exit 1
  icon="$(git rev-parse --verify --quiet "$ref:apple-touch-icon.png" || git rev-parse --verify --quiet "$ref:frontends/app/public/apple-touch-icon.png" || true)"
  app_tree="$(
    printf '100644 blob %s\t%s\n' "$page" index.html
    if [ -n "$icon" ]; then printf '100644 blob %s\t%s\n' "$icon" apple-touch-icon.png; fi
  )"
  app_tree="$(printf '%s\n' "$app_tree" | git mktree)"
  backend_tree="$({ git ls-tree --full-tree "$ref:$PREFIX" | grep -v "	app-web$" || true; printf '040000 tree %s\tapp-web\n' "$app_tree"; } | git mktree)"
  frontends_tree="$({ git ls-tree --full-tree "$ref:frontends" || die "no frontends/ at $ref"; } | { grep -v "	app$" || true; } | git mktree)"
  {
    for file in package.json package-lock.json Procfile; do
      blob="$(git rev-parse --verify --quiet "$ref:$PREFIX/heroku/$file")" || die "no $PREFIX/heroku/$file at $ref"
      printf '100644 blob %s\t%s\n' "$blob" "$file"
    done
    printf '040000 tree %s\t%s\n' "$backend_tree" "$PREFIX"
    printf '040000 tree %s\tfrontends\n' "$frontends_tree"
  } | git mktree
}

cmd_deploy() {
  need_cli
  local app; app="$(app_name)"

  # Deploy what passed the pipeline: backend/ as it is on origin/main, which only a pull request from dev whose checks
  # passed can change (.github/workflows/pipeline.yml). HEROKU_DEPLOY_REF=<ref> deploys another ref, for an emergency.
  local ref="${HEROKU_DEPLOY_REF:-origin/main}"
  if [ "$ref" = "origin/main" ]; then git fetch --quiet origin main || die "cannot read origin/main"; fi
  local source tree parent commit
  source="$(git rev-parse --short "$ref")" || die "no such ref: $ref"
  tree="$(deploy_tree "$ref")"
  if [ "$(git rev-parse "HEAD:$PREFIX" 2>/dev/null)" != "$(git rev-parse "$ref:$PREFIX")" ] || [ -n "$(git status --porcelain -- .)" ]; then
    echo "Note: this checkout's backend/ differs from $ref's. Deploying $ref's; yours ships once it is merged dev -> main."
  fi
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
  tree) deploy_tree "${2:-HEAD}" ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
