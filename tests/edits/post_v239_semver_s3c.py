#!/usr/bin/env python3
# Post-V239 semver, slice 3C (tests only, no build; ia-version does not move): the last third of the gates, g223 to g239.
# Ruling: tests/measure/post_v239_semver/design.md, gate conversion rules R1 to R10; worked pattern: post_v239_semver_s3a.py.
# Every version read goes through tests/semver.js (SV): R1 parse (+X.version, +IA0.version, a gate's own meta regex ->
# SV.parse / SV.fromHtml, the gate's missing-meta fallback kept: NaN or 0 as before), R2 ordered compares -> SV.cmp(A, B)
# op 0 (operator and operand order kept), R3 equality -> SV.cmp(A, B) === 0 / !== 0 (STAMP === ERA - 1, VER !== STAMP,
# +b.version === BASE_ERA, the IA_ASSUME_VERSION knob: unset = no knob, set = compared as a version), R4 version-keyed
# reads keyed by the ARTIFACT's version (T[VER], T[eraV], hasOwnProperty(T, VER)) -> SV.lookup(T, v); reads keyed by an
# integer era constant (MD[ERA], MD[BASE_ERA]) stay as written (R8: legacy key on a legacy row), R6 legacy-constant
# arithmetic (ERA - 1) stays, R7 displays stay as written, R10 no row, gate name, era key or era value moves.
# Harness load() throws on a missing or unparseable meta and every gate's boot catch exits, so past the boot block the
# version is always parsed; only the gates' own meta reads (g223_d183 RATE_STAMP, g223_d184 stampOf, g226_d189 :184,
# g235 to g239 VER) keep a fallback, and the compares on RATE_STAMP keep NaN reading as "no era" explicitly.
# Every anchor is asserted count==1 against the file as it stands when the anchor applies; the first miss aborts the
# whole script before any file is written. Each replacement is printed with its line number for review.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = 'tests/gates/'

SVJ = "const SV = require(path.join(__dirname, '..', 'semver.js'));"
SVR = "const SV = require(path.join(ROOT, 'tests', 'semver.js'));"
HJ = "const H = require(path.join(__dirname, '..', 'harness.js'));"
HR = "const H = require(path.join(ROOT, 'tests', 'harness.js'));"


def req(anchor, line):
    return (anchor, anchor + '\n' + line)


# the version-predicate block shared by g223 to g230 (STAMP, the IA_ASSUME_VERSION discrimination knob, VER)
ASSUME = ("if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){",
          "if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){")
ASSUMED = ("(VER !== STAMP ? ' (assumed '", "(SV.cmp(VER, STAMP) !== 0 ? ' (assumed '")
REFUSE = ("if(!(VER >= ERA)){", "if(!(SV.cmp(VER, ERA) >= 0)){")
REFUSE_INFO = ("if(!(VER >= ERA)) S.info(", "if(!(SV.cmp(VER, ERA) >= 0)) S.info(")
P_HLOAD = ("STAMP = +H.load(ART).version;", "STAMP = SV.parse(H.load(ART).version);")
P_IA = ("STAMP = +IA.version;", "STAMP = SV.parse(IA.version);")
P_IA0 = ("STAMP = +IA0.version;", "STAMP = SV.parse(IA0.version);")
P_VER = ("VER = +IA.version;", "VER = SV.parse(IA.version);")
P_CVER = ("VER = +C.IA.version;", "VER = SV.parse(C.IA.version);")
# the baseline seam: argv[3] if it reads BASE_ERA, else the git copy
BARG = ("const b = load(BASEFILE); if(+b.version === BASE_ERA){", "const b = load(BASEFILE); if(SV.cmp(b.version, BASE_ERA) === 0){")
BGIT = ("const b = load(f); if(+b.version === BASE_ERA){", "const b = load(f); if(SV.cmp(b.version, BASE_ERA) === 0){")
CUE = ("const CUE = VER >= 228 ?", "const CUE = SV.cmp(VER, 228) >= 0 ?")
BELOW = ("(VER >= ERA ? '' : ' (below '", "(SV.cmp(VER, ERA) >= 0 ? '' : ' (below '")


