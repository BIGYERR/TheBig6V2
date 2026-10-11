#!/usr/bin/env python3
# Post-V239 semver, slice 3B (tests only, no build; ia-version does not move): the second third of the gates.
# Ruling: tests/measure/post_v239_semver/design.md, gate conversion rules R1 to R10. Every version read goes through
# tests/semver.js (SV): R1 parse (+X.version, a gate's own meta regex -> SV.parse / SV.fromHtml), R2 ordered compares
# -> SV.cmp(A, B) op 0 (operator and operand order kept), R3 equality (===, !==, Array.includes) -> SV.cmp(A, B) === 0
# or !== 0, R4 version-keyed table reads (T[v], hasOwnProperty) -> SV.lookup(T, v) (!== undefined), R6 integer
# arithmetic on a legacy constant (ERA - 1, D183_ERA - 1) stays, R7 displays stay as written, R8 era constants and
# table keys stay integers, R10 no row, gate name, era key or era value moves and output on the 239 artifact is
# byte-identical. R5: no open upper bound in this slice is a large literal (every one is already Infinity).
# Env knob IA_ASSUME_VERSION (slice 3A's g203_mile_pencil shape): unset = no knob; set, it is a version and compares
# through SV.cmp, so IA_ASSUME_VERSION=0.223.0 names 223 as well (an unparseable value now throws).
# Plus one line of slice 3A's set (main session ruling, tooling shape): g193_pool_overlay's debt-file predicate grammar
# widens from '>=N ' / '<=N ' to N or M.m.p; a legacy line parses exactly as before and compares through SV.cmp.
# Every anchor is asserted count==1 against the file as it stands when the anchor applies; the first miss aborts the
# whole script before any file is written. Each replacement is printed with its line number for review.
import sys, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
G = 'tests/gates/'

SVJ = "const SV = require(path.join(__dirname, '..', 'semver.js'));"


def req(anchor):
    return (anchor, anchor + '\n' + SVJ)


def hreq(names):
    return req("const " + names + " = require(path.join(__dirname, '..', 'harness.js'));")


# the HALF_MANNY era row: R1 on eraV, R4 on the hasOwnProperty test and the row read (display '[' + eraV + ']' stays, R7)
HM = ("const eraV = +IA.version, eraHas = Object.prototype.hasOwnProperty.call(MANNY_DIGEST_BY_VERSION, eraV), eraRow = eraHas ? MANNY_DIGEST_BY_VERSION[eraV] : undefined;",
      "const eraV = SV.parse(IA.version), eraHas = SV.lookup(MANNY_DIGEST_BY_VERSION, eraV) !== undefined, eraRow = eraHas ? SV.lookup(MANNY_DIGEST_BY_VERSION, eraV) : undefined;")
ROWREAD = ("const row = MANNY_DIGEST_BY_VERSION[VER], rowOk", "const row = SV.lookup(MANNY_DIGEST_BY_VERSION, VER), rowOk")
VER_IA = ("const VER = +IA.version;", "const VER = SV.parse(IA.version);")
FILT_FT = (".filter(r => VER >= r.from && VER <= r.to)", ".filter(r => SV.cmp(VER, r.from) >= 0 && SV.cmp(VER, r.to) <= 0)")
NA_LT = ("if(VER < ERA){ console.log('NOT APPLICABLE", "if(SV.cmp(VER, ERA) < 0){ console.log('NOT APPLICABLE")
# the pre-bump knob: R3 on both sides; ERA - 1 is legacy-constant arithmetic (R6 keeps it)
ASSUME = ("if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){",
          "if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){")
ASSUMED = ("(VER !== STAMP ? ' (assumed ' + VER + ')' : '')", "(SV.cmp(VER, STAMP) !== 0 ? ' (assumed ' + VER + ')' : '')")
REFUSE = ("if(!(VER >= ERA)){", "if(!(SV.cmp(VER, ERA) >= 0)){")
ERA_V = ("ERA_V = (process.env.IA_ASSUME_VERSION === String(D183_ERA) && VER === D183_ERA - 1) ? D183_ERA : VER;",
         "ERA_V = (process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, D183_ERA) === 0 && SV.cmp(VER, D183_ERA - 1) === 0) ? D183_ERA : VER;")
