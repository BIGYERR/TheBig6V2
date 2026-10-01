#!/usr/bin/env python3
# V226 build 5, slice 7f: G1h, the D188 Class A2 (both directions) + Class A1-L licence as predicates,
# in tests/gates/g226_d188_beginnermile.js. Ruling: tests/measure/v226_rulings/d188_a2_relicence.md
# (coach 2026-09-30, Mario "yes" 2026-10-01). Tests only; index.html is not touched.
# Every anchor asserted count==1 before anything is written; all or none.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g226_d188_beginnermile.js'
src = open(P, encoding='utf-8').read()

EDITS = []

# 1. ORACLES header: describe G1h.
A1 = "//                 The V225 arm's literal is the one licensed engine read in this file (see the row).\n"
B1 = A1 + r"""//   G1h LICENCE   (slice 7f) D188 Class A2 in BOTH directions and Class A1-L, as predicates (standing ruling 2), from
//                 tests/measure/v226_rulings/d188_a2_relicence.md (coach 2026-09-30, Mario "yes" 2026-10-01). Each cfg is
//                 built on the V225 artifact (twice: it must equal itself first) and on the candidate. The tier ORACLE is
//                 dose arithmetic typed from the doctrine lines (mins, or mi x tgt / 60; >= 75 A, >= 45 B, else C; NRC
//                 rehearsal A); _longRunTier is never called. The APPLIED tier is read off the printed day the way
//                 g209 reads it (A: only post-run mobility / taper sections; C: the day still carries what tier B bans;
//                 otherwise B or C, settled against the same (week, day) on the other artifact: one pre-pass draw, two
//                 tiers, so the side that lost items is B). Vocabularies lifted from g209 (D18/D140) plus D153's hinge
//                 pair. The block sits after G2 because it reads G2's V225 baseline.
"""
EDITS.append((A1, B1))

# 2. VERSION PREDICATE: the NA counter is no longer always 0.
A2 = "//                 artifact for the right reason. No row in this file lacks a V225 truth; the NA counter stays 0.\n"
B2 = ("//                 artifact for the right reason. One block lacks a V225 truth: G1h (the A2 / A1-L licence compares\n"
      "//                 V226 against V225, and V225 has no counterpart), so below 226 its 11 rows are counted NA by name.\n")
EDITS.append((A2, B2))

# 3. Discrimination note: G1h liveness goes red on V225 against itself.
A3 = "//                 and R3, G4 intermediate pencil) stay green.\n"
B3 = A3 + "//                 G1h: P0 to P5 stay green (V225 against V225 moves nothing) and the liveness rows L1 to L3 go RED.\n"
EDITS.append((A3, B3))

