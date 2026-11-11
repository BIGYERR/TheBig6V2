// stored-state: over many random histories, is snapshotDay ever called on a day that already has a snapshot while the
// day in hand differs from that snapshot? Read-only (measure). That call is the only one where the first-touch guard in
// snapshotDay changes what is stored (the open break "history, first touch", stored-state_red-on-break.md).
//
// Each history is a seeded random walk over the taps that touch or change a day, through the app's own entry points
// (tests/support/stored-state.ts): a launch a day or two later, a lift logged, a run logged, Done, Skip, the undo tap, a
// part skipped, a swap and its undo, a move skipped and put back, a move added, the rest sheet's Move (any session it
// offers) and its cardio log, an injury flagged and lifted, travel booked, an overlay removed. The page's snapshotDay is
// wrapped, in the page, to count its calls; nothing else is changed. After every step the walker also compares each
// snapshotted day in hand with its snapshot.
//
// Usage: node tests/measure/stored-state_first-touch-walks.ts [histories] [steps]   (default 60 histories of 40 steps)
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
process.env['TZ'] = 'America/New_York';
import { PROGRAMS } from '../support/programs.ts';
import { Phone, at, cards, firstWeek, mondayOf, DAYS } from '../support/stored-state.ts';

const HISTORIES = +(process.argv[2] || 60), STEPS = +(process.argv[3] || 40);
const names = Object.keys(PROGRAMS);
const tally = { histories: 0, steps: 0, refused: 0, calls: 0, repeat: 0, repeatChanged: 0, seenChanged: 0, seenStub: 0, seenOther: 0 };
const byTap: Record<string, number> = {};
const changedKinds: Record<string, number> = {};
const examples: string[] = [];

function wrap(P: Phone): void {
  P.ev(`if(!globalThis.__T){globalThis.__T={calls:0,repeat:0,changed:0,notes:[]};
    snapshotDay=(function(o){return function(w,d){
      try{ __T.calls++; var day=activeProg&&activeProg.weeks&&activeProg.weeks[w]&&activeProg.weeks[w][d]; var h=getDayHist()[completedKey(w,d)];
        if(day&&h){ __T.repeat++; if(JSON.stringify(day)!==JSON.stringify(h)){ __T.changed++; __T.notes.push('w'+w+'_'+d+(day.rest?' rest':'')+(day.moved?' moved':'')+(day.movedFrom?' movedFrom':'')); } } }catch(e){}
      return o.apply(this,arguments); }; })(snapshotDay);}`);
}
function drain(P: Phone): void {
  const t = JSON.parse(P.ev('JSON.stringify(globalThis.__T||{calls:0,repeat:0,changed:0,notes:[]})'));
  tally.calls += t.calls; tally.repeat += t.repeat; tally.repeatChanged += t.changed;
  for (const n of t.notes) if (examples.length < 12) examples.push(n);
  P.ev('if(globalThis.__T){__T.calls=0;__T.repeat=0;__T.changed=0;__T.notes=[];}');
}

