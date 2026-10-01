#!/usr/bin/env python3
# V226 slice 7a of 7: the existing suite at era 226. Tests only; index.html is not touched.
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE,
# accepted by Mario 2026-09-30), "Blast radius -> Tests" under each, HALF_MANNY section, Copy section.
# Four edits (one per file), class (a) only: each red row keeps its old expectation at ia-version <= 225
# and gains the ruled one at >= 226 (standing rulings 2, 3, 4). New expectations are typed from the
# ruling's Copy / After text or hand tables, never read from the engine.
#   1. tests/harness.js        MANNY_DIGEST_BY_VERSION[226] (+ the DELOAD_OFF and CORE_OFF rows of the same
#                              fixture), REFERENCE rows to 225: ruled UNMOVED at 0ac7da6b1691a8e1.
#   2. g203_mile_pencil.js     D188 E10 beginner pencil 0 -> 1, D189 F7 run_base pencil and Run paces group,
#                              D189 F4 over-25:00 string.
#   3. g203_ceiling_and_anchor D189 F9 card forms (the level default, the pencil), D188 E7 anchor shape (exp).
#   4. g223_d183_safepace.js   D188 E1/E2 hand oracle (:220/:227/:234), S3/A4 generic beginner form,
#                              D189 F5/F6 required-and-blank S2 and S8 A3.
# All anchors count==1 at the moment they are replaced, or nothing is written (every file is written
# together, only after every assertion passed).
import sys

ROOT = "/Users/CanasBangin/Desktop/TheBig6V2/"
FILES = {
    "harness": ROOT + "tests/harness.js",
    "pencil": ROOT + "tests/gates/g203_mile_pencil.js",
    "ceiling": ROOT + "tests/gates/g203_ceiling_and_anchor.js",
    "safepace": ROOT + "tests/gates/g223_d183_safepace.js",
}
SRC = {k: open(p, encoding="utf-8").read() for k, p in FILES.items()}


def rep(key, old, new, label):
    n = SRC[key].count(old)
    if n != 1:
        sys.stderr.write("ABORT %s: anchor count %d (want 1); nothing written\n" % (label, n))
        sys.exit(1)
    SRC[key] = SRC[key].replace(old, new, 1)


def after_line(key, prefix, newline, label):
    lines = [l for l in SRC[key].split("\n") if l.startswith(prefix)]
    if len(lines) != 1:
        sys.stderr.write("ABORT %s: line-prefix count %d (want 1); nothing written\n" % (label, len(lines)))
        sys.exit(1)
    rep(key, lines[0] + "\n", lines[0] + "\n" + newline + "\n", label)


# ── 1. harness: the 226 reference rows ───────────────────────────────────────────────────────────
after_line("harness", "MANNY_DIGEST_BY_VERSION[225] = MANNY_DIGEST_BY_VERSION[224];",
    "MANNY_DIGEST_BY_VERSION[226] = MANNY_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (D188 reads a beginner's entered mile and D189 discloses a default anchor; HALF_MANNY is intermediate with an entered 10:30 mile, kind `entered`, so neither the beginner reads nor the S1 default-anchor note reach it; the ruling (tests/measure/v226_rulings/d188_d189_ruling.md, HALF_MANNY) states \"Stays `0ac7da6b1691a8e1`\" on both arms and \"Era row 226 = reference to 225 (standing ruling 5, no digest printed because none moved)\"; 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V226 working tree (slices 1 to 6 landed) with g199's and g200's methods before this row)",
    "harness MANNY 226")
after_line("harness", "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[225] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[224];",
    "MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (same reasoning as MANNY_DIGEST_BY_VERSION[226]: HALF_MANNY's anchor is kind `entered`, so D188's beginner reads and D189's default-anchor note never reach it with recoveryDeload suppressed either; 1069cd7f86eed204 printed by builder on the V226 working tree with g199's method before this row)",
    "harness DELOAD_OFF 226")
