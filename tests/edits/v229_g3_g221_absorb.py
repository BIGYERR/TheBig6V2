#!/usr/bin/env python3
# V229 gate slice G3 (class (B), ruled absorbs): tests/gates/g221_d177_swapfloor.js re-keyed above the D193 era.
# Rulings (cite only the files):
#   tests/measure/v228_rulings/d193_caprpe_ruling.md: Amendment 2 gate claims (l) "D177 verbatim rows re-scoped
#   (G3a/G3d/G3e/G3f/G3c-off). D177's claim is verbatim beneath the plan's hold" and (k) "`g221` G6a's hand kind gains a
#   `hold` flag from the hand cap table plus a hand RPE parse (independent oracle, never the engine)"; Amendment 4 "The
#   rules" ((l) predicate; R8 trigger restated) and its corrected claims (l) "Rows to absorb on CF3 with the V228 figure
#   0: G3a 832, G3d 263, G3e 202, G3f 199, G3c-off 168. G3c power 0 | 0." and (k) "0 false claims".
#   tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r): "g221 G3a 832 / G3c off-grammar 168, power 0 /
#   G3d 263 / G3e 202 / G3f 199 (D193 Amendment 4); g221 G6a 1,252 of 150,068 ... (D193 R8: every moved toast ends with
#   the hold sentence and its pair's clamp changed the number by the (k) hand oracle; count pinned; the row parks if any
#   moved toast is not a hold variant)" (its G6a figure replaced by Amendment 3: "`g221` G6a **1,243 of 150,068** (D193 R8,
#   Amendment 4 (k)): at 229 and up the V119 'changed [0,0] pair' is judged against the donor read beneath its hold, the
#   (l) lens"; the parked slice "resumes with the pin and the 229 `wantT` lens corrected"), and "Comment on every fixture row: 'fixture presentation (`cfg.injury`
#   stored); app equivalence is D194 part 2's row'."
# Four edits, one file:
#   A4  header VERSION PREDICATE gains the "229 and up" line naming the rulings and the pinned figures.
#   A1  the hand oracle block (cap table, stripper, hold, RPE parse, bucket, R8 toasts, pins), after FALLBACK.
#   A2  the L1 sweep: the existing lines verbatim, plus the (k) toast check after the third-toast count and the (l) card
#       check after the window line, both only at VER >= 229.
#   A3  the G3a G3c G3d G3e G3f G6a assertions: at 229 and up the (l)/(k) predicate on the row's whole population with
#       the moved count pinned as a conjunct; below 229 the original line, verbatim, in the else branch.
# All or none: index.html must be the V229 candidate and the gate the shipped file (sha256 below); every anchor count==1;
# new names absent; the result passes node --check.
import sys, re, hashlib, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
GATE = ROOT + '/tests/gates/g221_d177_swapfloor.js'
GATE_SHA256_PREFIX = 'baede142c56dc472'
CAND_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

gb = open(GATE, 'rb').read()
if not hashlib.sha256(gb).hexdigest().startswith(GATE_SHA256_PREFIX): die('gate is not the shipped file (sha256 %s)' % hashlib.sha256(gb).hexdigest())
ib = open(ROOT + '/index.html', 'rb').read()
if hashlib.sha256(ib).hexdigest() != CAND_SHA256: die('index.html is not the V229 candidate (sha256 %s)' % hashlib.sha256(ib).hexdigest())
src = gb.decode('utf-8')
for nm in ['D193_ERA', 'D193_PIN', 'CAP_HAND', 'stripHand', 'holdHand', 'rpeHand', 'bucketHand', 'capHand', 'S9', 'note9', 'exs9', 'T3H', 'T119H', 'TSAMEH', 'D9', 'CONVERTS_HAND']:
    if re.search(r'\b' + nm + r'\b', src): die('name already in the gate: ' + nm)

