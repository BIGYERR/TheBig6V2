#!/usr/bin/env bash
# Heroku helper for the backend. Run from anywhere in the repo:
#   bash backend/scripts/heroku.sh setup <app-name>   create or adopt the app, set config vars, add the git remote
#   bash backend/scripts/heroku.sh deploy             push origin/main's backend/ to Heroku, then prove it is live
#   bash backend/scripts/heroku.sh verify [commit]    prove the live dyno runs commit (default origin/main)
#   bash backend/scripts/heroku.sh status             dynos, release, /healthz
#   bash backend/scripts/heroku.sh logs               tail the logs
#   bash backend/scripts/heroku.sh open               open /admin/ in the browser
#   bash backend/scripts/heroku.sh tree [ref]         print the tree deploy would push for ref (default HEAD)
#   bash backend/scripts/heroku.sh local [ref]        build and run what Heroku would, on this Mac and offline
#                                                     (--check: stop after the read-back; --online: npm may fetch)
#
# Heroku deploys the branch main by itself (automatic deploys from GitHub, Mario, Post-v0.242.0; main changes only
# through a pull request whose checks passed):
# the repo root's package.json, lock file and Procfile build the frontends and the server, the server's build builds the
# app's page from its source files, and the Procfile starts the server. deploy here is the manual path, for when that
# does not fire or a ref other than main has to go out. It pushes a smaller tree than the whole repo: deploy makes a
# commit (git commit-tree, no git subtree needed) on top of what Heroku's git already has, and pushes that. Its tree
# keeps the repo's layout, so the server finds the website and the admin where it does in a checkout: backend/,
# frontends/ without the app (the website, the admin, common/ and their workspace files), and the root's package.json,
# lock file and Procfile. The app the backend serves at /app/ is added as backend/app-web/: the page built from the same
# commit's source files (what Pages deploys from it) and its icon.
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
    # Its real path: macOS hands out /var/folders/..., a symlink, and a run here should walk the path Linux CI walks.
    tmp="$(cd "$(mktemp -d)" && pwd -P)" || die "cannot make a temporary folder"
    # git archive takes paths from the current folder (backend/); from the top they name the repo's layout. The
    # engine's files are TypeScript in core/src/engine from architecture phase D on, built into the same page.
    local core=""
    git cat-file -e "$ref:core/src" 2>/dev/null && core="core/src"
    git -C "$(git rev-parse --show-toplevel)" archive "$ref" frontends/app/scripts/build-index.mjs frontends/app/src/legacy/src $core |
      tar -x -C "$tmp" || die "cannot extract the app's source files at $ref"
    # The builder's path goes in the environment, never in argv[1]: build-index.mjs runs its own command line when
    # argv[1] is its own path, which is what `node -e ... <path>` makes it wherever no symlink sits in the temp path
    # (Linux /tmp; macOS hid it behind /var -> /private/var), and that writes files the archive does not hold.
    IA_BUILD_INDEX="$tmp/frontends/app/scripts/build-index.mjs" \
      node --input-type=module -e "process.stdout.write((await import(process.env.IA_BUILD_INDEX)).buildIndex())" \
      > "$tmp/index.html" || die "the app's source files at $ref do not build"
    [ -s "$tmp/index.html" ] || die "the page built at $ref is empty"
    git hash-object -w "$tmp/index.html" || die "cannot store the page built at $ref"
    rm -rf "$tmp"
  else
    git rev-parse --verify --quiet "$ref:index.html" || die "no index.html at $ref"
  fi
}

# The tree deploy pushes for a ref: backend/ with app-web/ holding the page built from that ref and its
# apple-touch-icon.png (what the server serves at /app/, the same files Pages deploys; locally scripts/app-bundle.ts
# fills app-web/ from the working copy instead), frontends/ without the app, and the ref's root package.json,
# package-lock.json and Procfile.
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
      blob="$(git rev-parse --verify --quiet "$ref:$file")" || die "no $file at the root of $ref"
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