for (let h = 0; h < HISTORIES; h++) {
  let s = 1000 + h * 7919;
  const rnd = (n: number): number => { s = (s * 1664525 + 1013904223) % 4294967296; return Math.floor((s / 4294967296) * n); };
  const pick = <T>(a: T[]): T | undefined => a[rnd(a.length)];
  const cfg = PROGRAMS[names[h % names.length]!]!;
  const created = '2026-08-29T09:00:00';
  const P = new Phone().launch(created);
  let id: string;
  try { id = P.generate(JSON.parse(JSON.stringify(cfg))); } catch { continue; }
  tally.histories++;
  const { first, start } = firstWeek(P, created);
  let dayNo = 7 * (first - 1), clock = 6;
  const relaunch = () => { drain(P); P.launch(at(start, dayNo, String(Math.min(23, clock)).padStart(2, '0') + ':00')); wrap(P); };
  relaunch();
  const week = (): number => P.ev('calcCurrentWeek()');
  const train = (w: number) => DAYS.filter((d) => { const x = P.day(w, d); return x && !x.rest && Array.isArray(x.sections); });
  const TAPS: Record<string, () => void> = {
    later: () => { if (rnd(2)) { dayNo += 1 + rnd(2); clock = 6; } else clock += 1 + rnd(3); relaunch(); },
    lift: () => { const w = Math.max(1, week() - rnd(2)); const d = pick(train(w)); if (!d) return; P.open(w, d); const c = pick(cards(P.day(w, d))); if (c) P.logLift(c.name, c.detail, [c.reps, c.reps], [100 + rnd(20) * 5, 105 + rnd(20) * 5]); },
    run: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); P.type('log_run_dist', '3.' + rnd(9)); P.type('log_run_mins', String(25 + rnd(20))); P.type('log_bike_mins', String(30 + rnd(30))); P.ev(`persistLogFields(${JSON.stringify(d)},true)`); },
    done: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); P.mark(d, 'complete'); },
    skip: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); P.mark(d, 'skipped'); },
    part: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.ev(`(function(){var p=dayPartsOf(${w},${JSON.stringify(d)});if(p.length)skipPart(${w},${JSON.stringify(d)},p[${rnd(2)}%p.length]);})()`); },
    swap: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); const c = pick(cards(P.day(w, d))); if (!c) return;
      P.IA.ctx['__c'] = { secIdx: c.secIdx, itemIdx: c.itemIdx, name: c.name, detail: c.detail };
      const to: string | null = P.ev(`(function(){var day=activeProg.weeks[${w}][${JSON.stringify(d)}];var r=swapCandidates(__c.name,day,${w},activeProg);var l=[].concat(r.tier1||[],r.tier2||[]);var x=l[${rnd(3)}%Math.max(1,l.length)];return x?(x.name||x):null;})()`);
      if (to) P.ev(`_swapCtx=__c;applySwapChoice(${JSON.stringify(to)});`); },
    undoSwap: () => { const w = week(); const sw = JSON.parse(P.dump()['ia_swaps_' + id] || '{}'); const k = pick(Object.keys(sw).filter((x) => x.startsWith('w' + w + '_'))); if (!k) return; const d = k.split('_')[1]!; P.open(w, d as any); const e = pick(sw[k] as any[]); if (e) P.ev(`undoSwap(${JSON.stringify(e.from)});`); },
    skipMove: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); const c = pick(cards(P.day(w, d))); if (c) P.ev(`skipExercise(${JSON.stringify(c.name)});`); },
    unskipMove: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); const it: string | null = P.ev(`(function(){var n=null;(activeProg.weeks[${w}][${JSON.stringify(d)}].sections||[]).forEach(function(s){(s.items||[]).forEach(function(i){if(i._skipped)n=i.name;});});return n;})()`); if (it) P.ev(`unskipExercise(${JSON.stringify(it)});`); },
    add: () => { const w = week(); const d = pick(train(w)); if (!d) return; P.open(w, d); const a: string | null = P.ev(`(function(){var c=addCandidates(activeProg.weeks[${w}][${JSON.stringify(d)}],${w},activeProg);return (c.more||[])[0]||(c.gap||[])[0]||null;})()`); if (a) P.ev(`applyAddChoice(${JSON.stringify(a)});`); },
    move: () => { const w = week(); const r = pick(DAYS.filter((d) => P.ev(`restDayEligible(${w},${JSON.stringify(d)})`))); if (!r) return; P.ev(`openRestSheet(${w},${JSON.stringify(r)},'move');`); const c: string[] = JSON.parse(P.ev(`JSON.stringify(restMoveCandidates(${w}).map(function(x){return x.day;}))`)); const p = pick(c); if (p) { P.ev(`_rdSet('pick',${JSON.stringify(p)});applyRestMove();`); P.settle(); } },
    jog: () => { const w = week(); const r = pick(DAYS.filter((d) => P.ev(`restJogEligible(${w},${JSON.stringify(d)})`))); if (!r) return; P.ev(`openRestSheet(${w},${JSON.stringify(r)},'cardio');_restDraft.view='cardio';_restDraft.type='run';_restDraft.mins='${20 + rnd(20)}';_restDraft.dist='2';applyRestCardio();`); },
    injury: () => { P.ev(`_ovDraft.injRegion=${JSON.stringify(pick(['knee', 'lowback', 'shoulder']))};_ovDraft.injTier='workaround';_ovDraft.from=${JSON.stringify(at(start, dayNo).slice(0, 10))};applyInjuryDraft();`); },
    back: () => { P.ev(`(function(){var o=(activeProg.overlays||[]).filter(function(x){return x.type==='injury';})[0];if(o)imBackFromInjury(o.id);})()`); },
    travel: () => { P.ev(`_ovDraft.equipment=${JSON.stringify(pick(['minimal', 'bodyweight']))};_ovDraft.from=${JSON.stringify(at(start, dayNo).slice(0, 10))};_ovDraft.to=${JSON.stringify(at(start, dayNo + 3).slice(0, 10))};applyOverlayDraft();`); },
    removeOverlay: () => { P.ev(`(function(){var o=(activeProg.overlays||[])[0];if(o)removeOverlay(o.id);})()`); },
  };
  // The taps that touch a day come up more often than the ones that change the plan.
  const deck = ['later', 'later', 'lift', 'lift', 'lift', 'run', 'done', 'skip', 'part', 'part', 'swap', 'swap', 'undoSwap', 'skipMove', 'unskipMove', 'add', 'move', 'move', 'move', 'jog', 'injury', 'back', 'travel', 'removeOverlay'];
  for (let i = 0; i < STEPS; i++) {
    const tap = pick(deck)!;
    tally.steps++; byTap[tap] = (byTap[tap] || 0) + 1;
    try { TAPS[tap]!(); P.settle(); } catch { tally.refused++; }
    const hist = JSON.parse(P.dump()['ia_hist_' + id] || '{}');
    for (const k of Object.keys(hist)) {
      const m = /^w(\d+)_(\w+)$/.exec(k); if (!m) continue;
      const day = P.day(+m[1]!, m[2] as any);
      if (JSON.stringify(day) === JSON.stringify(hist[k])) continue;
      tally.seenChanged++;
      const kind = !day ? 'the day is not in the grid' : day.rest && day.moved ? 'a rest day its session was moved away from' : day.rest ? 'another rest day' : 'a training day';
      changedKinds[kind] = (changedKinds[kind] || 0) + 1;
      if (kind === 'a rest day its session was moved away from') tally.seenStub++; else tally.seenOther++;
    }
  }
  drain(P);
}