after_line("harness", "MANNY_CORE_OFF_DIGEST_BY_VERSION[225] = MANNY_CORE_OFF_DIGEST_BY_VERSION[224];",
    "MANNY_CORE_OFF_DIGEST_BY_VERSION[226] = MANNY_CORE_OFF_DIGEST_BY_VERSION[225];   // V226 (D188 P-BEGINNERMILE, D189 P-PACEDISCLOSE): ruled UNMOVED (HALF_MANNY's anchor is kind `entered`, so the core-off counterfactual is unreached the same way MANNY_DIGEST_BY_VERSION[226] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[226] are; 9d14801a63111081 printed by builder on the V226 working tree with g200's method before this row)",
    "harness CORE_OFF 226")

# ── 2. g203_mile_pencil.js ───────────────────────────────────────────────────────────────────────
rep("pencil",
    "//     runAnchor at all, and a beginner gets none because the beginner default is\n",
    "//     runAnchor at all, and a beginner gets none because the beginner default is\n"
    "//     (ia-version <= 225; from 226 D188 E10 makes the pencil unconditional and D189 F7\n"
    "//     gives run_base a runAnchor, so every row gets one: see section 4's era rows)\n",
    "pencil header comment")
rep("pencil",
    "const MSG_OVER_25_D183 = 'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.';\n",
    "const MSG_OVER_25_D183 = 'Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.';\n"
    "// D189 (P-PACEDISCLOSE F4, tests/measure/v226_rulings/d188_d189_ruling.md, Copy \"D9 >25:00\") at ia-version >= 226. Typed from the ruling.\n"
    "const MSG_OVER_25_D189 = 'Over 25:00 reads as a walk, not a run. Check the entry.';\n",
    "pencil MSG_OVER_25_D189")
rep("pencil",
    "const MSG_OVER_25 = eraV >= D183_ERA ? MSG_OVER_25_D183 : MSG_OVER_25_D9;\n",
    "// D189 era (ia-version >= 226, P-PACEDISCLOSE F4): the over-25:00 string stops recommending a blank; the\n"
    "// under-3:00 string is untouched by D189 and keeps its D183 era above.\n"
    "const D189_ERA = 226;\n"
    "const OVER_25_TAG = eraV >= D189_ERA ? 'D189' : MILE_MSG_TAG;\n"
    "const MSG_OVER_25 = eraV >= D189_ERA ? MSG_OVER_25_D189 : eraV >= D183_ERA ? MSG_OVER_25_D183 : MSG_OVER_25_D9;\n",
    "pencil MSG_OVER_25 era")
rep("pencil",
    "eq('26:00 uses the ' + MILE_MSG_TAG + ' over-25:00 string', toasts[0], MSG_OVER_25);\n",
    "eq('26:00 uses the ' + OVER_25_TAG + ' over-25:00 string', toasts[0], MSG_OVER_25);\n",
    "pencil over-25 row tag")
rep("pencil",
    "console.log('ERA mile validator strings: ' + MILE_MSG_ERA);\n",
    "console.log('ERA mile validator strings: ' + MILE_MSG_ERA + (eraV >= D189_ERA ? '; over-25:00 is D189 era (ia-version ' + eraV + ' >= ' + D189_ERA + '): P-PACEDISCLOSE F4' : ''));\n",
    "pencil era log")
