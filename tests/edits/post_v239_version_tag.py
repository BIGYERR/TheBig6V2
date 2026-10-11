"""Post-V239 version tag pass: every live-version display prints V<N> for a pre-semver build and v<M.m.p> for a dotted
one, through tests/semver.js tag(); rows.js keys a v-prefixed dotted version as V<n> so no row key moves; CI strips a
leading v from the meta before naming the licence file. Anchors are asserted (exact counts) before anything is written."""
import pathlib, re, sys

R = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')
plan = {}   # rel -> new text
errors = []


def sub_exact(rel, text, old, new, want):
    n = text.count(old)
    if n != want:
        errors.append('%s: %r count %d, want %d' % (rel, old[:70], n, want))
    return text.replace(old, new)


def sub_re(rel, text, pat, new, want):
    n = len(re.findall(pat, text))
    if n != want:
        errors.append('%s: /%s/ count %d, want %d' % (rel, pat, n, want))
    return re.sub(pat, new, text)


# ---- tests/semver.js: tag() --------------------------------------------------------------------------------------------
rel = 'tests/semver.js'
t = (R / rel).read_text(encoding='utf-8')
t = sub_exact(rel, t, "module.exports = { SemVer, parse, cmp, lookup, fromHtml, str, bump, below, isSemVer };",
    "// tag: a version as a label prints it (CLAUDE.md, PRIORITY 1). A pre-semver build is V<N> (V239), a dotted version is\n"
    "// v<M.m.p> (v0.239.1). Display only: never compare or key on it. A value that does not parse prints as 'V' + value,\n"
    "// exactly what the old `'V' + version` displays printed, so a log line never throws.\n"
    "function tag(v){\n"
    "  let x;\n"
    "  try { x = parse(v); } catch (e) { return 'V' + String(v); }\n"
    "  if (x.major === Infinity || x.major === -Infinity) return x.toString();\n"
    "  return x.legacy ? 'V' + x.minor : 'v' + str(x);\n"
    "}\n\n"
    "module.exports = { SemVer, parse, cmp, lookup, fromHtml, str, bump, below, tag, isSemVer };", 1)
t = sub_exact(rel, t, "  console.log('PASS ' + pass + ' FAIL ' + fail);\n  return fail ? 1 : 0;\n}",
    "  // labels\n"
    "  row('S13 tag prints a pre-semver build as V<N>: 239, \"239\" and \"V239\" give V239', tag(239) === 'V239' && tag('239') === 'V239' && tag('V239') === 'V239', tag(239) + ' ' + tag('V239'));\n"
    "  row('S13 tag prints a dotted version as v<M.m.p>: \"0.239.1\", \"V0.239.1\" and a parsed 0.240.0', tag('0.239.1') === 'v0.239.1' && tag('V0.239.1') === 'v0.239.1' && tag(parse('0.240.0')) === 'v0.240.0', tag('0.239.1') + ' ' + tag('V0.239.1'));\n"
    "  row('S13 tag never throws: what does not parse prints as V + value, as the old displays did', tag(undefined) === 'Vundefined' && tag(null) === 'Vnull' && tag(NaN) === 'VNaN', tag(undefined) + ' ' + tag(null) + ' ' + tag(NaN));\n"
    "  console.log('PASS ' + pass + ' FAIL ' + fail);\n  return fail ? 1 : 0;\n}", 1)
plan[rel] = t

# ---- tests/rows.js: a v or V before a dotted version keys as V ---------------------------------------------------------
rel = 'tests/rows.js'
t = (R / rel).read_text(encoding='utf-8')
t = sub_exact(rel, t,
    "//   versions       a dotted version is one <n>; a V or v prefix is kept, so a label keys as it did at 239      -> <n>",
    "//   versions       a dotted version is one <n>; a V or v prefix becomes V, so a label keys as it did at 239 -> V<n>", 1)
