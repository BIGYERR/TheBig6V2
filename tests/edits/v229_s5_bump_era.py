#!/usr/bin/env python3
# V229 slice 5: the three HALF_MANNY era rows and the version bump 228 -> 229 (Mario named this build V229; D194 R2(3)'
# "the bump 228 -> 229 when Mario says so"). Era rows: tests/measure/v229_rulings/d194_injlens_ruling.md, "What
# deliberately does NOT change": "HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no
# overlay, 0 cued, printed this session)", repeated by Amendments 1 and 2. Standing ruling 5: HALF_MANNY moves only by a
# ruling that printed the digest first; this one printed it UNMOVED.
#   H1-H3 (tests/harness.js)  MANNY_DIGEST / MANNY_DELOAD_OFF_DIGEST / MANNY_CORE_OFF_DIGEST _BY_VERSION[229] = [228], each
#         on the line after its [228] row, reference rows (ruled UNMOVED).
#   H4    (index.html)        <meta name="ia-version" content="228"> -> "229". The LAST write.
# All or none: index.html reads 228 and is byte-identical to measure's CF5 (sha256 below); harness.js has no [229] row;
# the three digests re-derived on the candidate (harness fixture, g199's __DELOAD_OFF method, g200's clause-removed
# counterfactual) equal the values the row comments cite; every anchor count==1; then harness.js, then index.html.
import sys, re, pathlib, hashlib, subprocess

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')
IDX = ROOT / 'index.html'
HAR = ROOT / 'tests' / 'harness.js'
CF5_SHA256 = '5ff9119afd7e0f5ae780371461b1410290aa755ce8d32513e685df7afda05d05'
DIG = {'MANNY': '0ac7da6b1691a8e1', 'DELOAD_OFF': '1069cd7f86eed204', 'CORE_OFF': '9d14801a63111081'}

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

idx_bytes = IDX.read_bytes()
idx = idx_bytes.decode('utf-8')
har = HAR.read_text(encoding='utf-8')

m = re.findall(r'<meta name="ia-version" content="(\d+)"', idx)
if m != ['228']:
    die('index.html ia-version must be exactly 228, found %r' % (m,))
if hashlib.sha256(idx_bytes).hexdigest() != CF5_SHA256:
    die('index.html is not byte-identical to measure\'s CF5 (sha256 %s)' % hashlib.sha256(idx_bytes).hexdigest())
if re.search(r'_BY_VERSION\[229\]', har):
    die('tests/harness.js already carries a [229] row')

# Re-derive the three digests on the candidate before any row cites them.
NODE = r"""
const fs=require('fs'),os=require('os'),path=require('path');
const {load,fixtures,progDigest}=require(process.argv[1]+'/tests/harness.js');
const ART=process.argv[1]+'/index.html', RAW=fs.readFileSync(ART,'utf8'), CLAUSE="  if(_auxFamily(name)==='core') return 0;\n";
if(RAW.split(CLAUSE).length-1!==1) throw new Error('core clause count != 1');
const IP=load(ART); const a=progDigest(IP.buildProgram(fixtures.HALF_MANNY));
IP.eval('globalThis.__DELOAD_OFF=true;'); const b=progDigest(IP.buildProgram(fixtures.HALF_MANNY)); IP.eval('globalThis.__DELOAD_OFF=false;');
const d=fs.mkdtempSync(path.join(os.tmpdir(),'v229s5-')); const mp=path.join(d,'coreoff.html'); fs.writeFileSync(mp,RAW.replace(CLAUSE,''));
const c=progDigest(load(mp).buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)))); fs.rmSync(d,{recursive:true,force:true});
console.log(a+' '+b+' '+c);
"""
r = subprocess.run(['node', '-e', NODE, str(ROOT)], capture_output=True, text=True)
if r.returncode != 0:
    die('digest derivation failed: ' + r.stderr.strip()[-300:])
got = r.stdout.split()
print('candidate digests (fixture / g199 deload-off / g200 core-off): ' + ' / '.join(got))
if got != [DIG['MANNY'], DIG['DELOAD_OFF'], DIG['CORE_OFF']]:
    die('candidate digests %r != the ruled UNMOVED values %r' % (got, DIG))

