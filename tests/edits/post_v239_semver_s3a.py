#!/usr/bin/env python3
# Post-V239 semver, slice 3A (tests only, no build; ia-version does not move): the first third of the gates.
# Ruling: tests/measure/post_v239_semver/design.md, gate conversion rules R1 to R10. Every version read goes through
# tests/semver.js (SV): R1 parse (+X.version, Number(IA.IA_VERSION), a gate's own meta regex -> SV.parse / SV.fromHtml),
# R2 ordered compares -> SV.cmp(A, B) op 0 (operator and operand order kept), R3 equality -> SV.cmp(A, B) === 0,
# R4 version-keyed table reads -> SV.lookup(T, v), R7 displays stay as written, R8 era constants and table keys stay
# integers, R10 no row, gate name, era key or era value moves and output on the 239 artifact is byte-identical.
# Display-only gates in this slice (no edit): g193_budget_floor, g194_implement_and_range, g195_wildcard, g196_ledger.
# Every anchor is asserted count==1 against the file as it stands when the anchor applies; the first miss aborts the
# whole script before any file is written. Each replacement is printed with its line number for review.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = 'tests/gates/'

SVJ = "const SV = require(path.join(__dirname, '..', 'semver.js'));"
SVC = "const SV=require(path.join(__dirname,'..','semver.js'));"


def req(anchor, line):
    return (anchor, anchor + '\n' + line)


FILT_IA = ("filter(r => +IA.version >= r.from && +IA.version <= r.to)",
           "filter(r => SV.cmp(IA.version, r.from) >= 0 && SV.cmp(IA.version, r.to) <= 0)")
FILT_LOHI = ("RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi))",
             "RUN_CARD_ERAS.filter(r => (r.lo === undefined || SV.cmp(VER, r.lo) >= 0) && (r.hi === undefined || SV.cmp(VER, r.hi) <= 0))")