rep("pencil",
    "const PENCIL_GRID = [\n"
    "  { label: 'run_half / intermediate (chart-reading anchor)', cfg: {}, pencils: 1 },\n"
    "  { label: 'run_base (no runAnchor at all)', cfg: { cardioGoals:{ run:{ id:'run_base', label:'Build a Base' } } }, pencils: 0 },\n"
    "  { label: 'beginner experience (beginner default anchor)', cfg: { experience:'beginner' }, pencils: 0 },\n"
    "];\n",
    "// ERA ROWS (standing rulings 2 and 4). <= 225: the V203 after-grid. >= 226: D188 E10 makes the pencil\n"
    "// unconditional (\"beginner pencils: 0\" -> 1 from 226) and D189 F7 gives run_base a runAnchor (Class C:\n"
    "// \"run_base gains the Run paces group (Mile, Recovery), the sentence, the clipboard line and a pencil\"),\n"
    "// both typed from tests/measure/v226_rulings/d188_d189_ruling.md.\n"
    "const D188_ERA = 226;\n"
    "const PENCIL_D188 = eraV >= D188_ERA;\n"
    "const PENCIL_GRID = [\n"
    "  { label: 'run_half / intermediate (chart-reading anchor)', cfg: {}, pencils: 1 },\n"
    "  PENCIL_D188\n"
    "    ? { label: 'D189 era: run_base (runAnchor, Run paces group, pencil)', cfg: { cardioGoals:{ run:{ id:'run_base', label:'Build a Base' } } }, pencils: 1 }\n"
    "    : { label: 'run_base (no runAnchor at all)', cfg: { cardioGoals:{ run:{ id:'run_base', label:'Build a Base' } } }, pencils: 0 },\n"
    "  PENCIL_D188\n"
    "    ? { label: 'D188 era: beginner experience (the pencil is unconditional)', cfg: { experience:'beginner' }, pencils: 1 }\n"
    "    : { label: 'beginner experience (beginner default anchor)', cfg: { experience:'beginner' }, pencils: 0 },\n"
    "];\n",
    "pencil PENCIL_GRID")
rep("pencil",
    "ok('run_base renders no Run paces group at all', !/det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[1].cfg))));\n"
    "ok('beginner still renders the Run paces group (chips, no pencil)', /det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[2].cfg))));\n",
    "if(!PENCIL_D188){\n"
    "  ok('run_base renders no Run paces group at all', !/det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[1].cfg))));\n"
    "  ok('beginner still renders the Run paces group (chips, no pencil)', /det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[2].cfg))));\n"
    "} else {\n"
    "  ok('D189 era: run_base renders the Run paces group', /det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[1].cfg))));\n"
    "  ok('D188 era: beginner renders the Run paces group (chips and pencil)', /det-label[^>]*>Run paces/.test(detail(mkProg(PENCIL_GRID[2].cfg))));\n"
    "}\n",
    "pencil Run paces group rows")

# ── 3. g203_ceiling_and_anchor.js ────────────────────────────────────────────────────────────────
rep("ceiling",
    "function A(o){ return Object.assign({ anchorSec:630, rawSec:630, clamped:null, row:{}, kind:'entered',\n"
    "                                      prog:'', n:0, wk:0, from:null, race:'half', goalId:'run_half' }, o); }\n",
    "// ERA (standing rulings 2 and 4), keyed to D188/D189 (tests/measure/v226_rulings/d188_d189_ruling.md) at\n"
    "// ia-version >= 226: runAnchorInfo's return gains `exp` (D188 E7), the sentence names the level's default\n"
    "// (D189 F9: \"the intermediate default\") and the kind 'beginner' writer is retired, so a beginner with no mile\n"
    "// is kind 'default' with exp 'beginner'. The typed anchors carry exp from 226 because the ruled shape does;\n"
    "// the V203 rows stay asserted at <= 225.\n"
    "const D189_ERA = 226;\n"
    "const ERA_D189 = artifactV >= D189_ERA;\n"
    "function A(o){ return Object.assign({ anchorSec:630, rawSec:630, clamped:null, row:{}, kind:'entered',\n"
    "                                      prog:'', n:0, wk:0, from:null, race:'half', goalId:'run_half' }, ERA_D189 ? { exp:'intermediate' } : {}, o); }\n",
    "ceiling A()")
rep("ceiling",
    "eq('edited + from.kind default names the week and says it was estimated',\n"
    "   sentence(A({ kind:'edited', wk:6, from:{ kind:'default', mins:'', secs:'' } })),\n"
    "   'Anchored on a <b>10:30 mile</b>, the time you entered in week 6. Before that it was estimated from experience.' + TAIL);\n",
    "if(!ERA_D189)\n"
    "eq('edited + from.kind default names the week and says it was estimated',\n"
    "   sentence(A({ kind:'edited', wk:6, from:{ kind:'default', mins:'', secs:'' } })),\n"
    "   'Anchored on a <b>10:30 mile</b>, the time you entered in week 6. Before that it was estimated from experience.' + TAIL);\n"
    "else   // D189 Copy \"Card, edited from default\"\n"
    "eq('D189 era: edited + from.kind default names the week and the level default',\n"
    "   sentence(A({ kind:'edited', wk:6, from:{ kind:'default', mins:'', secs:'' } })),\n"
    "   'Anchored on a <b>10:30 mile</b>, the time you entered in week 6. Before that it was the intermediate default.' + TAIL);\n",
    "ceiling edited-from-default row")