WHY = ("HALF_MANNY is uninjured and carries no overlay, so applyInjuryFilter's plan returns before the clamp, the held "
       "test (R7) or the stripper is read; the lens (_dayPlanCfg) returns prog.cfg itself on a day with no stamp; and the "
       "kept dose (slices 2 and 3, dormant behind cfg.injury) writes nothing on an uninjured program")
CITE = ("standing ruling 5: D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) \"What deliberately does NOT change\" "
        "states \"HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, "
        "printed this session)\", and Amendments 1 and 2 repeat it")
PRINTED = ("0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V229 candidate (index.html "
           "byte-identical to measure's CF5, before the bump) with the harness fixture and g199's and g200's methods "
           "before these rows")

ROWS = [
    ('H1', 'MANNY_DIGEST_BY_VERSION',
     "MANNY_DIGEST_BY_VERSION[229] = MANNY_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build half, D194 P-INJLENS "
     "part 1): ruled UNMOVED, reference to [228]; " + WHY + " (" + CITE + "; " + PRINTED + ")\n"),
    ('H2', 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION',
     "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build "
     "half, D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; same reasoning as MANNY_DIGEST_BY_VERSION[229]: "
     + WHY + ", with recoveryDeload suppressed too (" + CITE + "; 1069cd7f86eed204 printed by builder on the V229 "
     "candidate with g199's method before this row)\n"),
    ('H3', 'MANNY_CORE_OFF_DIGEST_BY_VERSION',
     "MANNY_CORE_OFF_DIGEST_BY_VERSION[229] = MANNY_CORE_OFF_DIGEST_BY_VERSION[228];   // V229 (D193 P-CAPRPE build half, "
     "D194 P-INJLENS part 1): ruled UNMOVED, reference to [228]; the core-off counterfactual is unreached the same way "
     "MANNY_DIGEST_BY_VERSION[229] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229] are: " + WHY + " (" + CITE + "; "
     "9d14801a63111081 printed by builder on the V229 candidate with g200's method before this row)\n"),
]

har_lines = har.split('\n')
plan = []
for tag, tbl, row in ROWS:
    pref = tbl + '[228] = ' + tbl + '[227];'
    hits = [i for i, l in enumerate(har_lines) if l.startswith(pref)]
    print('%s anchor (%s[228] row) count %d' % (tag, tbl, len(hits)))
    if len(hits) != 1:
        die('%s anchor count %d != 1' % (tag, len(hits)))
    plan.append((hits[0], row.rstrip('\n')))

META_OLD = '<meta name="ia-version" content="228">'
META_NEW = '<meta name="ia-version" content="229">'
print('H4 anchor (meta 228) count %d' % idx.count(META_OLD))
if idx.count(META_OLD) != 1:
    die('H4 anchor count %d != 1' % idx.count(META_OLD))

new_lines = list(har_lines)
for at, row in sorted(plan, reverse=True):
    new_lines.insert(at + 1, row)
har_out = '\n'.join(new_lines)
idx_out = idx.replace(META_OLD, META_NEW, 1)

allnew = ''.join(r for _, _, r in ROWS)
if '\\u' in allnew:
    die('a \\u escape was typed into replacement text')
checks = [
    ('harness [229] rows', len(re.findall(r'^MANNY_(?:DELOAD_OFF_|CORE_OFF_)?DIGEST_BY_VERSION\[229\] = MANNY_(?:DELOAD_OFF_|CORE_OFF_)?DIGEST_BY_VERSION\[228\];', har_out, re.M)), 3),
    ('harness lines added', len(har_out.split('\n')) - len(har_lines), 3),
    ('index meta 229', len(re.findall(r'<meta name="ia-version" content="229"', idx_out)), 1),
    ('index meta 228 gone', len(re.findall(r'<meta name="ia-version" content="228"', idx_out)), 0),
    ('index bytes otherwise unchanged', len(idx_out) - len(idx), 0),
]
for nm, got_, want in checks:
    print('post %s: %d' % (nm, got_))
    if got_ != want:
        die('post-check %s: %d != %d' % (nm, got_, want))

HAR.write_text(har_out, encoding='utf-8')
IDX.write_text(idx_out, encoding='utf-8')   # H4, the last write
print('OK: 3 era rows written to %s; ia-version 228 -> 229 written to %s (last write)' % (HAR, IDX))