# A push is not a deploy. Poll /healthz, cache-busted, until it reports the commit that was pushed. With no commit
# given, that is origin/main, which Heroku deploys from GitHub; a manual deploy passes the commit it made.
cmd_verify() {
  need_cli
  local app want url got=""
  app="$(app_name)"
  want="${1:-}"
  if [ -z "$want" ]; then
    git fetch --quiet origin main || die "cannot read origin/main"
    want="$(git rev-parse origin/main)"
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

# Heroku's build and dyno on this Mac, offline, with no Heroku CLI. The tree is what Heroku's GitHub deploy receives: a
# ref's files, or with no ref this checkout's tracked and new files as they are on disk. It is built in
# temp/heroku-local/slug the way the Node buildpack builds it (NODE_ENV=production; heroku-prebuild; npm ci at the root;
# heroku-postbuild, else build; the dev dependencies pruned; heroku-cleanup), with npm held offline: it installs from
# this Mac's npm cache and never asks the registry (--online lets it). Then the Procfile's web process starts with the
# variables a dyno has, and the website, the admin, the app and /healthz are read back. It stays up until Ctrl-C;
# --check stops it after the read-back and exits non-zero if any read failed. PORT moves it off 5006.
cmd_local() {
  local ref="" check="" online="" arg
  for arg in "$@"; do
    case "$arg" in
      --check) check=1 ;;
      --online) online=1 ;;
      -*) die "local: unknown option $arg (--check, --online)" ;;
      *) ref="$arg" ;;
    esac
  done
  local top out slug port url commit label web
  top="$(git rev-parse --show-toplevel)"
  out="$top/temp/heroku-local"
  slug="$out/slug"
  port="${PORT:-5006}"
  url="http://localhost:$port"
  curl -s -o /dev/null "$url" 2>/dev/null && die "something already answers on port $port; PORT=<another> moves this run"

  rm -rf "$slug"
  mkdir -p "$slug"
  if [ -n "$ref" ]; then
    commit="$(git rev-parse --verify --quiet "$ref^{commit}")" || die "no such ref: $ref"
    label="$ref ($(git rev-parse --short "$commit"))"
    git -C "$top" archive "$commit" | tar -x -C "$slug" || die "cannot extract $ref"
  else
    commit="$(git rev-parse HEAD)"
    label="this checkout (HEAD $(git rev-parse --short HEAD))"
    [ -z "$(git -C "$top" status --porcelain)" ] || label="this checkout (HEAD $(git rev-parse --short HEAD) with its uncommitted changes)"
    # Tracked and new files, as they are on disk: not the ignored ones, and not the tracked ones deleted from disk.
    (cd "$top" && git ls-files -z -co --exclude-standard | while IFS= read -r -d '' f; do [ -e "$f" ] && printf '%s\0' "$f"; done |
      tar --null -T - -cf -) | tar -x -C "$slug" || die "cannot copy this checkout"
  fi

  # Detect, as the buildpack does: a package.json at the root, and the Procfile's web process.
  [ -f "$slug/package.json" ] || die "no package.json at the root of $label: Heroku's Node buildpack would not detect the app"
  [ -f "$slug/Procfile" ] || die "no Procfile at the root of $label: Heroku would start no web process"
  web="$(sed -n 's/^web:[[:space:]]*//p' "$slug/Procfile")"
  [ -n "$web" ] || die "the Procfile at the root of $label has no web process"
  local engine have
  engine="$(SLUG="$slug" node -p 'require(process.env.SLUG + "/package.json").engines?.node ?? ""')"
  have="$(node -p process.versions.node)"
  if [[ "$engine" =~ ^([0-9]+)\.x$ ]] && [ "${BASH_REMATCH[1]}" != "${have%%.*}" ]; then
    echo "heroku local: warning: Heroku runs Node $engine; this Mac runs $have, so the build here may differ" >&2
  fi

  local npm_env=(NODE_ENV=production NPM_CONFIG_LOGLEVEL=error NG_CLI_ANALYTICS=false) hint=""
  if [ -z "$online" ]; then
    npm_env+=(npm_config_offline=true)
    hint=" (npm is offline: a package missing from this Mac's npm cache fails here; run it once with --online)"
  fi
  in_slug() { (cd "$slug" && env "${npm_env[@]}" "$@"); }
  has_script() { SLUG="$slug" node -e 'process.exit(require(process.env.SLUG + "/package.json").scripts?.[process.argv[1]] ? 0 : 1)' "$1"; }

  local started=$SECONDS build=build
  echo "-----> Building $label in temp/heroku-local/slug, Node $have, npm $([ -n "$online" ] && echo online || echo offline)"
  if has_script heroku-prebuild; then
    echo "-----> npm run heroku-prebuild"; in_slug npm run heroku-prebuild || die "heroku-prebuild failed$hint"
  fi
  echo "-----> Installing dependencies: npm ci"
  in_slug npm ci --no-audit --no-fund || die "npm ci at the root failed$hint"
  has_script heroku-postbuild && build=heroku-postbuild
  echo "-----> Build: npm run $build"
  in_slug npm run "$build" || die "npm run $build failed$hint"
  echo "-----> Pruning devDependencies"
  in_slug npm prune --omit=dev --no-audit --no-fund || die "npm prune failed$hint"
  if has_script heroku-cleanup; then
    echo "-----> npm run heroku-cleanup"; in_slug npm run heroku-cleanup || die "heroku-cleanup failed$hint"
  fi
  echo "-----> Built in $((SECONDS - started)) s; the slug is $(du -sh "$slug" | cut -f1) before compression (Heroku's limit: 500 MB compressed)"

  # The dyno: the Procfile's command, with what Heroku puts in a dyno's environment (DYNO makes the server say heroku
  # and trust the router's forwarded headers; HEROKU_SLUG_COMMIT is what /healthz reports, runtime-dyno-metadata's).
  # It listens on its own PORT, as a dyno does; $port is the router's.
  # pid and router are globals, not locals: the EXIT trap that stops them runs after this function has returned.
  local admin_user="${ADMIN_USER:-admin}" admin_pass="${ADMIN_PASSWORD:-asylum}" dyno_port=$((port + 1))
  pid=""
  router=""
  curl -s -o /dev/null "http://localhost:$dyno_port" 2>/dev/null && die "something already answers on port $dyno_port, the dyno's; PORT=<another> moves this run"
  echo "-----> Starting web: $web"
  (cd "$slug" && exec env PORT="$dyno_port" NODE_ENV=production DYNO=web.1 HEROKU_APP_NAME=heroku-local \
    HEROKU_SLUG_COMMIT="$commit" HEROKU_RELEASE_VERSION=local ADMIN_USER="$admin_user" ADMIN_PASSWORD="$admin_pass" \
    bash -c "$web") &
  pid=$!
  # Heroku's router, for this Mac: it ends TLS, so it hands the dyno every request as one that arrived over https,
  # with the caller in X-Forwarded-For. Without it the server, trusting a router that is not there, sends every plain
  # http request to https (308), as Heroku itself does for http://.
  ROUTER_PORT="$port" DYNO_PORT="$dyno_port" node -e '
    const http = require("node:http");
    http.createServer((req, res) => {
      const headers = { ...req.headers, "x-forwarded-proto": "https", "x-forwarded-port": "443", "x-forwarded-for": req.socket.remoteAddress };
      const up = http.request({ host: "127.0.0.1", port: +process.env.DYNO_PORT, path: req.url, method: req.method, headers }, (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      });
      up.on("error", (e) => { res.writeHead(503); res.end(`router: the dyno did not answer (${e.code})\n`); });
      req.pipe(up);
    }).listen(+process.env.ROUTER_PORT);' &
  router=$!
  stop_web() {
    local p
    for p in ${pid:-} ${router:-}; do
      pkill -TERM -P "$p" 2>/dev/null || true
      kill "$p" 2>/dev/null || true
      wait "$p" 2>/dev/null || true
    done
  }
  trap stop_web EXIT
  local up="" _
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "$url/healthz" 2>/dev/null; then up=1; break; fi
    kill -0 "$pid" 2>/dev/null || die "the web process exited before it answered (its output is above)"
    kill -0 "$router" 2>/dev/null || die "the local router exited (its output is above)"
    sleep 0.5
  done
  [ -n "$up" ] || die "the web process did not answer $url/healthz within 30 s"

  # The read-back, through the router: every piece the dyno serves, and the app and the commit it serves; then the
  # dyno itself, asked over plain http, sends the caller to https.
  local fails=0 code want_app got_app health redirect
  probe() {
    code="$(curl -s -o "$out/body" -w '%{http_code}' "$url$1" || true)"
    if [ "$code" = 200 ]; then echo "       ok    $1  $2"; else echo "       FAIL  $1  $2: HTTP $code"; fails=$((fails + 1)); fi
  }
  probe / 'the website'
  probe /admin/ 'the admin'
  probe /app/ 'the app'
  got_app="$(sed -nE 's/.*name="ia-version" content="([^"]+)".*/\1/p' "$out/body" | head -1)"
  probe /app/apple-touch-icon.png "the app's icon"
  want_app="$(sed -nE 's/.*name="ia-version" content="([^"]+)".*/\1/p' "$slug/frontends/app/src/legacy/src/html/head.html" 2>/dev/null | head -1)"
  if [ -n "$want_app" ] && [ "$got_app" != "$want_app" ]; then
    echo "       FAIL  /app/ serves ${got_app:-no version}; its sources say $want_app"; fails=$((fails + 1))
  else
    echo "       ok    /app/ serves ${got_app:-no version}"
  fi
  health="$(curl -s "$url/healthz" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const h=JSON.parse(s);console.log(h.ok===true?`${h.backend} ${h.commit}`:"not ok")}catch{console.log("not JSON")}})')"
  if [ "$health" = "heroku $commit" ]; then
    echo "       ok    /healthz  heroku, commit $(git rev-parse --short "$commit")"
  else
    echo "       FAIL  /healthz  reports '$health', wanted 'heroku $commit'"; fails=$((fails + 1))
  fi
  redirect="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://localhost:$dyno_port/admin/" || true)"
  if [ "$redirect" = "308 https://localhost:$dyno_port/admin/" ]; then
    echo "       ok    plain http straight to the dyno is sent to https (308), as on Heroku"
  else
    echo "       FAIL  plain http straight to the dyno answered '$redirect', wanted a 308 to https"; fails=$((fails + 1))
  fi
  rm -f "$out/body"
  [ "$fails" = 0 ] || die "$fails of the read-backs failed"

  if [ -n "$check" ]; then
    echo "-----> All read-backs passed; stopped (--check)."
    return 0
  fi
  echo "-----> Up as Heroku would run it: $url/ (the website), $url/admin/ (admin / asylum unless you exported"
  echo "       ADMIN_USER and ADMIN_PASSWORD), $url/app/ (the app). Ctrl-C stops it."
  wait "$pid"
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
  local) shift; cmd_local "$@" ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
