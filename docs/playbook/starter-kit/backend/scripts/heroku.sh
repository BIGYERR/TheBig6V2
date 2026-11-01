#!/usr/bin/env bash
# Heroku helper. Run from anywhere in the repo:
#   bash backend/scripts/heroku.sh setup [app-name]   create or adopt the app, turn on runtime-dyno-metadata, add the
#                                                     git remote, remember the app's URL for tools/deploy-check.mjs
#   bash backend/scripts/heroku.sh verify [commit]    prove the live dyno runs commit (default origin/main)
#   bash backend/scripts/heroku.sh deploy             the manual path: push origin/main to Heroku, then verify
#   bash backend/scripts/heroku.sh status             dynos, releases, /healthz
#   bash backend/scripts/heroku.sh logs               tail the logs
#   bash backend/scripts/heroku.sh local [ref]        build and run what Heroku would, on this machine
#                                                     (--check: stop after the read-back; --online: npm may fetch)
#
# Heroku deploys the branch main by itself (automatic deploys from GitHub, turned on once in the dashboard), and main
# changes only through a pull request whose checks passed (.github/workflows/pipeline.yml). The root package.json is
# Heroku's manifest, its build builds backend/, and the Procfile starts the server. deploy here is for the day the
# automatic deploy does not fire.
set -euo pipefail

# Always the checkout this script sits in. Git exports GIT_DIR and friends to hooks; with GIT_DIR set, git takes the
# current folder for the top of the checkout.
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_PREFIX
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
REMOTE="${HEROKU_REMOTE:-heroku}"
DEFAULT_APP="__HEROKU_APP__"

die() { echo "heroku.sh: $*" >&2; exit 1; }

need_cli() {
  command -v heroku >/dev/null 2>&1 || die "install the Heroku CLI first: brew tap heroku/brew && brew install heroku"
  heroku auth:whoami >/dev/null 2>&1 || die "log in first: heroku login"
}

app_name() {
  local url
  url="$(git remote get-url "$REMOTE" 2>/dev/null)" || die "no '$REMOTE' remote; run: bash backend/scripts/heroku.sh setup"
  basename "$url" .git
}

web_url() {
  heroku apps:info -a "$1" --json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).app.web_url.replace(/\/$/,"")))'
}

cmd_setup() {
  local app="${1:-${HEROKU_APP:-$DEFAULT_APP}}" url
  need_cli
  if heroku apps:info -a "$app" >/dev/null 2>&1; then
    echo "Using the existing app $app."
  else
    echo "Creating $app."
    heroku create "$app" --no-remote
  fi
  heroku buildpacks:set heroku/nodejs -a "$app" >/dev/null 2>&1 || true
  # Puts HEROKU_SLUG_COMMIT in the dyno's environment, so /healthz can say which commit is live. Without it no deploy
  # can be proved. It takes effect from the next deploy.
  heroku labs:enable runtime-dyno-metadata -a "$app" >/dev/null 2>&1 ||
    heroku labs -a "$app" | grep -q '\[+\].*runtime-dyno-metadata' ||
    die "could not turn on runtime-dyno-metadata; the deploy proof needs it"
  heroku config:set NODE_ENV=production -a "$app" >/dev/null

  if git remote get-url "$REMOTE" >/dev/null 2>&1; then
    git remote set-url "$REMOTE" "https://git.heroku.com/$app.git"
  else
    git remote add "$REMOTE" "https://git.heroku.com/$app.git"
  fi
  # New Heroku apps get a random suffix in their URL, so it is read back, never guessed. Kept in this clone's git config
  # (not committed); tools/deploy-check.mjs reads it.
  url="$(web_url "$app")"
  git config --local deploy.herokuUrl "$url"

  echo
  echo "Ready. App $app at $url, git remote '$REMOTE'."
  echo "Two settings remain, each on an outside service, so each is yours to make:"
  echo "  1. Heroku dashboard > $app > Deploy: connect GitHub __OWNER__/__REPO__, then Enable Automatic Deploys from main."
  echo "  2. gh variable set HEROKU_URL --body $url   (the pipeline's deploy proof reads it)"
}

# A push is not a deploy: tools/deploy-check.mjs polls /healthz, cache-busted, until it reports the commit.
cmd_verify() {
  local want="${1:-}"
  if [ -z "$want" ]; then
    git fetch --quiet origin main || die "cannot read origin/main"
    want="$(git rev-parse origin/main)"
  fi
  node "$ROOT/tools/deploy-check.mjs" --commit "$want"
}

cmd_deploy() {
  need_cli
  app_name >/dev/null
  git fetch --quiet origin main || die "cannot read origin/main"
  local commit
  commit="$(git rev-parse origin/main)"
  echo "Deploying origin/main ($(git rev-parse --short "$commit")) to $(app_name)."
  git push "$REMOTE" "$commit:refs/heads/main"
  cmd_verify "$commit"
}

