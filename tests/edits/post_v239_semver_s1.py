#!/usr/bin/env python3
# Post-V239 semver, slice 1 of ~5 (tests only, no build; ia-version does not move).
# Ruling (Mario): ia-version is MAJOR.MINOR.PATCH held as three integers; every past build N is 0.N.0.
# New files tests/semver.js and tests/semver.py are written whole (not by this script); this script makes the
# anchored edits to the three readers: tests/harness.js (meta read through semver.parse, IA.version stays the raw
# string), tests/gate.sh step 0 (any meta text, validated by semver.js str, filename invariant through semver.js cmp),
# tests/rows.js VERSION_CAUSE (a dotted triple names a version too).
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

EDITS = {
'tests/harness.js': [
(
"const vm = require('vm');\n",
"const vm = require('vm');\n"
"const semver = require(path.join(__dirname, 'semver.js'));   // ia-version is M.m.p; a legacy integer N reads as 0.N.0\n",
),
(
"  const version = (html.match(/<meta name=\"ia-version\" content=\"(\\d+)\"/)||[])[1];\n"
"  if(!version) throw new Error('harness: no ia-version meta in '+abs);\n",
"  const version = (html.match(/<meta name=\"ia-version\" content=\"([^\"]*)\"/)||[])[1];\n"
"  if(version === undefined) throw new Error('harness: no ia-version meta in '+abs);\n"
"  try { semver.parse(version); } catch(e){ throw new Error('harness: ia-version meta \"'+version+'\" does not parse in '+abs+' ('+e.message+')'); }\n"
"  // IA.version stays the raw meta text (gates read it as a string); compare it only through semver.cmp / semver.lookup.\n",
),
],
'tests/gate.sh': [
(
"echo \"== 0. version / filename invariant\"\n"
"META=\"$(grep -oE '<meta name=\"ia-version\" content=\"[0-9]+\"' \"$CAND\" | grep -oE '[0-9]+' | tail -1)\"\n"
"FNV=\"$(basename \"$CAND\" | grep -o 'V[0-9]*' | tr -d V || true)\"\n"
"echo \"   meta=$META filename=${FNV:-index}\"\n"
"if [ -n \"$FNV\" ] && [ \"$FNV\" != \"$META\" ]; then echo \"FAIL: ia-version ($META) != filename (V$FNV)\"; exit 1; fi\n",
"echo \"== 0. version / filename invariant\"\n"
"# Post-V239 semver: the meta is M.m.p, or a legacy integer N that reads as 0.N.0 (tests/semver.js). META stays the raw\n"
"# meta text, so these lines and the manifest run line print as before on a legacy artifact. The filename carries the\n"
"# legacy V<N> or v<M.m.p> (lowercase v and a dotted triple; v<N> alone names nothing), compared through semver.js cmp.\n"
"META=\"$(grep -oE '<meta name=\"ia-version\" content=\"[^\"]*\"' \"$CAND\" | tail -1 | cut -d'\"' -f4 || true)\"\n"
"FNP=v; FNV=\"$(basename \"$CAND\" | grep -oE 'v[0-9]+\\.[0-9]+\\.[0-9]+' | tr -d v || true)\"\n"
"if [ -z \"$FNV\" ]; then FNP=V; FNV=\"$(basename \"$CAND\" | grep -o 'V[0-9]*' | tr -d V || true)\"; fi\n"
"echo \"   meta=$META filename=${FNV:-index}\"\n"
"if ! grep -qE '<meta name=\"ia-version\" content=\"[^\"]*\"' \"$CAND\"; then echo \"FAIL: ia-version: no <meta name=\\\"ia-version\\\"> in $CAND, so the version does not parse\"; exit 1; fi\n"
"MSTR=\"$(node \"$HERE/semver.js\" str \"$META\" 2>&1)\" || { echo \"FAIL: ia-version ($META) does not parse as a version: $MSTR\"; exit 1; }\n"
"if [ -n \"$FNV\" ]; then\n"
"  FCMP=\"$(node \"$HERE/semver.js\" cmp \"$FNV\" \"$META\" 2>&1)\" || { echo \"FAIL: ia-version ($META) != filename ($FNP$FNV): the filename version does not parse: $FCMP\"; exit 1; }\n"
"  if [ \"$FCMP\" != \"0\" ]; then echo \"FAIL: ia-version ($META) != filename ($FNP$FNV)\"; exit 1; fi\n"
"fi\n",
),
],
'tests/rows.js': [
(
"//                    names a version (VERSION_CAUSE below: a V-number, a 3-digit build number, ia-version, era), and a\n",
"//                    names a version (VERSION_CAUSE below: a V-number, a 3-digit build number, a dotted M.m.p version,\n"
"//                    ia-version, era), and a\n",
),
(
"const VERSION_CAUSE = /\\bV\\d+\\b|\\b\\d{3}\\b|\\bia-version\\b|\\beras?\\b/i;   // a V-number, a 3-digit build number, ia-version, era\n",
"const VERSION_CAUSE = /\\bV\\d+\\b|\\b\\d{3}\\b|\\bv?\\d+\\.\\d+\\.\\d+\\b|\\bia-version\\b|\\beras?\\b/i;   // a V-number, a 3-digit build number, a dotted M.m.p (v optional), ia-version, era\n",
),
(
"the cause names a version (a V-number, a 3-digit build number, ia-version or era)",
"the cause names a version (a V-number, a 3-digit build number, a dotted M.m.p version, ia-version or era)",
),
],
}

out = {}
for rel, pairs in EDITS.items():
    p = os.path.join(ROOT, rel)
    s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            sys.exit('ABORT: %s anchor count %d (want 1): %r' % (rel, n, old[:120]))
        s = s.replace(old, new)
    out[p] = s
for p, s in out.items():
    open(p, 'w', encoding='utf-8').write(s)
    print('wrote', os.path.relpath(p, ROOT))