rep("ceiling",
    "eq('beginner (no tail, and the article is \"an\" at 11:30)',\n"
    "   sentence(A({ kind:'beginner', anchorSec:690, rawSec:690 })),\n"
    "   'Anchored on an <b>11:30 mile</b>, the beginner default. A mile time starts being used at intermediate.');\n"
    "eq('default / estimated from experience', sentence(A({ kind:'default', anchorSec:570, rawSec:570 })),\n"
    "   'Anchored on a <b>9:30 mile</b>, estimated from experience; no mile time was entered.' + TAIL);\n",
    "if(!ERA_D189){\n"
    "eq('beginner (no tail, and the article is \"an\" at 11:30)',\n"
    "   sentence(A({ kind:'beginner', anchorSec:690, rawSec:690 })),\n"
    "   'Anchored on an <b>11:30 mile</b>, the beginner default. A mile time starts being used at intermediate.');\n"
    "eq('default / estimated from experience', sentence(A({ kind:'default', anchorSec:570, rawSec:570 })),\n"
    "   'Anchored on a <b>9:30 mile</b>, estimated from experience; no mile time was entered.' + TAIL);\n"
    "} else {   // D189 Copy \"Card, default\" + existing tail; After \"card run_5k|beginner\"\n"
    "eq('D188/D189 era: beginner with no mile is the default form (\"an\" at 11:30, the beginner default, the tail)',\n"
    "   sentence(A({ kind:'default', exp:'beginner', anchorSec:690, rawSec:690 })),\n"
    "   'Anchored on an <b>11:30 mile</b>, the beginner default. No mile time was entered. Tap the pencil to enter one.' + TAIL);\n"
    "eq('D189 era: default names the intermediate default and the pencil', sentence(A({ kind:'default', anchorSec:570, rawSec:570 })),\n"
    "   'Anchored on a <b>9:30 mile</b>, the intermediate default. No mile time was entered. Tap the pencil to enter one.' + TAIL);\n"
    "}\n",
    "ceiling beginner/default rows")

# ── 4. g223_d183_safepace.js ─────────────────────────────────────────────────────────────────────
RS = r"""const RATE_STAMP = +((fs.readFileSync(ART, 'utf8').match(/<meta name="ia-version" content="(\d+)"/) || [])[1] || NaN);
"""
rep("safepace", RS,
    RS +
    "// D188 P-BEGINNERMILE / D189 P-PACEDISCLOSE (V226, tests/measure/v226_rulings/d188_d189_ruling.md), keyed on the\n"
    "// same real stamp (standing rulings 2 and 4). D188 E1 reads a beginner's mile like anyone's (the hand oracle's\n"
    "// `exp !== 'beginner' && mileSecs` -> `mileSecs`); E2 retires the beginner sentence so a beginner takes the\n"
    "// generic form (Mario (b)); D189 F5/F6: while the mile is required and blank (intermediate/advanced pace goal)\n"
    "// the feasibility line and the dated card's reach go quiet and a dated test pin keeps its week in the header.\n"
    "const D188_STAMP = RATE_STAMP >= 226;\n",
    "safepace D188_STAMP")
rep("safepace",
    "  S2: 'S2 dated tw 5, no mile, intermediate, goal 12:00: --accent card, R3 sentence then the no-mile sentence (9:30 default, 14:15)',\n",
    "  S2: D188_STAMP ? 'S2 dated tw 5, no mile, intermediate, goal 12:00, D189 F5/F6 required and blank: --run card, the R3 sentence alone, no reach on the step, header keeps the test week'\n"
    "                 : 'S2 dated tw 5, no mile, intermediate, goal 12:00: --accent card, R3 sentence then the no-mile sentence (9:30 default, 14:15)',\n",
    "safepace ROWS.S2")