EDITS = [
    ('A4 header VERSION PREDICATE: 229 and up',
     r"""//   221 and up     hand and class rows (G1 G2 G3 G5 G6 G7-1 G7-2a G8b) assert.
""",
     r"""//   221 and up     hand and class rows (G1 G2 G3 G5 G6 G7-1 G7-2a G8b) assert.
//   229 and up     D193's build half (V229): G3a G3c G3d G3e G3f and G6a assert D177's claim BENEATH THE PLAN'S HOLD
//                  (tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 4 "The rules", (l) predicate and R8 trigger
//                  restated; tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r)) by the hand oracle under
//                  "V229 D193 ERA" below, on each row's whole population, and pin as a conjunct how many cards and toasts
//                  moved against D177's own comparison: G3a 832, G3c power 0 / off grammar 168, G3d 263, G3e 202, G3f 199,
//                  G6a 1,243 (D194 Amendment 3: from 229 G6a's V119 "changed [0,0] pair" is judged on the donor read
//                  beneath its hold) (0 on V228, so each re-keyed row fails there). Fixture presentation (`cfg.injury` stored);
//                  app equivalence is D194 part 2's row. Below 229 these rows assert exactly as before.
"""),
    ('A1 hand oracle (after FALLBACK)',
     r"""const FALLBACK = '3×10 — RPE 7';
""",
     r"""const FALLBACK = '3×10 — RPE 7';

// ── V229 D193 ERA: D177's claim beneath the plan's hold (D193's build half, D194 part 1) ────────────────────────
// THE RULINGS THIS DEFENDS above 228 (standing rulings 2 and 4; the predicate reads the artifact's own ia-version):
//   tests/measure/v228_rulings/d193_caprpe_ruling.md Amendment 2 gate claims (l) "D177's claim is verbatim beneath the
//   plan's hold" and (k) "G6a's hand kind gains a `hold` flag from the hand cap table plus a hand RPE parse";
//   Amendment 4 "The rules": the (l) predicate ("On uncapped targets the card equals the donor read beneath its hold by
//   the hand stripper (both cue wordings; R7 text → `_testRx` text), byte-verbatim after that. On capped targets the
//   card equals the hand hold applied to the stripped donor (number 7, gloss by shape per Amendment 1 §3, R7 text for
//   the test prose, rep token unchanged).") and the R8 trigger restated ("the clamp changed the RPE of the dose it was
//   handed: the donor read beneath its hold (`_stripCapCue`), converted for the target where the target is unloadable
//   (`_bwSetsFromDetail`'s bucket)"); its corrected claims "Rows to absorb on CF3 with the V228 figure 0: G3a 832, G3d
//   263, G3e 202, G3f 199, G3c-off 168. G3c power 0 | 0." and (k) "0 false claims"; and
//   tests/measure/v229_rulings/d194_injlens_ruling.md Amendment 1 (r): "g221 G3a 832 / G3c off-grammar 168, power 0 /
//   G3d 263 / G3e 202 / G3f 199 (D193 Amendment 4)"; and its Amendment 3, which replaces (r)'s G6a clause: "`g221` G6a
//   **1,243 of 150,068** (D193 R8, Amendment 4 (k)): at 229 and up the V119 'changed [0,0] pair' is judged against the
//   donor read beneath its hold, the (l) lens; every moved toast ends with the hold sentence and its pair's clamp
//   changed the number by the (k) hand oracle; 0 hand clamp pairs lack it; the 148,825 others equal the hand formula".
// Fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
// HAND ORACLE, typed here, never asked of the engine (the engine's _pattern only names a target's pattern, the input
// the plan's filter itself reads; every expected card and toast is computed below):
//   CAP_HAND    the plan's cap per region and tier, the three cells L1 carries (measure's M8 hand table,
//               tests/measure/v229_caprpe_cf3.js :29). An injury with no row throws: a missing row fails loudly.
//   stripHand   the donor read beneath its hold: both cue wordings (D193 R4); R7's held-test text by shape (its fixed
//               clauses, the RPE number free) -> the strength test text (Amendment 3 section 2).
//   holdHand    the hold on a capped target, the filter's two-way rule: no RPE named -> the cue (predicate unchanged);
//               the strength test text -> R7's text (R7); a named RPE above 7, a range by its top, -> 7 with the RPE 7
//               gloss for its shape (Amendment 1 section 3: bwsets `(leave 3 or more in reserve)`, wave `(leave ~3 reps
//               in reserve)`, loadCapped `(leave ~3 in reserve)`; the @ RPE grammar gets no gloss).
//   rpeHand     a hand RPE parse (the highest number named, a range by its top). bucketHand: the unloadable reader's
//               bucket (Amendment 3 section 1: 6 for RPE 6.x, light or easy; 7 for RPE 7.x; else 8), applied only where
//               the reader converts (CONVERTS_HAND): an unloadable target and a donor that names a rep target `S×R`
//               (D177/V119: "a swap onto a movement with no load to move, where a rep target is a guess rather than an
//               instruction"); any other donor, the test prose included, carries unconverted: R8's verbatim branch.
//   T3H T119H TSAMEH  R8's three hold toasts (Amendment 2 R8), typed.
// Each re-keyed row asserts the (l) predicate on its whole population (capped target: the card is holdHand of D177's
// card on the stripped donor; uncapped: D177's card on the stripped donor) and pins how many cards moved against D177's
// own comparison. G6a (D194 Amendment 3): the hand toast formula's V119 "changed [0,0] pair" is judged on the donor
// read beneath its hold (wantT9; the V228 line runs unchanged below 229); every moved toast is the hold variant of its
// hand kind on a hand clamp pair, every hand clamp pair's toast moved, and the moved count is pinned at (k)'s 1,243.
const D193_ERA = 229;
const D193_PIN = { G3a:832, G3cPow:0, G3cOff:168, G3d:263, G3e:202, G3f:199, G6a:1243 };   // G6a: D194 Amendment 3 (replaces Amendment 1 (r)'s 1,252), D193 Amendment 4 (k)
const CAP_HAND = { knee:{ workaround:['squat', 'lunge', 'leg_iso'] }, lowback:{ workaround:['hinge', 'squat', 'row', 'hip_ext'] }, shoulder:{ protect:[] } };
const CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/;
const CUE3_HAND = ' — hold RPE 7, three in the tank';
const TEST_RX_HAND = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const R7_HAND = 'Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
const TEST_SHAPE_HAND = /^Work up to one heavy set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/;
const R7_SHAPE_HAND = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const stripHand = d => typeof d !== 'string' ? d : R7_SHAPE_HAND.test(d) ? TEST_RX_HAND : d.replace(CUE_HAND, '');
function holdHand(d){
  if(typeof d !== 'string' || !d) return d;
  if(!/RPE/.test(d)) return d + CUE3_HAND;
  if(TEST_SHAPE_HAND.test(d)) return R7_HAND;
  return d.replace(/RPE (\d+(?:\.\d+)?)(?:–(\d+(?:\.\d+)?))?( \((stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g, (t, a, b, g, gl) => {
    if(!(Math.max(+a, b ? +b : 0) > 7)) return t;
    if(!g) return 'RPE 7';
    return /^stop/.test(gl) ? 'RPE 7 (leave 3 or more in reserve)' : /^heaviest/.test(gl) ? 'RPE 7 (leave ~3 in reserve)' : 'RPE 7 (leave ~3 reps in reserve)';
  });
}
const rpeHand = d => { const re = /RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/g; let m, best = null; while((m = re.exec(String(d || '')))){ const v = Math.max(+m[1], m[2] ? +m[2] : 0); if(best === null || v > best) best = v; } return best; };
const CONVERTS_HAND = /^\s*\d+\s*[×x]\s*\d/;
const bucketHand = d => /rpe\s*6|light|easy/i.test(String(d || '')) ? 6 : /rpe\s*7/i.test(String(d || '')) ? 7 : 8;
function capHand(cfg, to){
  if(!cfg || !cfg.injury) return false;
  const r = CAP_HAND[cfg.injury.region], c = r && r[cfg.injury.tier];
  if(!c) throw new Error('g221: no hand cap row for ' + cfg.injury.region + '/' + cfg.injury.tier);
  return c.indexOf(patE(clean(to))) >= 0;
}
const HOLD_HAND = ' Your injury plan holds this one at RPE 7.';
const T3H = (to, from, w) => to + ' in, ' + from.toLowerCase() + ' out. The load runs out before the reps do here. Reps move to ' + w[0] + ' to ' + w[1] + '.' + HOLD_HAND;
const T119H = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. No load to add here.' + HOLD_HAND;
const TSAMEH = (to, from) => to + ' in, ' + from.toLowerCase() + ' out. Same sets, same reps.' + HOLD_HAND;
const S9 = { capPairs:0, bA:0, bOff:0, bAt:0, bNull:0, bWin:0, mvT:0, bT:0, missT:0, clampT:0, ex:{} };
const note9 = (k, s) => { (S9.ex[k] = S9.ex[k] || []).length < 3 && S9.ex[k].push(s); };
const exs9 = k => (S9.ex[k] || []).map(s => ' | e.g. ' + s).join('');
"""),
    ('A2 sweep: (k) toast and (l) card checks',
     r"""          // G6a toast by hand kind
          const wantT = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== D) ? T119(to, from) : TSAME(to, from);
          if(toast !== wantT){ S.toastBad++; note('toast', where + ' [' + H.k + '] ' + toast); }
          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;
          if(isPow){
            if(H.k === 'zero') continue;
            S.pow++; if(cueBlind(O) !== cueBlind(D)){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }
            continue;
          }
          S.main++;
          if(PAIR && sdB(to, D) !== O) S.mainDiff++;
          if(H.k === 'zero'){ S.zeroN++; if(O !== D) S.zeroChg++; continue; }
          if(O !== D && stripRep(O) !== stripRep(D)){ S.outside++; note('out', where + ' :: ' + D + ' => ' + O); }
          if(H.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)){ S.offChg++; note('off', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'null'){ S.nullN++; if(O !== D){ S.nullBad++; note('null', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'atfloor'){ S.atN++; if(O !== D){ S.atBad++; note('at', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'win'){ S.winN++; if(O !== H.out){ S.winBad++; note('win', where + ' :: ' + D + ' => ' + O); } }
""",
     r"""          // G6a toast by hand kind
          const wantT = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== D) ? T119(to, from) : TSAME(to, from);
          if(toast !== wantT){ S.toastBad++; note('toast', where + ' [' + H.k + '] ' + toast); }
          if(/The load runs out before the reps do here/.test(String(toast))) S.t3++;
          // V229 D193 (k), R8 trigger restated (Amendment 4): fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
          if(VER >= D193_ERA){
            const Db9 = stripHand(D), capd9 = capHand(cfg, to);
            const conv9 = H.k === 'zero' && CONVERTS_HAND.test(Db9);   // the unloadable reader converts a named rep target only
            const pre9 = conv9 ? bucketHand(Db9) : rpeHand(H.k === 'win' ? handRewrite(Db9, H.W) : Db9);
            const clamp9 = capd9 && pre9 !== null && pre9 > 7;
            const wantH = H.k === 'win' ? T3H(to, from, H.W) : conv9 ? T119H(to, from) : TSAMEH(to, from);
            if(clamp9) S9.clampT++;
            // D194 Amendment 3: the V119 "changed [0,0] pair" is judged on the donor read beneath its hold, the (l) lens.
            const wantT9 = H.k === 'win' ? T3(to, from, H.W) : (H.k === 'zero' && O !== Db9) ? T119(to, from) : TSAME(to, from);
            if(toast !== wantT9){ S9.mvT++; if(!(clamp9 && toast === wantH && String(toast).endsWith(HOLD_HAND))){ S9.bT++; note9('t', where + ' [' + H.k + (clamp9 ? ', hand clamp pair' : ', not a hand clamp pair') + '] ' + toast + ' | want ' + (clamp9 ? wantH : wantT9)); } }
            else if(clamp9){ S9.missT++; note9('miss', where + ' [' + H.k + '] ' + toast + ' | want ' + wantH); }
          }
          if(isPow){
            if(H.k === 'zero') continue;
            S.pow++; if(cueBlind(O) !== cueBlind(D)){ S.powChg++; note('pow', where + ' :: ' + D + ' => ' + O); }
            continue;
          }
          S.main++;
          if(PAIR && sdB(to, D) !== O) S.mainDiff++;
          if(H.k === 'zero'){ S.zeroN++; if(O !== D) S.zeroChg++; continue; }
          if(O !== D && stripRep(O) !== stripRep(D)){ S.outside++; note('out', where + ' :: ' + D + ' => ' + O); }
          if(H.k === 'offgram'){ S.offN++; if(cueBlind(O) !== cueBlind(D)){ S.offChg++; note('off', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'null'){ S.nullN++; if(O !== D){ S.nullBad++; note('null', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'atfloor'){ S.atN++; if(O !== D){ S.atBad++; note('at', where + ' :: ' + D + ' => ' + O); } }
          if(H.k === 'win'){ S.winN++; if(O !== H.out){ S.winBad++; note('win', where + ' :: ' + D + ' => ' + O); } }
          // V229 D193 (l), Amendment 4 "The rules": fixture presentation (`cfg.injury` stored); app equivalence is D194 part 2's row.
          if(VER >= D193_ERA){
            const Db9 = stripHand(D), E9 = H.k === 'win' ? handRewrite(Db9, H.W) : Db9, capd9 = capHand(cfg, to), X9 = capd9 ? holdHand(E9) : E9;
            if(capd9) S9.capPairs++;
            if(stripRep(O) !== stripRep(X9)){ S9.bA++; note9('A', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'offgram' && cueBlind(O) !== cueBlind(X9)){ S9.bOff++; note9('off', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'null' && O !== X9){ S9.bNull++; note9('null', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'atfloor' && O !== X9){ S9.bAt++; note9('at', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
            if(H.k === 'win' && O !== X9){ S9.bWin++; note9('win', where + ' :: ' + D + ' => ' + O + ' | want ' + X9); }
          }
"""),
    ('A3 rows: re-keyed at 229, verbatim below',
     r"""ok(R.G3a, !S.crash.length && S.main > 0 && S.outside === 0, S.outside + ' of ' + S.main + crashNote + exs('out'));
ok(R.G3b, !S.crash.length && S.underN > 0 && S.under === 0, S.under + ' of ' + S.underN + crashNote + exs('under'));
ok(R.G3c, !S.crash.length && S.pow > 0 && S.powChg === 0 && S.offN > 0 && S.offChg === 0, 'power ' + S.powChg + ' of ' + S.pow + ', off grammar ' + S.offChg + ' of ' + S.offN + crashNote + exs('pow') + exs('off'));
ok(R.G3d, !S.crash.length && S.atN > 0 && S.atBad === 0, S.atBad + ' of ' + S.atN + crashNote + exs('at'));
ok(R.G3e, !S.crash.length && S.nullN > 0 && S.nullBad === 0, S.nullBad + ' of ' + S.nullN + crashNote + exs('null'));
ok(R.G3f, !S.crash.length && S.winN > 0 && S.winBad === 0, S.winBad + ' of ' + S.winN + crashNote + exs('win'));
pairRow('G4a', S.pn > 0 && S.pnDiff === 0 && S.mainDiff > 0, S.pnDiff + ' of ' + S.pn + ' differ; Main pairs differing ' + S.mainDiff + exs('pn'));
pairRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
pairRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
ok(R.G5a, !S.crash.length && S.pairs > 0 && S.idBad === 0 && S.throws === 0 && S.winN > 0 && S.zeroChg > 0,
  S.idBad + ' of ' + S.pairs + ' not identical, throws ' + S.throws + crashNote + exs('id') + exs('throw'));
ok(R.G5b, !!S.cgbp && S.cgbp.ok && S.cgbp.O !== S.cgbp.D, S.cgbp ? JSON.stringify(S.cgbp) : 'pair not on L1');
ok(R.G6a, !S.crash.length && S.pairs > 0 && S.toastBad === 0 && S.t3 === S.winN && S.t3 > 0, S.toastBad + ' of ' + S.pairs + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + exs('toast'));
""",
     r"""// V229 D193 era (VER >= D193_ERA): G3a G3c G3d G3e G3f and G6a assert D193 Amendment 4's (l)/(k) predicate on their
// whole population and pin the moved count (0 on V228). Fixture presentation (`cfg.injury` stored); app equivalence is
// D194 part 2's row. Below 229 each row asserts exactly as before.
const D9 = VER >= D193_ERA;
if(D9) console.log('  D193 era (V' + VER + '): Main pairs on a hand-capped target ' + S9.capPairs + ', hand clamp pairs (toasts) ' + S9.clampT);
if(D9) ok(R.G3a + ' [V229 D193 Amendment 4 (l): moved ' + S.outside + ' == pin ' + D193_PIN.G3a + '; card != the hand card beneath the hold ' + S9.bA + ']', !S.crash.length && S.main > 0 && S9.bA === 0 && S.outside === D193_PIN.G3a, 'moved ' + S.outside + ' of ' + S.main + ' (pin ' + D193_PIN.G3a + '), beneath-the-hold misses ' + S9.bA + crashNote + exs9('A') + exs('out'));
else ok(R.G3a, !S.crash.length && S.main > 0 && S.outside === 0, S.outside + ' of ' + S.main + crashNote + exs('out'));
ok(R.G3b, !S.crash.length && S.underN > 0 && S.under === 0, S.under + ' of ' + S.underN + crashNote + exs('under'));
if(D9) ok(R.G3c + ' [V229 D193 Amendment 4 (l): power moved ' + S.powChg + ' == pin ' + D193_PIN.G3cPow + ', off grammar moved ' + S.offChg + ' == pin ' + D193_PIN.G3cOff + '; off-grammar card != the hand card beneath the hold ' + S9.bOff + ']', !S.crash.length && S.pow > 0 && S.powChg === D193_PIN.G3cPow && S.offN > 0 && S9.bOff === 0 && S.offChg === D193_PIN.G3cOff, 'power ' + S.powChg + ' of ' + S.pow + ' (pin ' + D193_PIN.G3cPow + '), off grammar moved ' + S.offChg + ' of ' + S.offN + ' (pin ' + D193_PIN.G3cOff + '), beneath-the-hold misses ' + S9.bOff + crashNote + exs('pow') + exs9('off') + exs('off'));
else ok(R.G3c, !S.crash.length && S.pow > 0 && S.powChg === 0 && S.offN > 0 && S.offChg === 0, 'power ' + S.powChg + ' of ' + S.pow + ', off grammar ' + S.offChg + ' of ' + S.offN + crashNote + exs('pow') + exs('off'));
if(D9) ok(R.G3d + ' [V229 D193 Amendment 4 (l): moved ' + S.atBad + ' == pin ' + D193_PIN.G3d + '; card != the hand card beneath the hold ' + S9.bAt + ']', !S.crash.length && S.atN > 0 && S9.bAt === 0 && S.atBad === D193_PIN.G3d, 'moved ' + S.atBad + ' of ' + S.atN + ' (pin ' + D193_PIN.G3d + '), beneath-the-hold misses ' + S9.bAt + crashNote + exs9('at') + exs('at'));
else ok(R.G3d, !S.crash.length && S.atN > 0 && S.atBad === 0, S.atBad + ' of ' + S.atN + crashNote + exs('at'));
if(D9) ok(R.G3e + ' [V229 D193 Amendment 4 (l): moved ' + S.nullBad + ' == pin ' + D193_PIN.G3e + '; card != the hand card beneath the hold ' + S9.bNull + ']', !S.crash.length && S.nullN > 0 && S9.bNull === 0 && S.nullBad === D193_PIN.G3e, 'moved ' + S.nullBad + ' of ' + S.nullN + ' (pin ' + D193_PIN.G3e + '), beneath-the-hold misses ' + S9.bNull + crashNote + exs9('null') + exs('null'));
else ok(R.G3e, !S.crash.length && S.nullN > 0 && S.nullBad === 0, S.nullBad + ' of ' + S.nullN + crashNote + exs('null'));
if(D9) ok(R.G3f + ' [V229 D193 Amendment 4 (l): moved ' + S.winBad + ' == pin ' + D193_PIN.G3f + '; card != the hand rewrite beneath the hold ' + S9.bWin + ']', !S.crash.length && S.winN > 0 && S9.bWin === 0 && S.winBad === D193_PIN.G3f, 'moved ' + S.winBad + ' of ' + S.winN + ' (pin ' + D193_PIN.G3f + '), beneath-the-hold misses ' + S9.bWin + crashNote + exs9('win') + exs('win'));
else ok(R.G3f, !S.crash.length && S.winN > 0 && S.winBad === 0, S.winBad + ' of ' + S.winN + crashNote + exs('win'));
pairRow('G4a', S.pn > 0 && S.pnDiff === 0 && S.mainDiff > 0, S.pnDiff + ' of ' + S.pn + ' differ; Main pairs differing ' + S.mainDiff + exs('pn'));
pairRow('G4b', S.lr > 0 && S.lrDiff === 0, S.lrDiff + ' of ' + S.lr);
pairRow('G4c', S.rr > 0 && S.rrDiff === 0, S.rrDiff + ' of ' + S.rr);
ok(R.G5a, !S.crash.length && S.pairs > 0 && S.idBad === 0 && S.throws === 0 && S.winN > 0 && S.zeroChg > 0,
  S.idBad + ' of ' + S.pairs + ' not identical, throws ' + S.throws + crashNote + exs('id') + exs('throw'));
ok(R.G5b, !!S.cgbp && S.cgbp.ok && S.cgbp.O !== S.cgbp.D, S.cgbp ? JSON.stringify(S.cgbp) : 'pair not on L1');
if(D9) ok(R.G6a + ' [V229 D193 (k), R8 trigger restated, D194 Amendment 3 (V119 changed judged beneath the hold): moved ' + S9.mvT + ' == pin ' + D193_PIN.G6a + ', every one the hold variant on a hand clamp pair (not ' + S9.bT + '), hand clamp pairs ' + S9.clampT + ' without the hold toast ' + S9.missT + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + ']', !S.crash.length && S.pairs > 0 && S9.bT === 0 && S9.missT === 0 && S9.mvT === D193_PIN.G6a && S.t3 === S.winN && S.t3 > 0, 'moved ' + S9.mvT + ' of ' + S.pairs + ' (pin ' + D193_PIN.G6a + '), not a hold variant on a hand clamp pair ' + S9.bT + ', hand clamp pair without it ' + S9.missT + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + exs9('t') + exs9('miss'));
else ok(R.G6a, !S.crash.length && S.pairs > 0 && S.toastBad === 0 && S.t3 === S.winN && S.t3 > 0, S.toastBad + ' of ' + S.pairs + ', third toast ' + S.t3 + ' vs hand window ' + S.winN + exs('toast'));
"""),
]