t = sub_exact(rel, t,
    ".replace(/\\b([vV]?)\\d+\\.\\d+\\.\\d+\\b/g, '$1<n>')   // a dotted version is one <n>, a V/v prefix kept: V0.239.1 keys as V239 did",
    ".replace(/\\b([vV]?)\\d+\\.\\d+\\.\\d+\\b/g, (m, p) => (p ? 'V' : '') + '<n>')   // a dotted version is one <n>, a V/v prefix becomes V: v0.239.1 keys as V239 did", 1)
plan[rel] = t

# ---- .github/workflows/pipeline.yml: a meta written with its own v names the licence once -------------------------------
rel = '.github/workflows/pipeline.yml'
t = (R / rel).read_text(encoding='utf-8')
t = sub_exact(rel, t,
    "          LICENCE=\"tests/measure/v${META}_rulings/v${META}_row_ruled.txt\"",
    "          META=\"${META#v}\"   # a meta written v0.239.1 names the licence v0.239.1, never vv0.239.1 (CLAUDE.md, PRIORITY 1)\n"
    "          LICENCE=\"tests/measure/v${META}_rulings/v${META}_row_ruled.txt\"", 1)
plan[rel] = t

# ---- the gates: every live-version display goes through SV.tag ---------------------------------------------------------
GATES = {
    'g193_budget_floor':         [(r"V' \+ BASE_VER\b", "' + SV.tag(BASE_VER)", 13)],
    'g193_samecard':             [(r"V' \+ IA\.version\b", "' + SV.tag(IA.version)", 1)],
    'g197a_pool_static':         [(r"V' \+ IA\.version\b", "' + SV.tag(IA.version)", 2)],
    'g197b_sweep':               [(r"V' \+ IA\.version\b", "' + SV.tag(IA.version)", 3)],
    'g198_posterior_floor':      [(r"V'\+IA\.version\b", "'+SV.tag(IA.version)", 1)],
    'g199_deload_arbitration':   [(r"V'\+IP\.version\b", "'+SV.tag(IP.version)", 18)],
    'g200_core_tier':            [(r"V'\+IA\.version\b", "'+SV.tag(IA.version)", 4)],
    'g200_pull_arbitration':     [(r"V'\+IP\.version\b", "'+SV.tag(IP.version)", 5)],
    'g202_d108_touchset_freeze': [(r"V' \+ IA\.version\b", "' + SV.tag(IA.version)", 1)],
    'g202_pace_anchor':          [(r"V\$\{IA\.version\}", "${SV.tag(IA.version)}", 1)],
    'g202_pace_copy':            [(r"V\$\{IA\.version\}", "${SV.tag(IA.version)}", 1)],
    'g203_mile_pencil':          [(r"V' \+ IA\.version\b", "' + SV.tag(IA.version)", 1)],
    'g221_d177_swapfloor':       [(r"V' \+ VER\b", "' + SV.tag(VER)", 1)],
    'g227_d190_cuecap':          [(r"V' \+ VER\b", "' + SV.tag(VER)", 1)],
    'g222_d181_durable':         [(r"V' \+ STAMP\b", "' + SV.tag(STAMP)", 1)],
}
for g, subs in GATES.items():
    rel = 'tests/gates/%s.js' % g
    t = (R / rel).read_text(encoding='utf-8')
    if g == 'g193_budget_floor':
        t = sub_exact(rel, t,
            "const { load, fixtures, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));\n",
            "const { load, fixtures, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));\n"
            "const SV = require(path.join(__dirname, '..', 'semver.js'));   // SV.tag prints a version label (CLAUDE.md, PRIORITY 1)\n", 1)
    elif len(re.findall(r"^(?:const|var|let) SV *= *require", t, re.M)) != 1:
        errors.append('%s: no single SV require' % rel)
    for pat, new, want in subs:
        t = sub_re(rel, t, pat, lambda m, new=new: new, want)
    plan[rel] = t

if errors:
    sys.exit('NOTHING WRITTEN\n' + '\n'.join(errors))
for rel, t in plan.items():
    (R / rel).write_text(t, encoding='utf-8')
    print('wrote', rel)