rep("safepace",
    "  S3: 'S3 dated tw 5, beginner, goal 12:00, with and without a stale mile in WD: --accent card, R3 sentence then the beginner sentence (11:30 default, 17:15)',\n",
    "  S3: D188_STAMP ? 'S3 dated tw 5, beginner, goal 12:00: no mile --accent card, R3 sentence then the generic beginner sentence (11:30 default, 17:15, D188 E2); mile 8:00 is read (D188 E1), no gap, --run card, the R3 sentence alone'\n"
    "                 : 'S3 dated tw 5, beginner, goal 12:00, with and without a stale mile in WD: --accent card, R3 sentence then the beginner sentence (11:30 default, 17:15)',\n",
    "safepace ROWS.S3")
rep("safepace",
    "  S8: 'S8 undated #paceFeasLine frame: amendment 3 A2/A3/A4 sentences exactly, visible, --accent, no button, no \"safe\"',\n",
    "  S8: D188_STAMP ? 'S8 undated #paceFeasLine frame: A2 and A4 (D188 generic beginner form) exactly, visible, --accent, no button, no \"safe\"; A3 required and blank, the frame empty and hidden (D189 F6)'\n"
    "                 : 'S8 undated #paceFeasLine frame: amendment 3 A2/A3/A4 sentences exactly, visible, --accent, no button, no \"safe\"',\n",
    "safepace ROWS.S8")
rep("safepace",
    "  const cur = (exp !== 'beginner' && mileSecs) ? mileSecs : DEFAULT_MILE[exp];\n",
    "  const cur = (D188_STAMP ? mileSecs : (exp !== 'beginner' && mileSecs)) ? mileSecs : DEFAULT_MILE[exp];   // D188 E1 from 226\n",
    "safepace handReach cur")
rep("safepace",
    "           fromMile: exp !== 'beginner' && !!mileSecs, exp, distLabel: dist + ' ' + unit, goalSecs };\n",
    "           fromMile: D188_STAMP ? !!mileSecs : (exp !== 'beginner' && !!mileSecs), exp, distLabel: dist + ' ' + unit, goalSecs };\n",
    "safepace handReach fromMile")
rep("safepace",
    "  if(r.exp === 'beginner') return 'Your paces start from the beginner default of ' + clk(r.cur) + ' per mile.' + reach + ' Keep it or change it above.';\n",
    "  if(!D188_STAMP && r.exp === 'beginner') return 'Your paces start from the beginner default of ' + clk(r.cur) + ' per mile.' + reach + ' Keep it or change it above.';   // retired by D188 E2 from 226\n",
    "safepace handSentence beginner")
rep("safepace",
    "  S3: 'Your paces start from the beginner default of 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Keep it or change it above.',   // amendment 2 (b)\n",
    "  S3: D188_STAMP\n"
    "    ? 'You have not entered a mile time. The beginner default is 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Enter your mile above and this updates.'   // D188 E2 / Mario (b): D183's generic form at the hand L5 numbers\n"
    "    : 'Your paces start from the beginner default of 11:30 per mile. In 5 weeks that reaches about 1.5 mi in 17:15. Your goal is 12:00. Keep it or change it above.',   // amendment 2 (b)\n",
    "safepace V.S3")
rep("safepace",
    "  A4: 'Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Keep it or change it above.',  // A4\n",
    "  A4: D188_STAMP\n"
    "    ? 'You have not entered a mile time. The beginner default is 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Enter your mile above and this updates.'   // D188/D189 Copy \"Feasibility, beginner no mile\", verbatim\n"
    "    : 'Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Keep it or change it above.',  // A4\n",
    "safepace V.A4")