# 4. The G1h block, before the final done().
A4 = "\n}\n\ndone();\n"
BLOCK = r"""
// ══ G1h (D188 Class A2 both directions + Class A1-L: the re-licence as a predicate) ═════════════════════
// Ruling: tests/measure/v226_rulings/d188_a2_relicence.md; evidence measure_a2_tierflips_v226.md. Engine roots
// named there (index.html :11014 _longRunTier, :11022 minutes, :11024 thresholds, :3969 run_base long run,
// :3816-3818 the anchor) are NOT read here; the oracle below is typed from the doctrine text.
{
  const G1H_ROWS = ['G1h-P0 V225 self-identity', 'G1h-P1 population bound', 'G1h-A1L length licence', 'G1h-P2 long-run set and direction',
    'G1h-P2b 11:30 weekGrid identity', 'G1h-P3 oracle tier = applied tier, minutes direction', 'G1h-P4 new-tier content',
    'G1h-P5 unmoved days byte-identical', 'G1h-L1 liveness shorter tier', 'G1h-L2 liveness longer tier', 'G1h-L3 liveness A1-L'];
  console.log('\nG1h D188 A2 / A1-L licence (re-licence 2026-10-01): beginner x 4 goals x 2 path/focus cells x mile {none, 9:00, 11:30, 13:00} x 2 rest x 3 seeds, + the same intermediate lattice as the P1 control (' + TAG + ')');
  if(!D188){
    G1H_ROWS.forEach(r => { na++; console.log('  NA ' + r + ': the licence compares V226 against V225; ia-version ' + VER + ' has no counterpart'); });
  } else if(!BASE){
    ok('G1h D188 V225 baseline available (fail closed, not a silent pass)', false, baseWhy);
  } else {
    const tB = RealDate.now();
    const LRJ = v => JSON.stringify(v, (k, x) => (k === 'id' || k === 'created' || k === '_swapUniverse' || k === '_swapUniverseByKey') ? undefined : x);
    const HM = 690;   // the beginner default, hand (D9 / V176): 11:30
    const GL = [['base3mi', { id: 'run_base', baselineDist: '3', baseline: '3mi' }], ['base', { id: 'run_base' }], ['half', { id: 'run_half' }],
                ['pace1330', { id: 'run_pace_goal', targetDist: '1.5', targetMins: '13', targetSecs: '30', paceUnit: 'mi' }]];
    const PF = [['event', 'support_prevention'], ['hybrid', 'balanced']];
    const MI = [0, 540, 690, 780];                      // none, 9:00, 11:30, 13:00
    const RS = [['mon', 'thu', 'sun'], ['sun', 'wed']];
    const SD = [1000, 1001, 76308];
    const lrCfg = (g, exp, pth, foc, m, rest, seed) => {
      const run = Object.assign({}, g);
      if(m){ run.mileBestMins = String(Math.floor(m / 60)); run.mileBestSecs = String(m % 60); run.mileBestSrc = { kind: 'entered' }; }
      const race = RACE.has(g.id);
      return { name: 'G226h', primaryPath: pth, eventTargeted: race, raceDate: race ? '2026-12-20' : '', liftingFocus: foc, experience: exp,
        ageBracket: '18-35', equipment: 'commercial', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315,
        seed, startDate: '2026-10-05', cardioTypes: ['run'], cardioGoals: { run } };
    };
    // D189 S1 by level, typed (hand defaults D9 / V176: beginner 690 = 11:30, intermediate 570 = 9:30). Stripped as ' ' + S1.
    const S1_OF = { beginner: S1_BEG,
      intermediate: 'Paces here start from a 9:30 mile, the intermediate default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.' };
    const stripNote = (day, s) => { if(!s) return day; const q = JSON.parse(JSON.stringify(day)); const tail = ' ' + s;
      (function walk(o){ if(!o || typeof o !== 'object') return; if(typeof o.note === 'string' && o.note.endsWith(tail)) o.note = o.note.slice(0, o.note.length - tail.length);
        for(const k of Object.keys(o)) walk(o[k]); })(q); return q; };
    // ── the oracle: dose arithmetic and the doctrine lines, typed ──
    const minOf = d => !d ? 0 : d.k === 'time' ? (+d.mins || 0) : (+d.mi || 0) * (+d.tgt || 0) / 60;
    const lrOf = day => { const c = day && day.cardio; if(!c || Array.isArray(c) || !c.dose) return null;
      if(c.isNRC){ if(!/^long run/i.test(c.subtype || '') || /race day|time trial/i.test(c.subtype || '')) return null; }
      else if(c.type !== 'run' || c.dose.key !== 'long') return null;
      return c; };
    const oTier = day => { const c = lrOf(day); if(!c) return null; if(c.isNRC && /rehearsal/i.test(c.detail || '')) return 'A';
      const m = minOf(c.dose); if(!m) return null; return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C'; };
    const RK = { C: 0, B: 1, A: 2 };
    // ── content vocabularies (g209 D18/D140, plus D153's hinge pair) and the doctrine set count ──
    const LEGH = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol|pull-?through|back extension/i;
    const STR = /stretch|mobility|90\/90|foam|worlds greatest/i, CAR = /carry|farmer|suitcase/i, PWR = /power|explosive/i;
    const dSets = det => { const s = String(det || ''); let x = /^(\d+)\s*[x×]/.exec(s); if(x) return +x[1]; x = /\b(\d+)\s*sets?\b/i.exec(s); return x ? +x[1] : 1; };
    const secs = day => day.sections || [];
    const its = day => secs(day).reduce((a, s) => a.concat(s.items || []), []);
    const nSets = day => its(day).filter(i => !STR.test(i.name || '')).reduce((a, i) => a + dSets(i.detail), 0);
    const mobOnly = day => secs(day).every(s => /post-run mobility|taper/i.test(s.label || ''));
    const bBan = day => its(day).some(i => LEGH.test(i.name || '')) || secs(day).some(s => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')) || nSets(day) > 8;
    const carries = day => its(day).filter(i => CAR.test(i.name || '')).length + secs(day).filter(s => /carry/i.test(s.label || '') || /carry/i.test(s.coreHeader || '')).length;
    const shapeOf = day => (secs(day).map(s => '[' + (s.label || s.coreHeader || '') + '] ' + (s.items || []).map(i => i.name).join(', ')).join(' ; ') || '(none)').slice(0, 220);
    // ── the applied tier, read off the printed day ──
    //   '-' nothing printed (unreadable: any oracle tier agrees); 'A' post-run mobility shape; 'C' carries what B bans; '?' B or C.
    const read1 = day => !secs(day).length ? '-' : (mobOnly(day) && secs(day).some(s => /post-run mobility/i.test(s.label || ''))) ? 'A' : bBan(day) ? 'C' : '?';
    const names = day => its(day).map(i => i.name || '');
    const inside = (a, b) => { const r = b.slice(); for(const x of a){ const k = r.indexOf(x); if(k < 0) return false; r.splice(k, 1); } return r.length > 0; };
    const readPair = (d5, d6) => {
      let r5 = read1(d5), r6 = read1(d6);
      if(LRJ(secs(d5)) === LRJ(secs(d6))){ const k = r5 !== '?' ? r5 : r6; return [k, k]; }
      if(r5 === '?' && r6 === 'C') r5 = 'B';
      else if(r6 === '?' && r5 === 'C') r6 = 'B';
      else if(r5 === '?' && r6 === '?'){ if(inside(names(d5), names(d6))){ r5 = 'B'; r6 = 'C'; } else if(inside(names(d6), names(d5))){ r6 = 'B'; r5 = 'C'; } }
      return [r5, r6];
    };
    const agree = (o, a) => a === o || a === '-' || (a === '?' && (o === 'B' || o === 'C'));
    const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;
    const nBad = { P0: 0, P1: 0, A1L: 0, P2: 0, P2b: 0, P3: 0, P4: 0, P5: 0 }, bad = { P0: [], P1: [], A1L: [], P2: [], P2b: [], P3: [], P4: [], P5: [] };
    const miss = (k, s) => { nBad[k]++; if(bad[k].length < 3) bad[k].push(s); };
    const cnt = { cfg: 0, lic: 0, pop1: 0, same: 0, a1l: 0, a1lHit: 0, at690: 0, pairs: 0, unmoved: 0, nonLR: 0, p4: 0, p4new: 0, minMv: 0, shorter: 0, longer: 0 };
    const p4 = (day, t, where, isNew) => {
      cnt.p4++; if(isNew) cnt.p4new++;
      const k = carries(day); if(k) miss('P4', where + ' tier ' + t + ' carries ' + k + ': ' + shapeOf(day));
      if(t === 'A' && !mobOnly(day)) miss('P4', where + ' tier A lifts: ' + shapeOf(day));
      if(t === 'B'){
        const hl = its(day).filter(i => LEGH.test(i.name || '')).map(i => i.name);
        const pw = secs(day).filter(s => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')).map(s => s.label || s.coreHeader);
        const n = nSets(day);
        if(hl.length || pw.length || n > 8) miss('P4', where + ' tier B: hinge/leg [' + hl.join(', ') + '] power [' + pw.join(', ') + '] ' + n + ' sets');
      }
    };
    const LAT = [];
    for(const exp of ['beginner', 'intermediate']) for(const [gk, g] of GL) for(const [pth, foc] of PF) for(const m of MI) for(const rest of RS) for(const seed of SD)
      LAT.push({ exp, gk, g, pth, foc, m, rest, seed, tag: [exp, gk, pth + '/' + foc, m ? clk(m) : 'no mile', rest.join('+'), 's' + seed].join(' ') });
    for(const L of LAT){
      cnt.cfg++;
      const cfg = lrCfg(L.g, L.exp, L.pth, L.foc, L.m, L.rest, L.seed);
      let p5, p5b, p6;
      try { p5 = build(BASE, cfg); p5b = build(BASE, cfg); } catch(e){ miss('P0', L.tag + ' V225 threw ' + e.message); continue; }
      if(H.progDigest(p5) !== H.progDigest(p5b)){ miss('P0', L.tag + ' V225 build != itself'); continue; }
      try { p6 = build(IA, cfg); } catch(e){ miss('P2', L.tag + ' candidate threw ' + e.message); continue; }
      const lic = L.exp === 'beginner' && L.m > 0;          // the licence's population: a beginner who entered a mile
      const s = lic ? sgn(L.m - HM) : 0;
      if(lic) cnt.lic++; else cnt.pop1++;
      const len5 = p5.totalWeeks, len6 = p6.totalWeeks;
      if(len5 !== len6){
        // A1-L: only a beginner's pace goal with an entered mile off 11:30, in the direction of (m - 690).
        cnt.a1l++;
        const legal = L.g.id === 'run_pace_goal' && L.exp === 'beginner' && L.m > 0 && L.m !== HM && sgn(len6 - len5) === sgn(L.m - HM);
        if(!legal) miss('A1L', L.tag + ' ' + len5 + ' -> ' + len6 + ' weeks');
        if(legal && L.gk === 'pace1330' && L.m === 540 && len6 === 9) cnt.a1lHit++;
        for(let w = 1; w <= len6; w++) for(const d of DAYS){ const day = p6.weeks[w] && p6.weeks[w][d]; const t = day && oTier(day); if(t) p4(day, t, L.tag + ' W' + w + ' ' + d + ' (A1-L)', true); }
        continue;
      }
      cnt.same++;
      if(lic && L.m === HM){ cnt.at690++; if(H.weekGrid(p5) !== H.weekGrid(p6)) miss('P2b', L.tag + ' weekGrid differs at 11:30'); }
      const s1 = L.m ? null : S1_OF[L.exp];
      for(let w = 1; w <= len5; w++) for(const d of DAYS){
        const d5 = p5.weeks[w] && p5.weeks[w][d], d6 = p6.weeks[w] && p6.weeks[w][d], where = L.tag + ' W' + w + ' ' + d;
        if(!d5 || !d6){ if(d5 || d6) miss('P2', where + ' present on one side only'); continue; }
        const t5 = oTier(d5), t6 = oTier(d6);
        if(!t5 && !t6){ cnt.nonLR++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' non-long-run day: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); continue; }
        if(!t5 || !t6){ miss('P2', where + ' long run on one side only (' + (t5 || '-') + ' / ' + (t6 || '-') + ')'); continue; }
        cnt.pairs++;
        const c5 = d5.cardio, c6 = d6.cardio, mv = sgn(RK[t6] - RK[t5]), dm = +(minOf(c6.dose) - minOf(c5.dose)).toFixed(2);
        const mins = minOf(c5.dose).toFixed(1) + ' -> ' + minOf(c6.dose).toFixed(1) + ' min';
        if((c5.subtype || '') !== (c6.subtype || '')) miss('P2', where + ' subtype ' + c5.subtype + ' -> ' + c6.subtype);
        if(!lic){
          if(mv !== 0 || LRJ(stripNote(d6, s1)) !== LRJ(d5)) miss('P1', where + ' ' + t5 + ' -> ' + t6 + ' (' + mins + ') ' + shapeOf(d5) + ' -> ' + shapeOf(d6));
        } else {
          if(mv !== 0 && mv !== s) miss('P2', where + ' tier ' + t5 + ' -> ' + t6 + ' against sign(m - 690) = ' + s);
          if(sgn(dm) !== 0){ cnt.minMv++; if(sgn(dm) !== s) miss('P3', where + ' ' + mins + ' against sign(m - 690) = ' + s); }
          if(mv < 0 && L.m === 540) cnt.shorter++;
          if(mv > 0 && L.m === 780 && L.g.id === 'run_base' && L.pth === 'event') cnt.longer++;
        }
        const [a5, a6] = readPair(d5, d6);
        if(!agree(t5, a5) || !agree(t6, a6)) miss('P3', where + ' oracle ' + t5 + '/' + t6 + ' (' + mins + ') applied ' + a5 + '/' + a6 + ': ' + shapeOf(d5) + ' -> ' + shapeOf(d6));
        if(mv === 0){ cnt.unmoved++; if(LRJ(secs(d5)) !== LRJ(secs(d6))) miss('P5', where + ' tier ' + t5 + ' unmoved: ' + shapeOf(d5) + ' -> ' + shapeOf(d6)); }
        p4(d6, t6, where, mv !== 0);
      }
    }
    const ex = k => nBad[k] + (bad[k].length ? ': ' + bad[k].join(' || ') : '');
    console.log('  lattice ' + cnt.cfg + ' cfgs (' + cnt.lic + ' licence population: beginner with a mile; ' + cnt.pop1 + ' P1 population: intermediate, or beginner with no mile); ' +
      cnt.same + ' same length, ' + cnt.a1l + ' length moves; long-run pairs ' + cnt.pairs + ' (tier unmoved ' + cnt.unmoved + ', minutes moved ' + cnt.minMv + '), non-long-run days ' + cnt.nonLR +
      '; V226 long-run days under P4 ' + cnt.p4 + ' (new tier or A1-L ' + cnt.p4new + ')');
    ok('G1h-P0 D188 the V225 baseline equals itself on every lattice cfg before any diff (' + LAT.length + ' cfgs, digest)', nBad.P0 === 0 && cnt.cfg === LAT.length, ex('P0'));
    ok('G1h-P1 D188 intermediate, or beginner with no mile (S1 suffix stripped): 0 tier moves and every long-run day byte-identical to V225 (' + cnt.pop1 + ' cfgs)', nBad.P1 === 0 && cnt.pop1 > 0, ex('P1'));
    ok('G1h-A1L D188 a length change only on a beginner pace goal with a mile off 11:30, sign(len226 - len225) = sign(m - 690) (' + cnt.a1l + ' cfgs; judged by P4 only)', nBad.A1L === 0, ex('A1L'));
    ok('G1h-P2 D188 same length: a long run on one side is a long run on the other with the same subtype; tier moves only toward sign(m - 690) (C<B<A)', nBad.P2 === 0 && cnt.pairs > 0, ex('P2'));
    ok('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b === 0 && cnt.at690 > 0, ex('P2b'));
    ok('G1h-P3 D188 the hand tier (dose minutes, >= 75 A, >= 45 B) equals the tier read off the printed day, both sides; minutes move only toward sign(m - 690) (' + cnt.pairs + ' pairs)', nBad.P3 === 0 && cnt.pairs > 0, ex('P3'));
    ok('G1h-P4 D188 V226 long-run content: A no lifting; B no hinge/leg, no power, at most 8 working sets; no carry on any tier (' + cnt.p4 + ' days, ' + cnt.p4new + ' new tier or A1-L)', nBad.P4 === 0 && cnt.p4new > 0, ex('P4'));
    ok('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 === 0 && cnt.nonLR > 0 && cnt.unmoved > 0, ex('P5'));
    ok('G1h-L1 D188 liveness: a 9:00 beginner moves long runs to a shorter tier (' + cnt.shorter + ' days)', cnt.shorter > 0, cnt.shorter);
    ok('G1h-L2 D188 liveness: a 13:00 beginner on run_base, event, support focus moves long runs to a longer tier (' + cnt.longer + ' days)', cnt.longer > 0, cnt.longer);
    ok('G1h-L3 D188 liveness: pace goal 1.5 mi in 13:30 at a 9:00 mile shortens to 9 weeks under A1-L (' + cnt.a1lHit + ' cfgs)', cnt.a1lHit > 0, cnt.a1lHit);
    console.log('  G1h runtime ' + ((RealDate.now() - tB) / 1000).toFixed(1) + ' s (' + (LAT.length * 3) + ' builds)');
  }
}
"""
B4 = "\n}\n" + BLOCK + "\ndone();\n"
EDITS.append((A4, B4))

for i, (a, b) in enumerate(EDITS, 1):
    n = src.count(a)
    if n != 1:
        print('ABORT: anchor %d count %d (want 1): %r' % (i, n, a[:90]))
        sys.exit(1)
for a, b in EDITS:
    src = src.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(src)
print('OK: %d replacements written to %s' % (len(EDITS), P))