# Heroku's build and dyno on this machine, with no Heroku CLI. The tree is what Heroku's GitHub deploy receives: a
# ref's files, or with no ref this checkout's tracked and new files as they are on disk. It is built in
# temp/heroku-local/slug the way the Node buildpack builds it (NODE_ENV=production; heroku-prebuild; npm ci at the root;
# heroku-postbuild, else build; the dev dependencies pruned; heroku-cleanup). npm is held offline unless --online, so a
# local run never asks the registry (CI passes --online). Then the Procfile's web process starts with the variables a
# dyno has, and / and /healthz are read back. It stays up until Ctrl-C; --check stops after the read-back and exits
# non-zero if any read failed. PORT moves it off 5006.
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
  local out slug port url commit label web
  out="$ROOT/temp/heroku-local"
  slug="$out/slug"
  port="${PORT:-5006}"
  url="http://localhost:$port"
  curl -s -o /dev/null "$url" 2>/dev/null && die "something already answers on port $port; PORT=<another> moves this run"

  rm -rf "$slug"
  mkdir -p "$slug"
  if [ -n "$ref" ]; then
    commit="$(git rev-parse --verify --quiet "$ref^{commit}")" || die "no such ref: $ref"
    label="$ref ($(git rev-parse --short "$commit"))"
    git archive "$commit" | tar -x -C "$slug" || die "cannot extract $ref"
  else
    commit="$(git rev-parse HEAD)"
    label="this checkout (HEAD $(git rev-parse --short HEAD))"
    [ -z "$(git status --porcelain)" ] || label="this checkout (HEAD $(git rev-parse --short HEAD) with its uncommitted changes)"
    # Tracked and new files, as they are on disk: not the ignored ones, and not the tracked ones deleted from disk.
    git ls-files -z -co --exclude-standard | while IFS= read -r -d '' f; do [ -e "$f" ] && printf '%s\0' "$f"; done |
      tar --null -T - -cf - | tar -x -C "$slug" || die "cannot copy this checkout"
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
    echo "heroku local: warning: Heroku runs Node $engine; this machine runs $have, so the build here may differ" >&2
  fi

  local npm_env=(NODE_ENV=production NPM_CONFIG_LOGLEVEL=error) hint=""
  if [ -z "$online" ]; then
    npm_env+=(npm_config_offline=true)
    hint=" (npm is offline: a package missing from this machine's npm cache fails here; run it once with --online)"
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

  # The dyno: the Procfile's command, with what Heroku puts in a dyno's environment (DYNO makes the server say heroku;
  # HEROKU_SLUG_COMMIT is what /healthz reports). pid is a global: the EXIT trap that stops it runs after this
  # function has returned.
  pid=""
  echo "-----> Starting web: $web"
  (cd "$slug" && exec env PORT="$port" NODE_ENV=production DYNO=web.1 HEROKU_APP_NAME=heroku-local \
    HEROKU_SLUG_COMMIT="$commit" HEROKU_RELEASE_VERSION=local bash -c "$web") &
  pid=$!
  stop_web() {
    if [ -n "${pid:-}" ]; then
      pkill -TERM -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  }
  trap stop_web EXIT
  local up="" _
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "$url/healthz" 2>/dev/null; then up=1; break; fi
    kill -0 "$pid" 2>/dev/null || die "the web process exited before it answered (its output is above)"
    sleep 0.5
  done
  [ -n "$up" ] || die "the web process did not answer $url/healthz within 30 s"

  local fails=0 code health
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url/" || true)"
  if [ "$code" = 200 ]; then echo "       ok    /  answers 200"; else echo "       FAIL  /  answered HTTP $code"; fails=$((fails + 1)); fi
  health="$(curl -s "$url/healthz" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const h=JSON.parse(s);console.log(h.ok===true?`${h.backend} ${h.commit}`:"not ok")}catch{console.log("not JSON")}})')"
  if [ "$health" = "heroku $commit" ]; then
    echo "       ok    /healthz  heroku, commit $(git rev-parse --short "$commit")"
  else
    echo "       FAIL  /healthz  reports '$health', wanted 'heroku $commit'"; fails=$((fails + 1))
  fi
  [ "$fails" = 0 ] || die "$fails of the read-backs failed"

  if [ -n "$check" ]; then
    echo "-----> All read-backs passed; stopped (--check)."
    return 0
  fi
  echo "-----> Up as Heroku would run it: $url/ . Ctrl-C stops it."
  wait "$pid"
}

cmd_status() {
  need_cli
  local app; app="$(app_name)"
  heroku ps -a "$app"
  heroku releases -a "$app" -n 3
  curl -fsS "$(web_url "$app")/healthz?cb=$(date +%s)"; echo
}

case "${1:-}" in
  setup) shift; cmd_setup "$@" ;;
  verify) shift; cmd_verify "$@" ;;
  deploy) cmd_deploy ;;
  status) cmd_status ;;
  logs) need_cli; heroku logs --tail -a "$(app_name)" ;;
  local) shift; cmd_local "$@" ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
