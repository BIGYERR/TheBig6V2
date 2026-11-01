#!/usr/bin/env bash
# Stands up a new project from this kit: copies it, fills in the names, installs, makes the first commit (through the
# pre-commit check) and leaves you on dev. Everything it does is local; GitHub and Heroku come after (the playbook's
# day-one checklist, docs/playbook/README.md).
#
#   bash scaffold.sh <new-folder> --project "Display Name" --owner <github-owner> --repo <RepoName>
#        [--slug <kebab-name>] [--heroku-app <name>] [--owner-name <who releases>] [--port <local port>] [--no-install]
#
#   --slug         package, compose project and service name (default: the repo name in kebab case)
#   --heroku-app   the Heroku app's name (default: the slug)
#   --owner-name   who picks the bump and opens the pull requests, named in CLAUDE.md (default: Mario)
#   --port         the local port of its Docker containers (default 3001: Iron Asylum's dev container holds 3000)
#   --no-install   copy and fill in only: no npm install, no git
set -euo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
die() { echo "scaffold: $*" >&2; exit 1; }
need() { [ $# -ge 2 ] && [ -n "$2" ] || die "$1 needs a value"; }

target="" project="" owner="" repo="" slug="" heroku="" owner_name="Mario" port="3001" install=1
while [ $# -gt 0 ]; do
  case "$1" in
    --project) need "$@"; project="$2"; shift 2 ;;
    --owner) need "$@"; owner="$2"; shift 2 ;;
    --repo) need "$@"; repo="$2"; shift 2 ;;
    --slug) need "$@"; slug="$2"; shift 2 ;;
    --heroku-app) need "$@"; heroku="$2"; shift 2 ;;
    --owner-name) need "$@"; owner_name="$2"; shift 2 ;;
    --port) need "$@"; port="$2"; shift 2 ;;
    --no-install) install=""; shift ;;
    -h|--help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) die "unknown option $1 (--help)" ;;
    *) [ -z "$target" ] || die "one target folder, not two ($target, $1)"; target="$1"; shift ;;
  esac
done
[ -n "$target" ] && [ -n "$project" ] && [ -n "$owner" ] && [ -n "$repo" ] || die "usage: bash scaffold.sh <new-folder> --project \"Name\" --owner <github-owner> --repo <RepoName> (--help)"
slug="${slug:-$(printf '%s' "$repo" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]' | tr ' _.' '---')}"
heroku="${heroku:-$slug}"
[[ "$slug" =~ ^[a-z][a-z0-9-]*$ ]] || die "slug '$slug' must be lower case letters, digits and dashes (--slug)"
[[ "$heroku" =~ ^[a-z][a-z0-9-]{2,29}$ ]] || die "Heroku app name '$heroku' must be 3 to 30 lower case letters, digits and dashes (--heroku-app)"
[[ "$port" =~ ^[0-9]+$ ]] || die "port '$port' is not a number"
case "$target" in "$KIT"|"$KIT"/*) die "the target cannot be inside the kit" ;; esac
case "$(cd "$(dirname "$target")" 2>/dev/null && pwd -P)" in
  "$HOME/Library/Mobile Documents"*|"$HOME/Desktop"*|"$HOME/Documents"*) echo "scaffold: warning: $target may sync to iCloud, which corrupts .git; ~/Developer is safer" >&2 ;;
esac
if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null)" ]; then die "$target exists and is not empty"; fi

mkdir -p "$target"
target="$(cd "$target" && pwd -P)"
(cd "$KIT" && tar --exclude=./scaffold.sh --exclude=./README.md --exclude=node_modules --exclude=./backend/dist -cf - .) | tar -xf - -C "$target"
cd "$target"
mv gitignore .gitignore
mv CLAUDE.template.md CLAUDE.md
mkdir -p .claude docs/decisions
mv claude-settings.json .claude/settings.json

# Fill in the names. perl reads each value from the environment, so no character in a name can break the expression.
export KIT_PROJECT="$project" KIT_SLUG="$slug" KIT_OWNER="$owner" KIT_REPO="$repo" KIT_HEROKU_APP="$heroku" \
  KIT_OWNER_NAME="$owner_name" KIT_PORT="$port"
KIT_OWNER_LC="$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')"
KIT_REPO_LC="$(printf '%s' "$repo" | tr '[:upper:]' '[:lower:]')"
export KIT_OWNER_LC KIT_REPO_LC
grep -rl --null '__[A-Z_]*__' . | xargs -0 perl -pi -e '
  s/__PROJECT__/$ENV{KIT_PROJECT}/g; s/__SLUG__/$ENV{KIT_SLUG}/g; s/__OWNER_LC__/$ENV{KIT_OWNER_LC}/g;
  s/__REPO_LC__/$ENV{KIT_REPO_LC}/g; s/__OWNER_NAME__/$ENV{KIT_OWNER_NAME}/g; s/__OWNER__/$ENV{KIT_OWNER}/g;
  s/__REPO__/$ENV{KIT_REPO}/g; s/__HEROKU_APP__/$ENV{KIT_HEROKU_APP}/g; s/__PORT__/$ENV{KIT_PORT}/g;'
left="$(grep -rnoE '__[A-Z][A-Z_]*__' . || true)"
[ -z "$left" ] || die "placeholders left unfilled:
$left"
chmod +x .githooks/* backend/scripts/heroku.sh tools/*.mjs

cat > docs/decisions/README.md <<EOF
# Decisions

One file per feature, \`<feature>.md\`. Each entry: its date, who decided, the finding, what changes, what deliberately
does not, the expected values, and the release that shipped it (filled in at ship time). A re-decision is a new entry
naming the one it amends.
EOF

echo "scaffold: $project copied to $target (slug $slug, Heroku app $heroku, port $port)."
if [ -z "$install" ]; then
  echo "scaffold: --no-install: run npm install in backend/ and npm install --package-lock-only at the root, then git init."
  exit 0
fi

echo "scaffold: installing backend/ (writes its package-lock.json) and the root lock file Heroku's npm ci needs."
(cd backend && npm install --no-audit --no-fund)
npm install --package-lock-only --no-audit --no-fund

git init -q -b main
git config core.hooksPath .githooks
git add .
git commit -q -m "Scaffold $project from Iron Asylum's starter kit"
git switch -q -c dev
echo
echo "scaffold: done. $target is on dev, with one commit that passed the 60-second check."
echo "Next: the day-one checklist in Iron Asylum's docs/playbook/README.md (GitHub repo, branch protection, Heroku)."