rep("safepace",
    "  const r3 = handReach(5, 'beginner', '18-35', 480, 1.5, 'mi', 720);\n"
    "  eq('beginner L5 reach (mile ignored)', clk(r3.total), '17:15'); eq('gap', Math.round(r3.gap), 210); eq('S3 sentence', handSentence(r3), V.S3);\n",
    "  const r3 = handReach(5, 'beginner', '18-35', D188_STAMP ? null : 480, 1.5, 'mi', 720);   // D188 (V226): a beginner's mile is read, so S3's 17:15 is the no-mile beginner\n"
    "  eq(D188_STAMP ? 'beginner L5 reach (no mile, D188)' : 'beginner L5 reach (mile ignored)', clk(r3.total), '17:15'); eq('gap', Math.round(r3.gap), 210); eq('S3 sentence', handSentence(r3), V.S3);\n"
    "  if(D188_STAMP){ const r3m = handReach(5, 'beginner', '18-35', 480, 1.5, 'mi', 720);\n"
    "    eq('D188 beginner 8:00 L5 reach (mile read)', clk(r3m.total), '12:00'); eq('D188 beginner 8:00 goal 12:00 shows no gap', r3m.shows, false); }\n",
    "safepace Z1 r3")
rep("safepace",
    "  cell(bad, 'S2', s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S2, HDR_TEST(W5)));\n",
    "  if(D188_STAMP){   // D189 F5/F6: required and blank; the dated card quotes no reach (S4's no-gap shape), the header keeps the test week\n"
    "    const m = s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5));\n"
    "    if(!s.crash && s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step');\n"
    "    cell(bad, 'S2', m);\n"
    "  } else\n"
    "  cell(bad, 'S2', s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S2, HDR_TEST(W5)));\n",
    "safepace S2 block")
rep("safepace",
    "    const s = tryDo(() => cardCase({ experience:'beginner' }, run));\n"
    "    cell(bad, 'S3 ' + lbl, s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S3, HDR_TEST(W5))); }\n",
    "    const s = tryDo(() => cardCase({ experience:'beginner' }, run));\n"
    "    if(D188_STAMP && lbl !== 'no mile'){   // D188 E1: the 8:00 is read, not stale. Hand oracle: no gap at L5, so S4's shape\n"
    "      const r = handReach(W5, 'beginner', '18-35', 480, 1.5, 'mi', 720);\n"
    "      const m = r.shows ? ['oracle: beginner 8:00 at week ' + W5 + ' shows a gap'] : [];\n"
    "      if(s.crash) m.push('crash ' + s.crash);\n"
    "      else { m.push(...cardMsgs(s, 'var(--run)', CARD_TW(W5), HDR_TEST(W5))); if(s.text.indexOf(REACH_TOKEN) >= 0) m.push('a reach sentence on the step'); }\n"
    "      cell(bad, 'S3 D188 mile 8:00 read', m); continue; }\n"
    "    cell(bad, 'S3 ' + lbl, s.crash ? ['crash ' + s.crash] : cardMsgs(s, 'var(--accent)', CARD_TW(W5) + ' ' + V.S3, HDR_TEST(W5))); }\n",
    "safepace S3 block")
rep("safepace",
    "    const m = [], el = reg.get('paceFeasLine');\n"
    "    if(!inBody('paceFeasLine') || !el || el.style.display !== 'block') m.push('frame not shown (display ' + J(el && el.style.display) + ')');\n",
    "    const m = [], el = reg.get('paceFeasLine');\n"
    "    if(D188_STAMP && lbl === 'A3'){   // D189 F6: required and blank, the feasibility line is empty (ruling After: \"feas: (empty)\")\n"
    "      if(!inBody('paceFeasLine') || !el) m.push('frame not in the step');\n"
    "      else if(el.style.display === 'block') m.push('frame shown (display \"block\") with ' + J(s.feasText));\n"
    "      if(s.feasText !== '') m.push('frame ' + J(s.feasText) + ' want \"\"');\n"
    "      cell(bad, lbl, m); continue; }\n"
    "    if(!inBody('paceFeasLine') || !el || el.style.display !== 'block') m.push('frame not shown (display ' + J(el && el.style.display) + ')');\n",
    "safepace S8 A3")

for k, p in FILES.items():
    open(p, "w", encoding="utf-8").write(SRC[k])
print("v226_edit_7a: 4 files written:", ", ".join(FILES[k] for k in FILES))