ERA_V_NE = ("if(ERA_V !== VER) console.log(", "if(SV.cmp(ERA_V, VER) !== 0) console.log(")
# a baseline's own version check '+b.version === N' is R1 + R3: SV.cmp(b.version, N) === 0 (written out per file below)


EDITS = {
G + 'g206_d109_copy.js': [
    hreq("{ load, fixtures }"),
    VER_IA,
    ("const LIVE = VER >= D109_ERA;", "const LIVE = SV.cmp(VER, D109_ERA) >= 0;"),
    ("if(!(VER >= s.from)) continue;", "if(!(SV.cmp(VER, s.from) >= 0)) continue;"),
],
G + 'g206_d137_runbase_chi.js': [
    hreq("{ load, fixtures }"),
    VER_IA,
    ("if(VER < D137_ERA){", "if(SV.cmp(VER, D137_ERA) < 0){"),
    ("RUN_LABEL_BY_VERSION" + FILT_FT[0], "RUN_LABEL_BY_VERSION" + FILT_FT[1]),
],
G + 'g207_gk_trial_present.js': [
    hreq("{ load }"),
    ("const VER = +IA.version, ERA = 207;", "const VER = SV.parse(IA.version), ERA = 207;"),
    ("if(VER < ERA){ console.log('NOT APPLICABLE", "if(SV.cmp(VER, ERA) < 0){ console.log('NOT APPLICABLE"),
    ("HARD_BY_VERSION" + FILT_FT[0], "HARD_BY_VERSION" + FILT_FT[1]),
    ("if(VER >= ERA214 && i === ti - 1) return;", "if(SV.cmp(VER, ERA214) >= 0 && i === ti - 1) return;"),
    ("${VER >= ERA214 ? ' except the eve (D158)' : ''}", "${SV.cmp(VER, ERA214) >= 0 ? ' except the eve (D158)' : ''}"),
    ("if(VER < ERA208){", "if(SV.cmp(VER, ERA208) < 0){"),
    ("if(VER >= ERA214 && k === 1){", "if(SV.cmp(VER, ERA214) >= 0 && k === 1){"),
    ("${VER >= ERA214 ? \"a long LSD", "${SV.cmp(VER, ERA214) >= 0 ? \"a long LSD"),
    HM,
    ("if(VER < ERA214) ['Q9','Q9x']", "if(SV.cmp(VER, ERA214) < 0) ['Q9','Q9x']"),
],
G + 'g207_test_calendar.js': [
    req("const H = require(path.join(__dirname, '..', 'harness.js'));"),
    ("const VER = +IA0.version;", "const VER = SV.parse(IA0.version);"),
    ("const " + ERA_V[0], "const " + ERA_V[1]),
    ERA_V_NE,
    ("if(VER < D106A_ERA){", "if(SV.cmp(VER, D106A_ERA) < 0){"),
    ("const C4_ERA = ERA_V >= D183_ERA\n", "const C4_ERA = SV.cmp(ERA_V, D183_ERA) >= 0\n"),
    ("if(ERA_V < D183_ERA){", "if(SV.cmp(ERA_V, D183_ERA) < 0){"),
],
G + 'g207_test_week.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION }"),
    VER_IA,
    ("if(VER < D106A_ERA){", "if(SV.cmp(VER, D106A_ERA) < 0){"),
    ("RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi))",
     "RUN_CARD_ERAS.filter(r => (r.lo === undefined || SV.cmp(VER, r.lo) >= 0) && (r.hi === undefined || SV.cmp(VER, r.hi) <= 0))"),
    ("if(VER <= 212)", "if(SV.cmp(VER, 212) <= 0)"),
    ("if(VER < 213){ skipRow(", "if(SV.cmp(VER, 213) < 0){ skipRow("),
    HM,
],
G + 'g208_d103a_chip.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 208;", "const VER = SV.parse(IA.version), ERA = 208;"),
    ("if(VER < ERA){ ['A'", "if(SV.cmp(VER, ERA) < 0){ ['A'"),
    HM,
],
G + 'g208_d103a_key.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 208;", "const VER = SV.parse(IA.version), ERA = 208;"),
    ("if(VER < ERA){ ['K0'", "if(SV.cmp(VER, ERA) < 0){ ['K0'"),
    HM,
],
G + 'g208_d103a_readers.js': [
    hreq("{ load, progDigest, extractInlineJS, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 208;", "const VER = SV.parse(IA.version), ERA = 208;"),
    ("if(VER < ERA){ ['R'", "if(SV.cmp(VER, ERA) < 0){ ['R'"),
    ("if(VER < ERA214 || !b.dated)", "if(SV.cmp(VER, ERA214) < 0 || !b.dated)"),
    ("if(VER < ERA214) skip('E3e", "if(SV.cmp(VER, ERA214) < 0) skip('E3e"),
    ("(IB && +IB.version === 213)", "(IB && SV.cmp(IB.version, 213) === 0)"),
    ("if(+x.version === 213){", "if(SV.cmp(x.version, 213) === 0){"),
    ("${VER >= ERA214 ? '; from 214", "${SV.cmp(VER, ERA214) >= 0 ? '; from 214"),
    ROWREAD,
],
G + 'g208_d104a_runbase.js': [
    hreq("{ load, progDigest, fixtures, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 208;", "const VER = SV.parse(IA.version), ERA = 208;"),
    ("if(VER < ERA){ ROWS.forEach", "if(SV.cmp(VER, ERA) < 0){ ROWS.forEach"),
    ROWREAD,
],
G + 'g209_d140_tier.js': [
    hreq("{ load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION }"),
    VER_IA,
    ("if(!(VER >= D140_ERA)){", "if(!(SV.cmp(VER, D140_ERA) >= 0)){"),
    ("const WANT_MIN = VER >= 225\n", "const WANT_MIN = SV.cmp(VER, 225) >= 0\n"),
    ("const WANT_T = VER >= 225 ?", "const WANT_T = SV.cmp(VER, 225) >= 0 ?"),
    ("VER >= 225 ? {} : { 11:", "SV.cmp(VER, 225) >= 0 ? {} : { 11:"),
    ("(VER >= 225 ? 'W5 W6", "(SV.cmp(VER, 225) >= 0 ? 'W5 W6"),
    ("if(VER >= 225){", "if(SV.cmp(VER, 225) >= 0){"),
    ("if(VER < D188_ERA){", "if(SV.cmp(VER, D188_ERA) < 0){"),
    ROWREAD,
],
G + 'g210_equipment_denials.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION, DAYS }"),
    VER_IA,
    ("const EXPIRED = VER > D70C_ERA;", "const EXPIRED = SV.cmp(VER, D70C_ERA) > 0;"),
    ("const D154_SCOPED = VER <= D154_SCOPED_TO;", "const D154_SCOPED = SV.cmp(VER, D154_SCOPED_TO) <= 0;"),
    ("const D149_HELD = VER < D149_SHIPS;", "const D149_HELD = SV.cmp(VER, D149_SHIPS) < 0;"),
    ("if(!(VER >= D70C_ERA)){", "if(!(SV.cmp(VER, D70C_ERA) >= 0)){"),
    ("const MANNY = MANNY_DIGEST_BY_VERSION[VER], MANNY_ROW", "const MANNY = SV.lookup(MANNY_DIGEST_BY_VERSION, VER), MANNY_ROW"),
],
G + 'g211_d153_d155.js': [
    hreq("{ load, fixtures, progDigest, DAYS, MANNY_DIGEST_BY_VERSION }"),
    VER_IA,
    REFUSE,
    HM,
],
G + 'g212_d110a_swim.js': [
    hreq("{ load, fixtures, progDigest }"),
    VER_IA,
    ("if(!(VER >= ERA)){ skipRow(", "if(!(SV.cmp(VER, ERA) >= 0)){ skipRow("),
    ("if(!(VER >= ERA)){\n", "if(!(SV.cmp(VER, ERA) >= 0)){\n"),
    ("const P1N_RAN = (VER >= ERA &&", "const P1N_RAN = (SV.cmp(VER, ERA) >= 0 &&"),
],
G + 'g213_d113a.js': [
    hreq("{ load }"),
    VER_IA,
    ("if(!(VER >= ERA)){ skipRow(", "if(!(SV.cmp(VER, ERA) >= 0)){ skipRow("),
    ("if(!(VER >= ERA)){\n", "if(!(SV.cmp(VER, ERA) >= 0)){\n"),
    ("if(+b.version === 212){ BASE = b; baseWhy = 'argv", "if(SV.cmp(b.version, 212) === 0){ BASE = b; baseWhy = 'argv"),
    ("if(+b.version === 212){ BASE = b; baseWhy += 'git", "if(SV.cmp(b.version, 212) === 0){ BASE = b; baseWhy += 'git"),
],
G + 'g214_d158_eve.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 214,", "const VER = SV.parse(IA.version), ERA = 214,"),
    NA_LT,
    ("if(+b.version === 213){ BASE = b; baseWhy = 'argv", "if(SV.cmp(b.version, 213) === 0){ BASE = b; baseWhy = 'argv"),
    ("if(+b.version === 213){ BASE = b; baseWhy += 'git", "if(SV.cmp(b.version, 213) === 0){ BASE = b; baseWhy += 'git"),
    HM,
],
G + 'g215_d149_ghd.js': [
    hreq("{ load, progDigest, fixtures, DAYS, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 215;", "const VER = SV.parse(IA.version), ERA = 215;"),
    NA_LT,
    ("if(VER >= V231_ERA) ok('P1", "if(SV.cmp(VER, V231_ERA) >= 0) ok('P1"),
    HM,
],
G + 'g216_d154_swap_lens.js': [
    hreq("{ load, progDigest, fixtures, DAYS, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 216;", "const VER = SV.parse(IA.version), ERA = 216;"),
    NA_LT,
    HM,
],
G + 'g216_d156_longday.js': [
    hreq("{ load, progDigest, fixtures, MANNY_DIGEST_BY_VERSION }"),
    ("const VER = +IA.version, ERA = 216;", "const VER = SV.parse(IA.version), ERA = 216;"),
    NA_LT,
    HM,
],
G + 'g217_d160_dedupe_view.js': [
    hreq("{ load, progDigest, fixtures }"),
    ("const VER = +RAW.version, ERA = 217,", "const VER = SV.parse(RAW.version), ERA = 217,"),
    ("const CALPREV = VER >= 219;", "const CALPREV = SV.cmp(VER, 219) >= 0;"),
    NA_LT,
    ("if(+b.version === 216) src = b.html;", "if(SV.cmp(b.version, 216) === 0) src = b.html;"),
    # R1 + R3 on the gate's own meta test of the pinned V216 commit; no meta still takes the else branch, as before
    ("if(/ia-version\" content=\"216\"/.test(s)){",
     "if(/<meta name=\"ia-version\" content=\"/.test(s) && SV.cmp(SV.fromHtml(s), 216) === 0){"),
],
G + 'g218_d157_swim_sizer.js': [
    hreq("{ load, progDigest, fixtures }"),
    ("const VER = +C.version, ERA = 218,", "const VER = SV.parse(C.version), ERA = 218,"),
    ERA_V,
    ERA_V_NE,
    NA_LT,
    ("if(+b.version === 217) V217FILE", "if(SV.cmp(b.version, 217) === 0) V217FILE"),
    ("if(+load(f).version === 217) V217FILE = f;", "if(SV.cmp(load(f).version, 217) === 0) V217FILE = f;"),
    ("if(VER >= ERA) ok('U2", "if(SV.cmp(VER, ERA) >= 0) ok('U2"),
    ("const LB_ERA = ERA_V >= D183_ERA ?", "const LB_ERA = SV.cmp(ERA_V, D183_ERA) >= 0 ?"),
    ("const expTxt = ERA_V >= D183_ERA\n", "const expTxt = SV.cmp(ERA_V, D183_ERA) >= 0\n"),
],
G + 'g219_d167_pairs.js': [
    hreq("{ load, progDigest, fixtures, DAYS }"),
    ("const IA = load(ART), VER = +IA.version;", "const IA = load(ART), VER = SV.parse(IA.version);"),
    ("if(VER < ERA){ console.log('REFUSED", "if(SV.cmp(VER, ERA) < 0){ console.log('REFUSED"),
    ("if(+b.version === 218) vFile", "if(SV.cmp(b.version, 218) === 0) vFile"),
    ("if(+load(vFile).version !== 218) throw", "if(SV.cmp(load(vFile).version, 218) !== 0) throw"),
],
G + 'g219_samecard_draws.js': [
    hreq("{ load, progDigest, DAYS }"),
    ("VER = +IA.version, ROW = ERA[VER <= 218 ? 218 : VER];",
     "VER = SV.parse(IA.version), ROW = SV.lookup(ERA, SV.cmp(VER, 218) <= 0 ? 218 : VER);"),
    ("(ROW ? (VER <= 218 ? '<=218' : VER) : 'NONE')", "(ROW ? (SV.cmp(VER, 218) <= 0 ? '<=218' : VER) : 'NONE')"),
],
G + 'g220_d173_recovbanner.js': [
    hreq("{ load, fixtures, DAYS }"),
    ("const IA = load(ART), VER = +IA.version;", "const IA = load(ART), VER = SV.parse(IA.version);"),
    REFUSE,
],
G + 'g220_d174_emoji.js': [
    hreq("{ load }"),
    VER_IA,
    ("(VER >= 220 ? 'D174 (>=220)", "(SV.cmp(VER, 220) >= 0 ? 'D174 (>=220)"),
    ("if(!(VER >= 220)){", "if(!(SV.cmp(VER, 220) >= 0)){"),
],
G + 'g220_d175_popcond.js': [
    hreq("{ load, DAYS }"),
    ("VER = +IA.version; } catch(e){", "VER = SV.parse(IA.version); } catch(e){"),
    # R9: a failed boot leaves VER NaN and the refusal reads it as before (!(NaN >= ERA) was true)
    ("if(!(VER >= ERA)){", "if(Number.isNaN(VER) || !(SV.cmp(VER, ERA) >= 0)){"),
],
G + 'g221_d177_swapfloor.js': [
    hreq("{ load, progDigest }"),
    ("function cueBlind(s){ if(!(VER > 226 && typeof s === 'string'))", "function cueBlind(s){ if(!(SV.cmp(VER, 226) > 0 && typeof s === 'string'))"),
    ("STAMP = +IA.version;", "STAMP = SV.parse(IA.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
    ("if(VER >= ERA){\n", "if(SV.cmp(VER, ERA) >= 0){\n"),
    ("if(+b.version === BASE_ERA) B4 = b;", "if(SV.cmp(b.version, BASE_ERA) === 0) B4 = b;"),
    ("if(+b.version === BASE_ERA){ B4 = b;", "if(SV.cmp(b.version, BASE_ERA) === 0){ B4 = b;"),
    ("if(VER >= ERA && sdB4)", "if(SV.cmp(VER, ERA) >= 0 && sdB4)"),
    ("if(VER >= D193_ERA){\n            const Db9 = stripHand(D), capd9", "if(SV.cmp(VER, D193_ERA) >= 0){\n            const Db9 = stripHand(D), capd9"),
    ("if(VER >= D193_ERA){\n            const Db9 = stripHand(D), E9", "if(SV.cmp(VER, D193_ERA) >= 0){\n            const Db9 = stripHand(D), E9"),
    ("const D9 = VER >= D193_ERA, ERA231 = VER >= D193_V231_ERA,", "const D9 = SV.cmp(VER, D193_ERA) >= 0, ERA231 = SV.cmp(VER, D193_V231_ERA) >= 0,"),
],
G + 'g221_d178_active.js': [
    hreq("{ load }"),
    ("STAMP = +IA.version;", "STAMP = SV.parse(IA.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
],
G + 'g221_d179_donenav.js': [
    req("const H = require(path.join(__dirname, '..', 'harness.js'));"),
    ("STAMP = +E.IA.version;", "STAMP = SV.parse(E.IA.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
    ("const ws = VER >= 236 ? wrapSync()", "const ws = SV.cmp(VER, 236) >= 0 ? wrapSync()"),
    ("if(VER <= 235) for(", "if(SV.cmp(VER, 235) <= 0) for("),
    ("tally('W2', VER >= 236 ? 4 : 2)", "tally('W2', SV.cmp(VER, 236) >= 0 ? 4 : 2)"),
],
G + 'g221_d180_blockopen.js': [
    hreq("{ load, progDigest, fixtures }"),
    ("STAMP = +IA0.version;", "STAMP = SV.parse(IA0.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
],
G + 'g222_d181_chain.js': [
    hreq("{ load, fixtures }"),
    ("STAMP = +IA.version;", "STAMP = SV.parse(IA.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
    # R3: Array.includes is an equality on the version (SameValueZero), so it reads through SV.cmp
    ("const LIC5L = LIC5L_ERAS.includes(VER);", "const LIC5L = LIC5L_ERAS.some(e => SV.cmp(e, VER) === 0);"),
    ("if(+b.version === BASE_ERA){ B = b; FILES.B = BASEFILE;", "if(SV.cmp(b.version, BASE_ERA) === 0){ B = b; FILES.B = BASEFILE;"),
    ("if(+b.version === BASE_ERA){ B = b; FILES.B = f;", "if(SV.cmp(b.version, BASE_ERA) === 0){ B = b; FILES.B = f;"),
],
G + 'g222_d181_durable.js': [
    hreq("{ load, progDigest, MANNY_DIGEST_BY_VERSION }"),
    ("STAMP = +IA.version;", "STAMP = SV.parse(IA.version);"),
    ASSUME,
    ASSUMED,
    REFUSE,
],
# slice 3A's file, one line (main session ruling): the predicate's N is a legacy integer or a dotted M.m.p
G + 'g193_pool_overlay.js': [
    ("// V215: a line may open with an ia-version predicate, '>=N ' or '<=N ' (standing ruling 4: an entry is",
     "// V215: a line may open with an ia-version predicate, '>=N ' or '<=N ', N a legacy build number or M.m.p\n"
     "// (Post-V239; compared through tests/semver.js) (standing ruling 4: an entry is"),
    (r"l.match(/^(>=|<=)(\d+)\s+(.*)$/)", r"l.match(/^(>=|<=)(\d+(?:\.\d+\.\d+)?)\s+(.*)$/)"),
],
}


def main():
    out = {}
    n_rep = 0
    for rel, edits in EDITS.items():
        p = os.path.join(ROOT, rel)
        s = open(p, encoding='utf-8').read()
        for k, (old, new) in enumerate(edits):
            n = s.count(old)
            if n != 1:
                sys.exit('ABORT %s edit %d: anchor count %d (want 1): %r' % (rel, k, n, old[:120]))
            line = s[:s.index(old)].count('\n') + 1
            s = s.replace(old, new)
            n_rep += 1
            print('%s:%d  %s\n    -> %s' % (rel, line, old.strip().replace('\n', '\\n')[:150], new.strip().replace('\n', '\\n')[:170]))
        out[p] = s
    for p, s in out.items():
        open(p, 'w', encoding='utf-8').write(s)
    print('wrote %d files, %d replacements' % (len(out), n_rep))


if __name__ == '__main__':
    main()