EDITS = {
G + 'g190_rounds.js': [
    req("const { load, fixtures } = require(path.join(__dirname, '..', 'harness'));",
        "const SV = require(path.join(__dirname, '..', 'semver'));"),
    # R9: the readable-version check keeps its meaning (the meta parses as a version); R1: VER is parsed, not parseInt
    (r"VER_OK = /^\d+$/.test(String(IA.version)), VER = VER_OK ? parseInt(IA.version, 10) : NaN;",
     "VER_OK = (() => { try { SV.parse(IA.version); return true; } catch (e) { return false; } })(), VER = VER_OK ? SV.parse(IA.version) : NaN;"),
    ("else if(VER < D176_ERA) console.log(", "else if(SV.cmp(VER, D176_ERA) < 0) console.log("),
],
G + 'g192_landmine_rotpress.js': [
    req("const { load } = require(path.join(ROOT, 'tests', 'harness.js'));",
        "const SV = require(path.join(ROOT, 'tests', 'semver.js'));"),
    ("const VER = +IA.version;", "const VER = SV.parse(IA.version);"),
    ("if(!(VER >= 221) ||", "if(!(SV.cmp(VER, 221) >= 0) ||"),
],
G + 'g193_pool_overlay.js': [
    req("const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    # the debt-file predicate '>=N ' / '<=N ': N is a legacy build number (the line grammar is unchanged)
    ("const v = +IA.version, n = +m[2]; return (m[1] === '>=' ? v >= n : v <= n) ? m[3] : null; })",
     "const v = SV.parse(IA.version), n = m[2]; return (m[1] === '>=' ? SV.cmp(v, n) >= 0 : SV.cmp(v, n) <= 0) ? m[3] : null; })"),
    ("const GEAR_VER = +IA.version;", "const GEAR_VER = SV.parse(IA.version);"),
    ("return GEAR_VER >= 215 ? g.hasGHD", "return SV.cmp(GEAR_VER, 215) >= 0 ? g.hasGHD"),
],
G + 'g193_samecard.js': [
    req("const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const OPEN_UNRULED = OPEN_UNRULED_BY_VERSION[(+IA.version <= 218) ? 218 : +IA.version];",
     "const OPEN_UNRULED = SV.lookup(OPEN_UNRULED_BY_VERSION, (SV.cmp(IA.version, 218) <= 0) ? 218 : IA.version);"),
],
G + 'g197a_pool_static.js': [
    req("const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const MANNY_DIGEST = MANNY_DIGEST_BY_VERSION[IA.version];",
     "const MANNY_DIGEST = SV.lookup(MANNY_DIGEST_BY_VERSION, IA.version);"),
],
G + 'g197b_sweep.js': [
    req("const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const MANNY_DIGEST = MANNY_DIGEST_BY_VERSION[IA.version];",
     "const MANNY_DIGEST = SV.lookup(MANNY_DIGEST_BY_VERSION, IA.version);"),
    ("const HF_LEAK = HF_LEAK_BY_VERSION[(+IA.version <= 209) ? 209 : +IA.version];",
     "const HF_LEAK = SV.lookup(HF_LEAK_BY_VERSION, (SV.cmp(IA.version, 209) <= 0) ? 209 : IA.version);"),
    ("const B5C_ROW = B5C_BY_VERSION[(+IA.version <= 218) ? 218 : +IA.version];",
     "const B5C_ROW = SV.lookup(B5C_BY_VERSION, (SV.cmp(IA.version, 218) <= 0) ? 218 : IA.version);"),
],
G + 'g197d_d84_base.js': [
    req("const cp   = require('child_process');", "const SV   = require(path.join(__dirname, '..', 'semver.js'));"),
    ("if (BASE_HTML && iaVersion(fs.readFileSync(BASE_HTML, 'utf8')) === 196) return BASE_HTML;",
     "if (BASE_HTML && isV196(fs.readFileSync(BASE_HTML, 'utf8'))) return BASE_HTML;"),
    ("if (fs.existsSync(V196_PATH) && iaVersion(fs.readFileSync(V196_PATH, 'utf8')) === 196) return V196_PATH;",
     "if (fs.existsSync(V196_PATH) && isV196(fs.readFileSync(V196_PATH, 'utf8'))) return V196_PATH;"),
    # R1 with the gate's missing-meta tolerance kept: no meta reads null (eraOf then holds it to the newest row)
    ("function iaVersion(src) {\n"
     "  const m = /<meta name=\"ia-version\" content=\"(\\d+)\"/.exec(String(src || ''));\n"
     "  return m ? parseInt(m[1], 10) : null;\n"
     "}\n",
     "function iaVersion(src) {\n"
     "  const s = String(src || '');\n"
     "  return /<meta name=\"ia-version\" content=\"/.test(s) ? SV.fromHtml(s) : null;   // no meta: null, as before\n"
     "}\n"
     "function isV196(src) { const v = iaVersion(src); return v !== null && SV.cmp(v, 196) === 0; }\n"),
    ("(T.find(r => cv >= r.from && cv <= r.to) || null)",
     "(T.find(r => SV.cmp(cv, r.from) >= 0 && SV.cmp(cv, r.to) <= 0) || null)"),
],
G + 'g198_posterior_floor.js': [
    req("const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));", SVC),
    ("const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IA.version];",
     "const MANNY_DIGEST=SV.lookup(MANNY_DIGEST_BY_VERSION,IA.version);"),
],
G + 'g199_deload_arbitration.js': [
    req("const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION, MANNY_DELOAD_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));", SVC),
    ("const E6_ROW_FOR = v => E6_BY_VERSION[(+v <= 208) ? 208 : +v];",
     "const E6_ROW_FOR = v => SV.lookup(E6_BY_VERSION, (SV.cmp(v, 208) <= 0) ? 208 : v);"),
    ("const DELOAD_HINGE_ROW_FOR = v => DELOAD_HINGE_BY_VERSION[(+v <= 210) ? 210 : +v];",
     "const DELOAD_HINGE_ROW_FOR = v => SV.lookup(DELOAD_HINGE_BY_VERSION, (SV.cmp(v, 210) <= 0) ? 210 : v);"),
    ("const DELOAD_HINGE_EXCLUDES_TIER_B = v => +v >= 211;",
     "const DELOAD_HINGE_EXCLUDES_TIER_B = v => SV.cmp(v, 211) >= 0;"),
    ("const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];",
     "const MANNY_DIGEST=SV.lookup(MANNY_DIGEST_BY_VERSION,IP.version);"),
    ("const MANNY_OFF=MANNY_DELOAD_OFF_DIGEST_BY_VERSION[IP.version];",
     "const MANNY_OFF=SV.lookup(MANNY_DELOAD_OFF_DIGEST_BY_VERSION,IP.version);"),
    ("const ERA=DELOAD_ARB_BY_VERSION[IP.version]||null;",
     "const ERA=SV.lookup(DELOAD_ARB_BY_VERSION,IP.version)||null;"),
    ("const F23_V231=IP.version>=231?", "const F23_V231=SV.cmp(IP.version,231)>=0?"),
    ("===(IP.version>=231?15702:15720),'F2 Leg superset B present after the deload == '+(IP.version>=231?'15,702'",
     "===(SV.cmp(IP.version,231)>=0?15702:15720),'F2 Leg superset B present after the deload == '+(SV.cmp(IP.version,231)>=0?'15,702'"),
    ("===(IP.version>=231?30246:30264),", "===(SV.cmp(IP.version,231)>=0?30246:30264),"),
    ("'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == '+(IP.version>=231?'30,246",
     "'F3 ACCESSORY-BLOCK CONSERVATION: A + B after the deload == '+(SV.cmp(IP.version,231)>=0?'30,246"),
    ("const I2_V231=IP.version>=231;", "const I2_V231=SV.cmp(IP.version,231)>=0;"),
],
G + 'g200_core_tier.js': [
    req("MANNY_DIGEST_BY_VERSION, MANNY_CORE_OFF_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));", SVC),
    ("const CORE_OFF_ROW=MANNY_CORE_OFF_DIGEST_BY_VERSION[IA.version];",
     "const CORE_OFF_ROW=SV.lookup(MANNY_CORE_OFF_DIGEST_BY_VERSION,IA.version);"),
    ("const SHIPPED_ROW=MANNY_DIGEST_BY_VERSION[IA.version];",
     "const SHIPPED_ROW=SV.lookup(MANNY_DIGEST_BY_VERSION,IA.version);"),
],
G + 'g200_pull_arbitration.js': [
    req("const {load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION}=require(path.join(__dirname,'..','harness.js'));", SVC),
    ("const SWAP_N = SWAP_BY_VERSION[(+IP.version <= 218) ? 218 : +IP.version];",
     "const SWAP_N = SV.lookup(SWAP_BY_VERSION, (SV.cmp(IP.version, 218) <= 0) ? 218 : IP.version);"),
    ("const MANNY_DIGEST=MANNY_DIGEST_BY_VERSION[IP.version];",
     "const MANNY_DIGEST=SV.lookup(MANNY_DIGEST_BY_VERSION,IP.version);"),
],
G + 'g202_d108_touchset_freeze.js': [
    req("const H = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const mannyRow = H.MANNY_DIGEST_BY_VERSION[IA.version];",
     "const mannyRow = SV.lookup(H.MANNY_DIGEST_BY_VERSION, IA.version);"),
],
G + 'g202_int_doctrine.js': [
    req("const { load, DAYS } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("RUN_LABEL_BY_VERSION." + FILT_IA[0], "RUN_LABEL_BY_VERSION." + FILT_IA[1]),
    ("const PACE_CAP_INT_18_35 = (+IA.version >= 225) ? 3 : 5;",
     "const PACE_CAP_INT_18_35 = (SV.cmp(IA.version, 225) >= 0) ? 3 : 5;"),
    ("const steps  = (+IA.version >= 225) ?", "const steps  = (SV.cmp(IA.version, 225) >= 0) ?"),
    ("gain * ((+IA.version >= 225) ?", "gain * ((SV.cmp(IA.version, 225) >= 0) ?"),
    ("const IAV = +IA.version;", "const IAV = SV.parse(IA.version);"),
    ("INT_MECHANISM_BY_VERSION.filter(r => IAV <= r.upTo)", "INT_MECHANISM_BY_VERSION.filter(r => SV.cmp(IAV, r.upTo) <= 0)"),
    ("if(IAV > THREE_RUN_LICENCE_TO && ", "if(SV.cmp(IAV, THREE_RUN_LICENCE_TO) > 0 && "),
    ("const R225 = +IA.version >= 225;", "const R225 = SV.cmp(IA.version, 225) >= 0;"),
    ("INT_NOTE_BY_VERSION.filter(r => IAV >= r.from && IAV <= r.to)",
     "INT_NOTE_BY_VERSION.filter(r => SV.cmp(IAV, r.from) >= 0 && SV.cmp(IAV, r.to) <= 0)"),
],
G + 'g202_pace_anchor.js': [
    req("const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("EXP_IMPROVE_BY_VERSION." + FILT_IA[0], "EXP_IMPROVE_BY_VERSION." + FILT_IA[1]),
    ("RUN_LABEL_BY_VERSION." + FILT_IA[0], "RUN_LABEL_BY_VERSION." + FILT_IA[1]),
    ("const D188_ON = +IA.version >= D188_ERA;", "const D188_ON = SV.cmp(IA.version, D188_ERA) >= 0;"),
    ("const row = MANNY_DIGEST_BY_VERSION[IA.version];", "const row = SV.lookup(MANNY_DIGEST_BY_VERSION, IA.version);"),
],
G + 'g202_pace_copy.js': [
    req("const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("RATE_BY_VERSION." + FILT_IA[0], "RATE_BY_VERSION." + FILT_IA[1]),
    ("const IAV = +IA.version;", "const IAV = SV.parse(IA.version);"),
    ("RUN_LABEL_BY_VERSION." + FILT_IA[0], "RUN_LABEL_BY_VERSION." + FILT_IA[1]),
    ("PACE_NOTE_BY_VERSION.filter(r => IAV >= r.from && IAV <= r.to)",
     "PACE_NOTE_BY_VERSION.filter(r => SV.cmp(IAV, r.from) >= 0 && SV.cmp(IAV, r.to) <= 0)"),
    ("const tailRule = IAV >= D188_ERA ?", "const tailRule = SV.cmp(IAV, D188_ERA) >= 0 ?"),
    ("const row = MANNY_DIGEST_BY_VERSION[IA.version];", "const row = SV.lookup(MANNY_DIGEST_BY_VERSION, IA.version);"),
],
G + 'g203_ceiling_and_anchor.js': [
    req("const H = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const artifactV = +IA.version;", "const artifactV = SV.parse(IA.version);"),
    ("if(artifactV >= RULING_V){", "if(SV.cmp(artifactV, RULING_V) >= 0){"),
    ("BASE_TAIL_BY_VERSION.filter(r => artifactV >= r.from && artifactV <= r.to)",
     "BASE_TAIL_BY_VERSION.filter(r => SV.cmp(artifactV, r.from) >= 0 && SV.cmp(artifactV, r.to) <= 0)"),
    ("const ERA_D189 = artifactV >= D189_ERA;", "const ERA_D189 = SV.cmp(artifactV, D189_ERA) >= 0;"),
],
G + 'g203_mile_pencil.js': [
    req("const H = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const artifactV = +IA.version;", "const artifactV = SV.parse(IA.version);"),
    # R3 on both sides; an unset IA_ASSUME_VERSION stays "no assumption" (the env side is a version too, so
    # IA_ASSUME_VERSION=0.223.0 now names 223 as well); REKEY_ASSUME - 1 is legacy-constant arithmetic (R6 keeps it)
    ("const eraV = (process.env.IA_ASSUME_VERSION === String(REKEY_ASSUME) && artifactV === REKEY_ASSUME - 1) ? REKEY_ASSUME : artifactV;",
     "const eraV = (process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, REKEY_ASSUME) === 0 && SV.cmp(artifactV, REKEY_ASSUME - 1) === 0) ? REKEY_ASSUME : artifactV;"),
    ("if(eraV !== artifactV) console.log(", "if(SV.cmp(eraV, artifactV) !== 0) console.log("),
    ("const MILE_MSG_TAG = eraV >= D183_ERA ?", "const MILE_MSG_TAG = SV.cmp(eraV, D183_ERA) >= 0 ?"),
    ("const MILE_MSG_ERA = eraV >= D183_ERA\n", "const MILE_MSG_ERA = SV.cmp(eraV, D183_ERA) >= 0\n"),
    ("const MSG_UNDER_3 = eraV >= D183_ERA ?", "const MSG_UNDER_3 = SV.cmp(eraV, D183_ERA) >= 0 ?"),
    ("const OVER_25_TAG = eraV >= D189_ERA ?", "const OVER_25_TAG = SV.cmp(eraV, D189_ERA) >= 0 ?"),
    ("const MSG_OVER_25 = eraV >= D189_ERA ? MSG_OVER_25_D189 : eraV >= D183_ERA ?",
     "const MSG_OVER_25 = SV.cmp(eraV, D189_ERA) >= 0 ? MSG_OVER_25_D189 : SV.cmp(eraV, D183_ERA) >= 0 ?"),
    ("if(artifactV >= RULING_V){", "if(SV.cmp(artifactV, RULING_V) >= 0){"),
    ("const RACEDATE_ERA = eraV >= D182_ERA\n", "const RACEDATE_ERA = SV.cmp(eraV, D182_ERA) >= 0\n"),
    ("if(eraV < D182_ERA){", "if(SV.cmp(eraV, D182_ERA) < 0){"),
    ("const PENCIL_D188 = eraV >= D188_ERA;", "const PENCIL_D188 = SV.cmp(eraV, D188_ERA) >= 0;"),
    ("const D116_ENTRY_DIGEST = H.MANNY_DIGEST_BY_VERSION[IA.version];",
     "const D116_ENTRY_DIGEST = SV.lookup(H.MANNY_DIGEST_BY_VERSION, IA.version);"),
    ("!!H.MANNY_DIGEST_BY_VERSION[IA.version], String(H.MANNY_DIGEST_BY_VERSION[IA.version])",
     "!!SV.lookup(H.MANNY_DIGEST_BY_VERSION, IA.version), String(SV.lookup(H.MANNY_DIGEST_BY_VERSION, IA.version))"),
    ("(eraV >= D189_ERA ? '; over-25:00", "(SV.cmp(eraV, D189_ERA) >= 0 ? '; over-25:00"),
],
G + 'g204_clock_limb.js': [
    req("const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = IA.version;", "const VER = SV.parse(IA.version);"),
    ("if(!HAS && VER < D126_ERA){", "if(!HAS && SV.cmp(VER, D126_ERA) < 0){"),
    ("const C5_TGT = (+VER >= 225) ? 501 : 480, C5_TXT = (+VER >= 225) ?",
     "const C5_TGT = (SV.cmp(VER, 225) >= 0) ? 501 : 480, C5_TXT = (SV.cmp(VER, 225) >= 0) ?"),
    ("if(+VER >= 225){\n  const CARRY", "if(SV.cmp(VER, 225) >= 0){\n  const CARRY"),
    ("const SWIM_D110A = +VER > 211;", "const SWIM_D110A = SV.cmp(VER, 211) > 0;"),
    ("if(+VER >= 225){\n  for(const r of C8_PACE){", "if(SV.cmp(VER, 225) >= 0){\n  for(const r of C8_PACE){"),
    ("const ERA = H.MANNY_DIGEST_BY_VERSION[IA.version];", "const ERA = SV.lookup(H.MANNY_DIGEST_BY_VERSION, IA.version);"),
],
G + 'g205_bike_unmoved.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = IA.version;", "const VER = SV.parse(IA.version);"),
    ("if(!HAS && VER < D128_ERA){", "if(!HAS && SV.cmp(VER, D128_ERA) < 0){"),
],
G + 'g205_chi_table6.js': [
    req("const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = IA.version;", "const VER = SV.parse(IA.version);"),
    ("if(!HAS && VER < D128_ERA){", "if(!HAS && SV.cmp(VER, D128_ERA) < 0){"),
    ("RUN_LABEL_BY_VERSION.filter(r => +VER >= r.from && +VER <= r.to)",
     "RUN_LABEL_BY_VERSION.filter(r => SV.cmp(VER, r.from) >= 0 && SV.cmp(VER, r.to) <= 0)"),
],
G + 'g205_d114_int_table6.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = IA.version;", "const VER = SV.parse(IA.version);"),
    ("if(!HAS && VER < D114_ERA){", "if(!HAS && SV.cmp(VER, D114_ERA) < 0){"),
    ("RUN_LABEL_BY_VERSION.filter(r => +VER >= r.from && +VER <= r.to)",
     "RUN_LABEL_BY_VERSION.filter(r => SV.cmp(VER, r.from) >= 0 && SV.cmp(VER, r.to) <= 0)"),
],
G + 'g205_d125_ceiling.js': [
    req("const { load, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = Number(IA.IA_VERSION);", "const VER = SV.parse(IA.IA_VERSION);"),
    ("if(VER >= 205){", "if(SV.cmp(VER, 205) >= 0){"),
    FILT_LOHI,
],
G + 'g205_d125_spaced.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = Number(IA.IA_VERSION);", "const VER = SV.parse(IA.IA_VERSION);"),
    ("if(VER >= 205){", "if(SV.cmp(VER, 205) >= 0){"),
    FILT_LOHI,
    ("NSW_TYPES_BY_ERA.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi))",
     "NSW_TYPES_BY_ERA.filter(r => (r.lo === undefined || SV.cmp(VER, r.lo) >= 0) && (r.hi === undefined || SV.cmp(VER, r.hi) <= 0))"),
    ("false, false, VER >= 213 ? true : undefined)", "false, false, SV.cmp(VER, 213) >= 0 ? true : undefined)"),
    ("if(VER >= 213 && T === TP", "if(SV.cmp(VER, 213) >= 0 && T === TP"),
    ("if(VER < 213) off++;", "if(SV.cmp(VER, 213) < 0) off++;"),
    ("if(VER < 213) ok('P8c", "if(SV.cmp(VER, 213) < 0) ok('P8c"),
],
G + 'g205_d129_tiebreak.js': [
    req("const fs = require('fs'), path = require('path'), vm = require('vm');", SVJ),
    # R1 with the gate's missing-meta tolerance kept: no meta stays NaN and P0 below reads it as before
    (r"const VER = parseInt((src.match(/name=" + '"ia-version" content="' + r'(\d+)"/) || [])[1], 10);',
     "const VER = /<meta name=\"ia-version\" content=\"/.test(src) ? SV.fromHtml(src) : NaN;   // no meta: NaN, as before"),
    ("if(VER >= 205){", "if(!Number.isNaN(VER) && SV.cmp(VER, 205) >= 0){"),
    ("PACE3_BY_ERA.filter(r=>(r.lo===undefined||VER>=r.lo)&&(r.hi===undefined||VER<=r.hi))",
     "PACE3_BY_ERA.filter(r=>(r.lo===undefined||SV.cmp(VER,r.lo)>=0)&&(r.hi===undefined||SV.cmp(VER,r.hi)<=0))"),
],
G + 'g205_d130_typed.js': [
    req("const fs=require('fs'), path=require('path'), vm=require('vm');", SVC),
    # R1 with the gate's missing-meta tolerance kept: no meta stays NaN and the skip below reads it as before
    (r"const VER=parseInt((SRC.match(/name=" + '"ia-version" content="' + r'(\d+)"/)||[])[1],10);',
     "const VER=/<meta name=\"ia-version\" content=\"/.test(SRC)?SV.fromHtml(SRC):NaN;   // no meta: NaN, as before"),
    ("if(!(VER>=205)){", "if(Number.isNaN(VER)||!(SV.cmp(VER,205)>=0)){"),
    FILT_LOHI,
],
G + 'g205_d132_walkweek.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = Number(IA.IA_VERSION);", "const VER = SV.parse(IA.IA_VERSION);"),
    ("if(VER >= 205){", "if(SV.cmp(VER, 205) >= 0){"),
    FILT_LOHI,
],
G + 'g205_pace_eve.js': [
    req("const { load } = require(path.join(__dirname, '..', 'harness.js'));", SVJ),
    ("const VER = Number(IA.IA_VERSION);", "const VER = SV.parse(IA.IA_VERSION);"),
    ("if(VER >= 205){", "if(SV.cmp(VER, 205) >= 0){"),
    ("RUN_LABEL_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)",
     "RUN_LABEL_BY_VERSION.filter(r => SV.cmp(VER, r.from) >= 0 && SV.cmp(VER, r.to) <= 0)"),
    ("P3B_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)",
     "P3B_BY_VERSION.filter(r => SV.cmp(VER, r.from) >= 0 && SV.cmp(VER, r.to) <= 0)"),
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
            line = s[:s.index(old)].count('\n') + 1
            s = s.replace(old, new)
            print('%s:%d  %s\n    -> %s' % (rel, line, old.strip().replace('\n', '\\n')[:150], new.strip().replace('\n', '\\n')[:170]))
        out[p] = s
    for p, s in out.items():
        open(p, 'w', encoding='utf-8').write(s)
    print('wrote %d files, %d replacements' % (len(out), sum(len(e) for e in EDITS.values())))


if __name__ == '__main__':
    main()