const L: string[] = [];
L.push('# Stored state: random histories, and whether a day is ever snapshotted again after it changed');
L.push('');
L.push('Written by `tests/measure/stored-state_first-touch-walks.ts` (' + HISTORIES + ' histories asked for, ' + STEPS + ' taps each, over the ' + names.length + ' seeded programs).');
L.push('');
L.push('| What | Count |');
L.push('|---|---|');
L.push('| Histories walked | ' + tally.histories + ' |');
L.push('| Taps | ' + tally.steps + ' (' + tally.refused + ' threw in the harness and were passed over) |');
L.push('| Calls of snapshotDay | ' + tally.calls + ' |');
L.push('| of those, on a day that already had a snapshot | ' + tally.repeat + ' |');
L.push('| of those, with the day in hand different from its snapshot (the guard decides what is stored) | **' + tally.repeatChanged + '** |');
L.push('| Times a tap left a snapshotted day in hand different from its snapshot (counted after every tap) | ' + tally.seenChanged + ' |');
for (const k of Object.keys(changedKinds).sort()) L.push('| of those, the day in hand was ' + k + ' | ' + changedKinds[k] + ' |');
L.push('');
L.push('Taps by kind: ' + Object.keys(byTap).sort().map((k) => k + ' ' + byTap[k]).join(', ') + '.');
if (examples.length) { L.push(''); L.push('Calls where the guard decided: ' + examples.join('; ') + '.'); }
process.stdout.write(L.join('\n') + '\n');