def cj(pfx):
    # a row's version conjunct: [id, VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]
    return (pfx + "VER >= ERA, 'ia-version ' + VER + (VER >= ERA ? ' >= ' : ' < ') + ERA]",
            pfx + "SV.cmp(VER, ERA) >= 0, 'ia-version ' + VER + (SV.cmp(VER, ERA) >= 0 ? ' >= ' : ' < ') + ERA]")


def meta(vm):
    # R1: the gate's own meta regex -> SV.fromHtml; no meta keeps the gate's fallback 0 (every row FAILS by its conjunct)
    return ('const ' + vm + ' = HTML.match(/<meta name="ia-version" content="(\\d+)">/);\n'
            'const VER = ' + vm + ' ? +' + vm + '[1] : 0;',
            'const VER = /<meta name="ia-version" content="/.test(HTML) ? SV.fromHtml(HTML) : 0;   // no meta: 0, as before')


EDITS = {
G + 'g223_d182_racedate.js': [
    req(HJ, SVJ), P_HLOAD, ASSUME, ASSUMED, REFUSE,
],
G + 'g223_d183_safepace.js': [
    req(HJ, SVJ),
    # R1 with the gate's missing-meta tolerance kept: no meta reads NaN, and NaN reads as no era below, as before
    ("const RATE_STAMP = +((fs.readFileSync(ART, 'utf8').match(/<meta name=\"ia-version\" content=\"(\\d+)\"/) || [])[1] || NaN);",
     "const RATE_STAMP = (s => /<meta name=\"ia-version\" content=\"/.test(s) ? SV.fromHtml(s) : NaN)(fs.readFileSync(ART, 'utf8'));   // no meta: NaN, as before"),
    ("const D188_STAMP = RATE_STAMP >= 226;", "const D188_STAMP = !Number.isNaN(RATE_STAMP) && SV.cmp(RATE_STAMP, 226) >= 0;"),
    ("const IMPROVE = RATE_STAMP >= 225\n", "const IMPROVE = !Number.isNaN(RATE_STAMP) && SV.cmp(RATE_STAMP, 225) >= 0\n"),
    P_HLOAD, ASSUME, ASSUMED, REFUSE,
    ("const eraV = +IA.version, eraHas = Object.prototype.hasOwnProperty.call(H.MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? H.MANNY_DIGEST_BY_VERSION[eraV] : undefined;",
     "const eraV = SV.parse(IA.version), eraHas = SV.lookup(H.MANNY_DIGEST_BY_VERSION, eraV) !== undefined, eraRow = eraHas ? SV.lookup(H.MANNY_DIGEST_BY_VERSION, eraV) : undefined;"),
],
G + 'g223_d184_testlen.js': [
    req(HJ, SVJ),
    # R1 with the gate's missing-meta tolerance kept: no meta reads NaN (harness load then throws and the boot catch exits)
    ("const stampOf = f => +((fs.readFileSync(f, 'utf8').match(/<meta name=\"ia-version\" content=\"(\\d+)\"/) || [])[1]);",
     "const stampOf = f => { const s = fs.readFileSync(f, 'utf8'); return /<meta name=\"ia-version\" content=\"/.test(s) ? SV.fromHtml(s) : NaN; };   // no meta: NaN, as before"),
    ASSUME, ASSUMED, REFUSE,
    ("const R225_R3 = +V.IA.version >= 225;", "const R225_R3 = SV.cmp(V.IA.version, 225) >= 0;"),
],
G + 'g224_d185_wctoday.js': [
    req(HJ, SVJ),
    ("const artifactV = +IA.version;", "const artifactV = SV.parse(IA.version);"),
    ("if (artifactV < RULING_V && !SURFACE_PRESENT) {", "if (SV.cmp(artifactV, RULING_V) < 0 && !SURFACE_PRESENT) {"),
    ("SURFACE_PRESENT || artifactV < RULING_V,", "SURFACE_PRESENT || SV.cmp(artifactV, RULING_V) < 0,"),
],
G + 'g225_d186_clockend.js': [
    req(HJ, SVJ), P_HLOAD, ASSUME, ASSUMED, REFUSE,
    ("if(STAMP < ERA){", "if(SV.cmp(STAMP, ERA) < 0){"),
],
G + 'g225_d187_pacerate.js': [
    req(HJ, SVJ), P_HLOAD, ASSUME, ASSUMED, REFUSE,
],
G + 'g226_d188_beginnermile.js': [
    req(HJ, SVJ), P_IA, ASSUME,
    ("const D188 = VER >= ERA;", "const D188 = SV.cmp(VER, ERA) >= 0;"),
    ASSUMED,
    ("const b = H.load(BASEFILE); if(+b.version === 225){", "const b = H.load(BASEFILE); if(SV.cmp(b.version, 225) === 0){"),
    ("const b = H.load(f); if(+b.version === 225){", "const b = H.load(f); if(SV.cmp(b.version, 225) === 0){"),
],
G + 'g226_d189_pacedisclose.js': [
    req(HJ, SVJ), P_IA, ASSUME,
    ("const D189 = VER >= ERA;", "const D189 = SV.cmp(VER, ERA) >= 0;"),
    ASSUMED,
    # R1 + R3 with the gate's tolerance kept: an argv baseline with no meta, or one that does not parse, is not V225
    ("if(f && fs.existsSync(f) && /<meta name=\"ia-version\" content=\"225\"/.test(fs.readFileSync(f, 'utf8'))){",
     "if(f && fs.existsSync(f) && (t => { try { return SV.cmp(SV.fromHtml(t), 225) === 0; } catch(e){ return false; } })(fs.readFileSync(f, 'utf8'))){"),
    ("if(+BASE.version !== 225){", "if(SV.cmp(BASE.version, 225) !== 0){"),
    ("const V231 = VER >= V231_ERA;", "const V231 = SV.cmp(VER, V231_ERA) >= 0;"),
    ("const eraV = VER, eraHas = Object.prototype.hasOwnProperty.call(H.MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? H.MANNY_DIGEST_BY_VERSION[eraV] : undefined,",
     "const eraV = VER, eraHas = SV.lookup(H.MANNY_DIGEST_BY_VERSION, eraV) !== undefined, eraRow = eraHas ? SV.lookup(H.MANNY_DIGEST_BY_VERSION, eraV) : undefined,"),
],
G + 'g227_d190_cuecap.js': [
    req(HJ, SVJ), P_IA, ASSUME, CUE, ASSUMED, REFUSE, BARG, BGIT,
    ("if(VER >= D193_ERA){", "if(SV.cmp(VER, D193_ERA) >= 0){"),
    ("if(VER >= V231_ERA){", "if(SV.cmp(VER, V231_ERA) >= 0){"),
    ("const mannyWant = (Object.prototype.hasOwnProperty.call(MDV, VER) && typeof MDV[VER] === 'string') ? MDV[VER] :",
     "const mannyWant = (SV.lookup(MDV, VER) !== undefined && typeof SV.lookup(MDV, VER) === 'string') ? SV.lookup(MDV, VER) :"),
    ("const wantOf = ck => (VER >= V231_ERA && ck === 'manny') ? mannyWant : (VER >= 228 && ",
     "const wantOf = ck => (SV.cmp(VER, V231_ERA) >= 0 && ck === 'manny') ? mannyWant : (SV.cmp(VER, 228) >= 0 && "),
    ("if(VER >= 228) console.log('    c-DIGEST at '", "if(SV.cmp(VER, 228) >= 0) console.log('    c-DIGEST at '"),
    ("(VER >= V231_ERA ? 'manny wants MANNY_DIGEST_BY_VERSION['", "(SV.cmp(VER, V231_ERA) >= 0 ? 'manny wants MANNY_DIGEST_BY_VERSION['"),
    ("R.cDIGEST + (VER >= 228 ? ' (at 228 and above", "R.cDIGEST + (SV.cmp(VER, 228) >= 0 ? ' (at 228 and above"),
    ("(VER >= V231_ERA ? ' (at 231 and above: manny", "(SV.cmp(VER, V231_ERA) >= 0 ? ' (at 231 and above: manny"),
    ("const row = MD[VER];", "const row = SV.lookup(MD, VER);"),
],
G + 'g227_d190_prefpath.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    P_IA, ASSUME, CUE, ASSUMED, REFUSE, BARG, BGIT,
    ("const bDet = (b && VER >= 228 && b.det", "const bDet = (b && SV.cmp(VER, 228) >= 0 && b.det"),
],
G + 'g227_d190_seam.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    P_IA0, ASSUME, CUE, ASSUMED, REFUSE, BARG, BGIT,
],
G + 'g228_d192_undokey.js': [
    req("const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    P_IA0, ASSUME, ASSUMED, REFUSE, BARG, BGIT,
    ("const eraV = VER, eraHas = Object.prototype.hasOwnProperty.call(MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? MANNY_DIGEST_BY_VERSION[eraV] : undefined;",
     "const eraV = VER, eraHas = SV.lookup(MANNY_DIGEST_BY_VERSION, eraV) !== undefined, eraRow = eraHas ? SV.lookup(MANNY_DIGEST_BY_VERSION, eraV) : undefined;"),
],
G + 'g228_d193_cueword.js': [
    req(HJ, SVJ), P_IA, ASSUME, ASSUMED, REFUSE, BARG, BGIT,
],
G + 'g229_d193_build.js': [
    req(HJ, SVJ), P_IA, ASSUME, ASSUMED, REFUSE, BARG, BGIT,
    ("const row = MD[VER];", "const row = SV.lookup(MD, VER);"),
    ("(VER >= V231_ERA ? ' [V231 split: object row", "(SV.cmp(VER, V231_ERA) >= 0 ? ' [V231 split: object row"),
    ("if(VER >= V231_ERA){ const d = D.bwsets", "if(SV.cmp(VER, V231_ERA) >= 0){ const d = D.bwsets"),
    ("if(VER >= V231_ERA){", "if(SV.cmp(VER, V231_ERA) >= 0){"),   # :516, unique once :478 is converted
    ("nonCue = VER >= V231_ERA ? NONCUE_V231", "nonCue = SV.cmp(VER, V231_ERA) >= 0 ? NONCUE_V231"),
    ("R.f + (VER >= V231_ERA ? ' [V231 A-1", "R.f + (SV.cmp(VER, V231_ERA) >= 0 ? ' [V231 A-1"),
],
G + 'g229_d194_lens.js': [
    req(HJ, SVJ), P_IA, ASSUME, ASSUMED, REFUSE, BARG, BGIT,
    ("if(VER >= V231_ERA){ const okN", "if(SV.cmp(VER, V231_ERA) >= 0){ const okN"),
    ("if(VER >= V231_ERA){ const w2", "if(SV.cmp(VER, V231_ERA) >= 0){ const w2"),
],
G + 'g230_d194_lens2.js': [
    req(HJ, SVJ), P_IA, ASSUME, ASSUMED, REFUSE,
    ("if(VER >= V231_ERA) Object.assign(R, {", "if(SV.cmp(VER, V231_ERA) >= 0) Object.assign(R, {"),
    BARG, BGIT,
    ("\nif(VER >= ERA){", "\nif(SV.cmp(VER, ERA) >= 0){"),
    ("const V231 = VER >= V231_ERA, WL = V231", "const V231 = SV.cmp(VER, V231_ERA) >= 0, WL = V231"),
    ("const V231 = VER >= V231_ERA, WLl = V231", "const V231 = SV.cmp(VER, V231_ERA) >= 0, WLl = V231"),
    ("if(VER >= V231_ERA){ const SJ", "if(SV.cmp(VER, V231_ERA) >= 0){ const SJ"),
],
G + 'g231_d194a4_lateplan.js': [
    req("const { load } = require(path.join(ROOT, 'tests', 'harness.js'));", SVR),
    P_VER,
    ("if(!(VER >= ERA)){ P('REFUSED", "if(!(SV.cmp(VER, ERA) >= 0)){ P('REFUSED"),
    ("const vcj = k => [k + '-ver', VER >= ERA, 'ia-version '", "const vcj = k => [k + '-ver', SV.cmp(VER, ERA) >= 0, 'ia-version '"),
],
G + 'g231_d195_hipext.js': [
    req(HR, SVR), P_VER, BELOW, BARG, BGIT,
    cj("['a-ver', "), cj("['c-ver', "), cj("['d-ver', "), cj("['e-ver', "), cj("['b-ver', "), cj("['f-ver', "),
],
G + 'g231_d195b_cost.js': [
    req(HR, SVR), P_VER, BELOW, BARG, BGIT,
    cj("['a-ver', "), cj("['b-ver', "), cj("['c-ver', "),
],
G + 'g231_d196_bwfallback.js': [
    req(HR, SVR), P_VER, BELOW, BARG, BGIT,
    cj("['a-ver', "), cj("['b-ver', "), cj("['c-ver', "), cj("['d-ver', "),
],
G + 'g231_d197_filterlast.js': [
    req(HR, SVR), P_VER, BELOW, BARG, BGIT,
    cj("['a-ver', "), cj("['c-ver', "), cj("['L-ver', "),
],
G + 'g231_d198_hepdraw.js': [
    req(HR, SVR), P_VER, BELOW, BARG, BGIT,
    cj("['a-ver', "), cj("['b-ver', "), cj("['c-ver', "),
],
G + 'g232_d199_runwheel.js': [
    req(HR, SVR),
    ("FREE_HMS = () => VER >= 235 ?", "FREE_HMS = () => SV.cmp(VER, 235) >= 0 ?"),
    ("FREE_MI = () => VER >= 237 ?", "FREE_MI = () => SV.cmp(VER, 237) >= 0 ?"),
    ("get log_run_mins(){ return VER >= 233 ?", "get log_run_mins(){ return SV.cmp(VER, 233) >= 0 ?"),
    cj("const verCj = k => [k + '-ver', "),
    P_CVER, BELOW,
    ("(VER >= 235 ? HMS_COLS_V235 : HMS_COLS)", "(SV.cmp(VER, 235) >= 0 ? HMS_COLS_V235 : HMS_COLS)"),
    ("(VER >= 235 && T === 0)", "(SV.cmp(VER, 235) >= 0 && T === 0)"),
    ("(VER >= 235 ? HMS_PARSE_V235 : HMS_PARSE)", "(SV.cmp(VER, 235) >= 0 ? HMS_PARSE_V235 : HMS_PARSE)"),
    ("(VER >= 237 ? DEC3_V237 : DEC3)", "(SV.cmp(VER, 237) >= 0 ? DEC3_V237 : DEC3)"),
    ("(VER >= 237 ? 'its blank face (time 0:00:00, miles 0.00)' : VER >= 235 ? 'its blank face",
     "(SV.cmp(VER, 237) >= 0 ? 'its blank face (time 0:00:00, miles 0.00)' : SV.cmp(VER, 235) >= 0 ? 'its blank face"),
    ("if(VER >= 236) return moveTimeV236();", "if(SV.cmp(VER, 236) >= 0) return moveTimeV236();"),
    ("if(VER >= 236) return moveDistV236();", "if(SV.cmp(VER, 236) >= 0) return moveDistV236();"),
    ("if(VER >= 236) return moveBackV236();", "if(SV.cmp(VER, 236) >= 0) return moveBackV236();"),
],
G + 'g233_d207_bikewheel.js': [
    req(HR, SVR),
    ("BLANK_HMS = () => VER >= 235 ?", "BLANK_HMS = () => SV.cmp(VER, 235) >= 0 ?"),
    ("legacyBike = () => VER >= 235 ?", "legacyBike = () => SV.cmp(VER, 235) >= 0 ?"),
    cj("const verCj = k => [k + '-ver', "),
    P_CVER, BELOW,
    ("(VER >= 235 ? '0:00:00' : 'the dash')", "(SV.cmp(VER, 235) >= 0 ? '0:00:00' : 'the dash')"),
    ("if(VER >= 236){ const p = C.entry", "if(SV.cmp(VER, 236) >= 0){ const p = C.entry"),
    ("const want45 = VER >= 235 ? 1 : 2;", "const want45 = SV.cmp(VER, 235) >= 0 ? 1 : 2;"),
    ("(VER >= 235 ? '0:00:00' : 'dash')", "(SV.cmp(VER, 235) >= 0 ? '0:00:00' : 'dash')"),
    ("C.move(need(), 0, VER >= 235 ? '0' : '')", "C.move(need(), 0, SV.cmp(VER, 235) >= 0 ? '0' : '')"),
    ("(VER >= 235 ? 'its seed face 0:00:00' : 'the dash')", "(SV.cmp(VER, 235) >= 0 ? 'its seed face 0:00:00' : 'the dash')"),
    ("(VER >= 235 ? PARSE_HAND_V235 : PARSE_HAND)", "(SV.cmp(VER, 235) >= 0 ? PARSE_HAND_V235 : PARSE_HAND)"),
],
G + 'g234_d213_swapkeep.js': [
    req(HR, SVR), P_HLOAD,
    ("if(!(STAMP >= ERA)){", "if(!(SV.cmp(STAMP, ERA) >= 0)){"),
    ("(STAMP >= 236 ? ',true' : '')", "(SV.cmp(STAMP, 236) >= 0 ? ',true' : '')"),
    ("J(STAMP >= 236 ? {", "J(SV.cmp(STAMP, 236) >= 0 ? {"),
],
G + 'g235_d215_hmszero.js': [
    req(HR, SVR), meta('VM'),
    cj("const verCj = k => [k + '-ver', "),
    ("(VER >= ERA ? '' : ' (below '", "(SV.cmp(VER, ERA) >= 0 ? '' : ' (below '"),
    ("(VER >= 237 && k !== 'pace')", "(SV.cmp(VER, 237) >= 0 && k !== 'pace')"),
    ("const logTap = () => { if(VER >= 236){", "const logTap = () => { if(SV.cmp(VER, 236) >= 0){"),
    ("if(VER >= 236){ C.ev('logCardio()'); C.advance(50); }", "if(SV.cmp(VER, 236) >= 0){ C.ev('logCardio()'); C.advance(50); }"),   # :421, unique once :350 is converted
    ("has = Object.prototype.hasOwnProperty.call(T, VER);", "has = SV.lookup(T, VER) !== undefined;"),
    ("T[VER] === '2d35e8f743680cfa', J(T[VER])", "SV.lookup(T, VER) === '2d35e8f743680cfa', J(SV.lookup(T, VER))"),
    ("(VER >= 237 ? DEC3_V237 : DEC3)", "(SV.cmp(VER, 237) >= 0 ? DEC3_V237 : DEC3)"),
],
G + 'g236_d218_logbutton.js': [
    req(HR, SVR), meta('VM'),
    cj("const verCj = k => [k + '-ver', "),
    REFUSE_INFO,
],
G + 'g237_d220_distzero.js': [
    req(HR, SVR), meta('VM'),
    cj("const verCj = k => [k + '-ver', "),
    REFUSE_INFO,
    ("has = Object.prototype.hasOwnProperty.call(T, VER);", "has = SV.lookup(T, VER) !== undefined;"),
    ("T[VER] === HALF_DIGEST, J(T[VER])", "SV.lookup(T, VER) === HALF_DIGEST, J(SV.lookup(T, VER))"),
    ("dg0 === T[VER], 'HALF_MANNY on the candidate ' + dg0 + ' (ruling ' + HALF_DIGEST + ', era row ' + J(T[VER])",
     "dg0 === SV.lookup(T, VER), 'HALF_MANNY on the candidate ' + dg0 + ' (ruling ' + HALF_DIGEST + ', era row ' + J(SV.lookup(T, VER))"),
],
G + 'g238_d223_restlog.js': [
    req(HR, SVR), meta('VM'),
    cj("const verCj = k => [k + '-ver', "),
    REFUSE_INFO,
    ("rowV = T[VER];", "rowV = SV.lookup(T, VER);"),
],
G + 'g239_d233_island.js': [
    req(HJ, SVJ), meta('VM_'),
    cj("const verCj = () => ['ver', "),
    REFUSE_INFO,
],
}


def main():
    out = {}
    for rel, edits in EDITS.items():
        p = os.path.join(ROOT, rel)
        s = open(p, encoding='utf-8').read()
        for k, (old, new) in enumerate(edits):
            n = s.count(old)
            if n != 1:
                sys.exit('ABORT %s edit %d: anchor count %d (want 1): %r' % (rel, k, n, old[:120]))
            line = s[:s.index(old)].count('\n') + 1 + (1 if old.startswith('\n') else 0)
            s = s.replace(old, new)
            print('%s:%d  %s\n    -> %s' % (rel, line, old.strip().replace('\n', '\\n')[:150], new.strip().replace('\n', '\\n')[:170]))
        out[p] = s
    for p, s in out.items():
        open(p, 'w', encoding='utf-8').write(s)
    print('wrote %d files, %d replacements' % (len(out), sum(len(e) for e in EDITS.values())))


if __name__ == '__main__':
    main()