for nm, old, new in EDITS:
    c = src.count(old)
    print('%s anchor count %d' % (nm, c))
    if c != 1: die('%s anchor count %d != 1' % (nm, c))
out = src
for nm, old, new in EDITS:
    out = out.replace(old, new, 1)
if re.search(r'\\u[0-9a-fA-F]{4}', ''.join(n for _, _, n in EDITS)): die('a \\u escape in replacement text')
# every original row line survives verbatim in its below-229 else branch
for row in ['G3a', 'G3c', 'G3d', 'G3e', 'G3f', 'G6a']:
    orig = [l for l in src.split('\n') if l.startswith('ok(R.' + row + ',')]
    if len(orig) != 1 or out.count('else ' + orig[0] + '\n') != 1: die('row %s: the original assertion is not carried verbatim below 229' % row)
checks = [
    ('D193_ERA = 229', out.count('const D193_ERA = 229;'), 1),
    ('pins typed from the rulings', out.count('const D193_PIN = { G3a:832, G3cPow:0, G3cOff:168, G3d:263, G3e:202, G3f:199, G6a:1243 };'), 1),
    ('fixture comment on the oracle block and both sweep checks (one line each)', len(re.findall(r"[Ff]ixture presentation \(`cfg\.injury` stored\); app equivalence is D194 part 2's row", out)), 3),
    ('re-keyed rows (if(D9) ok(R.G...)', len(re.findall(r'^if\(D9\) ok\(R\.G(?:3a|3c|3d|3e|3f|6a) ', out, re.M)), 6),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want: die('post-check %s: %d != %d' % (nm, got, want))
open(GATE, 'w', encoding='utf-8').write(out)
r = subprocess.run(['node', '--check', GATE], capture_output=True, text=True)
if r.returncode: die('node --check failed: ' + r.stderr)
print('OK: 4 edits written to %s (node --check ok)' % GATE)
