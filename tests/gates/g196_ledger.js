// g196_ledger — V196 (D56 / D57 / D58 / D59): the Lift Ledger stops dropping sessions.
//
// WHAT THIS GATE IS FOR
//   V195's ledgerModel returned early whenever no main-slot session for a store key
//   carried a weight. Measured: 30,018 of 105,280 (config, movement) pairs dropped
//   unconditionally, 8,052 of 13,104 configs carrying at least one. On a bodyweight
//   program buildLedgerCards returned ZERO characters from a fully populated store.
//   D57 routes those to the Main Lifts card plotted in REPS. D58 makes the footer
//   account for every session in two clauses. D59 forbids carrying a weight forward
//   across a blank Load box. D56 fixes the surfaces that lied about the classifier.
//
// HOW IT ASSERTS (the V195 lesson, §10b)
//   It RENDERS. renderProgressScreen() is called through a RETAINING DOM stub and the
//   assertions read progressBody.innerHTML back. The harness's own getElementById hands
//   out a fresh element per call, so an innerHTML write lands on a throwaway and a
//   read-back sees nothing — that is exactly how g195's first cut returned PASS 52
//   FAIL 0 against four real breaks. Nothing here greps a function's toString().
//
// ORACLES (all independent of the code under test)
//   - every store is a HAND-BUILT ia_exw_ / ia_hist_ fixture declared as a table in this
//     file, never anything buildProgram produced. Session counts, rep counts, which
//     sessions carry a load and which week each one falls in are known by construction.
//   - every footer number is arithmetic over that table, done here.
//   - every expected string is typed out by hand from the ruling.
//   - the swap-sheet oracle is the V162 D0 slot rule stated in words (item 0 of a
//     /^main/i, non-superset section) plus one named barbell compound.
//   The ONE place app code builds a fixture is exStoreKey, which is the single writer of
//   ia_exw_ keys and is untouched by V196; it is used to key the store, never to decide
//   an expectation. The gate proves the 10 keys it produces are distinct.
//
// Usage: node tests/gates/g196_ledger.js <candidate.html>
const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(FILE);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
function tryOk(name, fn) {
  try { const r = fn(); ok(name, r === true || (r && r.cond === true), r && r.detail); }
  catch (e) { fail++; console.log('FAIL ' + name + '  -> threw: ' + e.message); }
}

// ── retaining DOM stub ──────────────────────────────────────────────────────
const DOM_STUB = "__g196mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',placeholder:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g196els={};document.getElementById=function(id){if(!__g196els[id])__g196els[id]=__g196mk(id);return __g196els[id];};"
  + "document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";

const PID = 'g196prog';

// ── fixture builder: a table in, an ia_exw_ + ia_hist_ pair out ─────────────
// A session is {week, day, slot:'main'|'acc', weight, sets:[reps per set], detail}.
// slot 'main' writes a "Main — <name>" section with the movement at item 0, which is
// the V162 D0 shape _slotOfEntry reads. slot 'acc' writes it into an "Accessory"
// section, where no index makes it a main lift.
function buildStore(table) {
  const exw = {}, hist = {};
  table.forEach(mv => {
    const key = IA.eval('exStoreKey(' + JSON.stringify(mv.name) + ')');
    if (!exw[key]) exw[key] = { name: mv.name, entries: [] };
    mv.sessions.forEach((s, i) => {
      exw[key].entries.push({
        weight: s.weight || 0,
        setsReps: s.setsReps || '',
        setsDone: (s.sets || []).slice(),
        setsW: [],
        week: s.week, day: s.day, ts: s.week * 1000 + i
      });
      const hk = 'w' + s.week + '_' + s.day;
      if (!hist[hk]) hist[hk] = { sections: [] };
      if (s.slot === 'main') {
        hist[hk].sections.unshift({ label: 'Main — ' + mv.name, items: [{ name: mv.name, detail: s.detail || '3×10' }] });
      } else {
        let acc = hist[hk].sections.filter(x => x.label === 'Accessory')[0];
        if (!acc) { acc = { label: 'Accessory', items: [] }; hist[hk].sections.push(acc); }
        acc.items.push({ name: mv.name, detail: s.detail || '3×8–12 @ RPE 8' });
      }
    });
  });
  return { exw, hist, keys: Object.keys(exw) };
}

// Render the REAL progress screen against a fixture and hand back what the athlete sees.
function renderProgress(store, unit) {
  IA.localStorage.clear();
  IA.eval(DOM_STUB);
  const prog = {
    id: PID, name: 'G196', archived: false, totalWeeks: 10,
    startDate: '2026-01-05', liftingFocus: 'balanced',
    cfg: { name: 'G196', unit: unit || 'lbs', cardioTypes: [], liftingFocus: 'balanced', experience: 'intermediate' },
    weeks: {}
  };
  IA.localStorage.setItem('ia_programs', JSON.stringify([prog]));
  IA.localStorage.setItem('ia_exw_' + PID, JSON.stringify(store.exw));
  IA.localStorage.setItem('ia_hist_' + PID, JSON.stringify(store.hist));
  // renderProgressScreen bails to an empty state unless SOMETHING was logged.
  IA.localStorage.setItem('ia_logs_' + PID, JSON.stringify({ w1_mon: { rpe: 7, ts: 1 } }));
  IA.eval("activeProgId='" + PID + "'");
  IA.eval('activeProg=' + JSON.stringify(prog));
  IA.eval('progressViewId=null');
  IA.eval('renderProgressScreen()');
  return IA.eval('__g196els.progressBody ? __g196els.progressBody.innerHTML : ""') || '';
}

// ── rendered-HTML readers ───────────────────────────────────────────────────
const CARD_OPEN = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">';
const BLOCK_OPEN = '<div style="padding:12px 0;border-bottom:1px solid var(--border)">';
function cards(html) { return html.split(CARD_OPEN).slice(1); }
function cardTitled(html, title) {
  const hit = cards(html).filter(c => c.slice(0, 900).indexOf(title + '</div>') >= 0);
  return hit.length ? hit[0] : '';
}
function blocks(card) { return card.split(BLOCK_OPEN).slice(1); }
function blockFor(card, name) {
  const hit = blocks(card).filter(b => b.indexOf('>' + name + '</div>') >= 0);
  return hit.length ? hit[0] : '';
}
function footerOf(card) {
  const k = card.lastIndexOf('<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">');
  return k < 0 ? '' : card.slice(k);
}
function countOf(s, needle) { let n = 0, i = 0; while ((i = s.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
function textOf(h) { return h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
// Week labels the chart printed on its x axis, in order.
function weekLabels(block) { return (block.match(/>W(\d+)</g) || []).map(s => +s.replace(/\D/g, '')); }

console.log('# g196_ledger against ia-version ' + IA.version);
console.log('');

// ════════════════════════════════════════════════════════════════════════════
// A. THE BODYWEIGHT PROGRAM — V195 renders zero characters from this store.
// ════════════════════════════════════════════════════════════════════════════
// Ten movements, none of them ever loaded, each the item-0 main lift of its own day.
// Five weekdays × two week parities = ten main slots. Chin-up loses week 9 and Dip
// loses week 10 (the athlete missed them), so 8×5 + 2×4 = 48 sessions.
// Every session is three sets; 44 of them are 3×10 and 4 are 3×13.
// Hand arithmetic: 44×30 + 4×39 = 1320 + 156 = 1476 reps.
const A_PLAN = [
  { name: 'Push-up',              day: 'mon', weeks: [1, 3, 5, 7, 9],  top: 9  },
  { name: 'Bodyweight squat',     day: 'mon', weeks: [2, 4, 6, 8, 10], top: 10 },
  { name: 'Inverted row',         day: 'tue', weeks: [1, 3, 5, 7, 9],  top: 9  },
  { name: 'Pike push-up',         day: 'tue', weeks: [2, 4, 6, 8, 10], top: 10 },
  { name: 'Reverse lunge',        day: 'wed', weeks: [1, 3, 5, 7, 9],  top: 0  },
  { name: 'Glute bridge',         day: 'wed', weeks: [2, 4, 6, 8, 10], top: 0  },
  { name: 'Nordic hamstring curl',day: 'thu', weeks: [1, 3, 5, 7, 9],  top: 0  },
  { name: 'Single-leg hip thrust',day: 'thu', weeks: [2, 4, 6, 8, 10], top: 0  },
  { name: 'Chin-up',              day: 'fri', weeks: [1, 3, 5, 7],     top: 0  },
  { name: 'Dip',                  day: 'fri', weeks: [2, 4, 6, 8],     top: 0  },
];
const A_TABLE = A_PLAN.map(p => ({
  name: p.name,
  sessions: p.weeks.map(w => ({
    week: w, day: p.day, slot: 'main', weight: 0,
    sets: (w === p.top) ? [13, 13, 13] : [10, 10, 10],
    setsReps: '3×10', detail: '3 sets to effort'
  }))
}));
const A_SESSIONS = A_TABLE.reduce((a, m) => a + m.sessions.length, 0);
const A_REPS = A_TABLE.reduce((a, m) => a + m.sessions.reduce((x, s) => x + s.sets.reduce((p, q) => p + q, 0), 0), 0);

const A_STORE = buildStore(A_TABLE);
const A_HTML = renderProgress(A_STORE, 'lbs');
const A_CARD = cardTitled(A_HTML, 'Main Lifts');

ok('A0 fixture table is the shape the ruling measured (48 sessions, 1476 reps)',
   A_SESSIONS === 48 && A_REPS === 1476, A_SESSIONS + ' sessions / ' + A_REPS + ' reps');
ok('A0b exStoreKey gives 10 distinct store keys for 10 movements',
   A_STORE.keys.length === 10, A_STORE.keys.length + ' keys');
ok('A1 a fully populated bodyweight store renders a Main Lifts card (V195 renders nothing)',
   A_CARD.length > 0, 'card chars=' + A_CARD.length);
ok('A2 all 10 unloaded main lifts render as blocks',
   blocks(A_CARD).length === 10, 'blocks=' + blocks(A_CARD).length);
ok('A3 every one of the 48 sessions is plotted (one dot per session)',
   countOf(A_CARD, '<circle') === 48, 'dots=' + countOf(A_CARD, '<circle'));
ok('A4 Push-up headline is its best single set in reps',
   blockFor(A_CARD, 'Push-up').indexOf('>13 reps</div>') >= 0, textOf(blockFor(A_CARD, 'Push-up')).slice(0, 90));
ok('A5 Push-up opened at 10 reps in week 1 and gained 3 reps, best in week 9',
   textOf(blockFor(A_CARD, 'Push-up')).indexOf('Opened at 10 reps in week 1 · up 3 reps · best in week 9') >= 0,
   textOf(blockFor(A_CARD, 'Push-up')).slice(0, 120));
ok('A6 a movement that never improved prints no gain and names its own best week',
   textOf(blockFor(A_CARD, 'Reverse lunge')).indexOf('Opened at 10 reps in week 1 · best in week 1') >= 0,
   textOf(blockFor(A_CARD, 'Reverse lunge')).slice(0, 120));
ok('A7 a reps block never prints a load unit',
   !/\d\s*(lbs|kg)\b/.test(textOf(A_CARD)), textOf(A_CARD).slice(0, 140));
ok('A8 a reps block never prints the load grammar weight×reps',
   textOf(blockFor(A_CARD, 'Push-up')).indexOf('13×') < 0 && textOf(blockFor(A_CARD, 'Push-up')).indexOf('10×') < 0);
ok('A9 nothing is disclosed when nothing was withheld',
   textOf(footerOf(A_CARD)).indexOf('kept off the line') < 0
   && textOf(footerOf(A_CARD)).indexOf('no load written down') < 0, textOf(footerOf(A_CARD)));
ok('A10 coach rejected the unloaded bucket: no main lift lands in Other Accessory Work',
   A_PLAN.every(p => cardTitled(A_HTML, 'Other Accessory Work').indexOf('>' + p.name + '<') < 0));
ok('A11 the Chin-up block reflects the four sessions the athlete actually logged',
   countOf(blockFor(A_CARD, 'Chin-up'), '<circle') === 4, 'dots=' + countOf(blockFor(A_CARD, 'Chin-up'), '<circle'));

// ════════════════════════════════════════════════════════════════════════════
// B. THE MIXED CASE — D58 footer arithmetic and D59 no carry-forward.
// ════════════════════════════════════════════════════════════════════════════
// Dumbbell bench press, the ruling's own fixture: 16 logged sessions.
//   10 main-slot (weeks 1..10 on mon): weeks 1-5 blank, weeks 6-10 loaded 45/50/55/60/65
//    6 accessory-day (weeks 1..6 on thu), all loaded.
//   plotted 5, accessoryDay 6, noLoad 5, entries 16. 5 + 6 + 5 = 16.
// Goblet squat: 4 main-slot all blank + 4 loaded accessory-day. V195 dropped all eight.
//   plotted 4, accessoryDay 4, noLoad 0, entries 8. 4 + 4 + 0 = 8.
// Card totals, by hand: plotted 9, accessoryDay 10, noLoad 5, entries 24.
const B_DBB = { name: 'Dumbbell bench press', sessions: [] };
[1, 2, 3, 4, 5].forEach(w => B_DBB.sessions.push({ week: w, day: 'mon', slot: 'main', weight: 0, sets: [5, 5, 5], setsReps: '3×5' }));
[[6, 45], [7, 50], [8, 55], [9, 60], [10, 65]].forEach(p =>
  B_DBB.sessions.push({ week: p[0], day: 'mon', slot: 'main', weight: p[1], sets: [8, 8, 8], setsReps: '3×8' }));
[1, 2, 3, 4, 5, 6].forEach(w => B_DBB.sessions.push({ week: w, day: 'thu', slot: 'acc', weight: 30, sets: [6, 5, 5], setsReps: '3×6' }));
// NOTE: the display name is the canonical one. foldExAliasKeys (V151) rewrites a
// non-canonical ex.name on read, which is pre-existing behaviour and not V196's.
const B_GOB = { name: 'Dumbbell goblet squat', sessions: [] };
[1, 2, 3, 4].forEach(w => B_GOB.sessions.push({ week: w, day: 'tue', slot: 'main', weight: 0, sets: [12, 12, 12], setsReps: '3×12' }));
[1, 2, 3, 4].forEach(w => B_GOB.sessions.push({ week: w, day: 'sat', slot: 'acc', weight: 40, sets: [10, 10, 10], setsReps: '3×10' }));
const B_TABLE = [B_DBB, B_GOB];
const B_ENTRIES = B_TABLE.reduce((a, m) => a + m.sessions.length, 0);
const B_BLANK_MAIN_WEEKS = [1, 2, 3, 4, 5];
const B_LOADED_WEEKS = [6, 7, 8, 9, 10];
// The reps the athlete did that are on no line: 5 blank main sessions at 15 reps each
// plus 6 accessory sessions at 16 reps each = 75 + 96 = 171, the ruling's number.
const B_OFFLINE_REPS = 5 * 15 + 6 * 16;

const B_STORE = buildStore(B_TABLE);
const B_HTML = renderProgress(B_STORE, 'lbs');
const B_CARD = cardTitled(B_HTML, 'Main Lifts');
const B_FOOT = textOf(footerOf(B_CARD));
const B_DBB_BLOCK = blockFor(B_CARD, 'Dumbbell bench press');

ok('B0 fixture matches the ruling: 24 entries, 171 reps off the line',
   B_ENTRIES === 24 && B_OFFLINE_REPS === 171, B_ENTRIES + ' / ' + B_OFFLINE_REPS);
ok('B1 both movements render on the Main Lifts card',
   blocks(B_CARD).length === 2 && B_DBB_BLOCK.length > 0 && blockFor(B_CARD, 'Dumbbell goblet squat').length > 0,
   'blocks=' + blocks(B_CARD).length);
ok('B2 only the five loaded sessions are plotted',
   countOf(B_DBB_BLOCK, '<circle') === 5, 'dots=' + countOf(B_DBB_BLOCK, '<circle'));
ok('B3 D59: no weight is carried forward, the blank weeks draw no point',
   weekLabels(B_DBB_BLOCK).join(',') === B_LOADED_WEEKS.join(',')
   && B_BLANK_MAIN_WEEKS.every(w => weekLabels(B_DBB_BLOCK).indexOf(w) < 0),
   'x axis = ' + weekLabels(B_DBB_BLOCK).join(','));
ok('B4 D59 honesty rider: Opened at names the first PLOTTED week, not the first session',
   textOf(B_DBB_BLOCK).indexOf('Opened at 45×8 in week 6') >= 0, textOf(B_DBB_BLOCK).slice(0, 130));
ok('B5 the loaded headline is still the heaviest set, in load',
   textOf(B_DBB_BLOCK).indexOf('65×8') >= 0 && textOf(B_DBB_BLOCK).indexOf('heaviest in week 10') >= 0,
   textOf(B_DBB_BLOCK).slice(0, 130));
ok('B6 an all-blank main lift renders as a reps block instead of vanishing',
   textOf(blockFor(B_CARD, 'Dumbbell goblet squat')).indexOf('Opened at 12 reps in week 1') >= 0,
   textOf(blockFor(B_CARD, 'Dumbbell goblet squat')).slice(0, 130));
ok('B7 the accessory-day clause states 10 sessions, in the ruled words',
   B_FOOT.indexOf('10 sessions where this ran as an accessory are kept off the line. '
     + 'The lighter sets would make the climb look like something it was not.') >= 0, B_FOOT);
ok('B8 the no-load clause states 5 sessions, in the ruled words',
   B_FOOT.indexOf('5 sessions had no load written down. Add the weight and they join the line.') >= 0, B_FOOT);
ok('B9 D58: two clauses, never one number',
   B_FOOT.indexOf('kept off the line') >= 0 && B_FOOT.indexOf('no load written down') >= 0
   && B_FOOT.indexOf('kept out of the line so it reads clean') < 0, B_FOOT);
// The closure is read back out of the RENDERED footer, not from the numbers this file
// hand-computed, so a footer that under-reports cannot satisfy it.
function disclosed(footText) {
  const a = footText.match(/(\d+) sessions? where this ran as an accessory/);
  const b = footText.match(/(\d+) sessions? had no load written down/);
  return [a ? +a[1] : 0, b ? +b[1] : 0];
}
const B_DISC = disclosed(B_FOOT);
ok('B10 the card closes on its OWN rendered numbers: plotted + accessoryDay + noLoad == entries',
   countOf(B_CARD, '<circle') + B_DISC[0] + B_DISC[1] === B_ENTRIES,
   countOf(B_CARD, '<circle') + ' + ' + B_DISC[0] + ' + ' + B_DISC[1] + ' vs ' + B_ENTRIES);
ok('B11 the mixed case no longer destroys the accessory sessions it hid',
   B_FOOT.indexOf('10 sessions') >= 0);

// Per-movement closure and completeness, against the hand table above.
tryOk('B12 per movement: plotted + accessoryDay + noLoad == entries', () => {
  const m = JSON.parse(IA.eval('JSON.stringify(ledgerModel(' + JSON.stringify(B_STORE.exw) + ',' + JSON.stringify(B_STORE.hist) + '))'));
  const want = { 'Dumbbell bench press': [5, 6, 5, 16], 'Dumbbell goblet squat': [4, 4, 0, 8] };
  const bad = m.mains.filter(x => {
    const w = want[x.name];
    return !w || x.plotted !== w[0] || x.accessoryDay !== w[1] || x.noLoad !== w[2] || x.entries !== w[3]
      || (x.plotted + x.accessoryDay + x.noLoad) !== x.entries;
  });
  return { cond: m.mains.length === 2 && bad.length === 0, detail: JSON.stringify(m.mains.map(x => [x.name, x.plotted, x.accessoryDay, x.noLoad, x.entries])) };
});

// ════════════════════════════════════════════════════════════════════════════
// C. COMPLETENESS — every populated store key lands in exactly one bucket.
// ════════════════════════════════════════════════════════════════════════════
// Run over a store that mixes every routing case the model has: an unloaded main,
// a mixed main, a loaded main, a ranged accessory (ladder), a plain accessory, and a
// bodyweight accessory. A key in no bucket is the V195 defect; a key in two is a new one.
const C_TABLE = [
  { name: 'Push-up', sessions: [1, 2, 3].map(w => ({ week: w, day: 'mon', slot: 'main', weight: 0, sets: [20, 18, 15], setsReps: '3×20' })) },
  { name: 'Barbell back squat', sessions: [1, 2, 3].map(w => ({ week: w, day: 'tue', slot: 'main', weight: 135 + w * 10, sets: [5, 5, 5], setsReps: '3×5' })) },
  { name: 'Dumbbell lateral raise', sessions: [1, 2, 3, 4].map(w => ({ week: w, day: 'wed', slot: 'acc', weight: w < 3 ? 15 : 20, sets: [12, 12, 12], setsReps: '3×12', detail: '3×8–12 @ RPE 8' })) },
  { name: 'Cable triceps pushdown', sessions: [1, 2].map(w => ({ week: w, day: 'thu', slot: 'acc', weight: 50, sets: [10, 10], setsReps: '2×10', detail: '2 sets of 10' })) },
  { name: 'Hanging knee raise', sessions: [1, 2].map(w => ({ week: w, day: 'fri', slot: 'acc', weight: 0, sets: [12, 12], setsReps: '2×12', detail: '2 sets to effort' })) },
];
const C_STORE = buildStore(C_TABLE);
tryOk('C1 completeness: every populated key appears in exactly one bucket', () => {
  const m = JSON.parse(IA.eval('JSON.stringify(ledgerModel(' + JSON.stringify(C_STORE.exw) + ',' + JSON.stringify(C_STORE.hist) + '))'));
  const seen = {};
  ['mains', 'ladder', 'plain', 'unloaded'].forEach(b => m[b].forEach(r => { seen[r.name] = (seen[r.name] || 0) + 1; }));
  const names = C_TABLE.map(t => t.name);
  const missing = names.filter(n => !seen[n]);
  const doubled = names.filter(n => seen[n] > 1);
  return { cond: missing.length === 0 && doubled.length === 0, detail: 'missing=' + missing.join('|') + ' doubled=' + doubled.join('|') };
});
tryOk('C2 an unloaded main lift is a MAIN lift, never Other Accessory Work', () => {
  const m = JSON.parse(IA.eval('JSON.stringify(ledgerModel(' + JSON.stringify(C_STORE.exw) + ',' + JSON.stringify(C_STORE.hist) + '))'));
  return { cond: m.mains.some(x => x.name === 'Push-up') && !m.unloaded.some(x => x.name === 'Push-up'),
           detail: 'mains=' + m.mains.map(x => x.name).join('|') + ' unloaded=' + m.unloaded.map(x => x.name).join('|') };
});
tryOk('C3 the blending rule survives: a main chart plots main-slot sessions only', () => {
  const m = JSON.parse(IA.eval('JSON.stringify(ledgerModel(' + JSON.stringify(B_STORE.exw) + ',' + JSON.stringify(B_STORE.hist) + '))'));
  const db = m.mains.filter(x => x.name === 'Dumbbell bench press')[0];
  // the 6 accessory-day sessions were logged at 30 lbs on thu; none may be on the line
  return { cond: !!db && db.series.every(p => p.v >= 45) && db.series.length === 5,
           detail: JSON.stringify(db && db.series) };
});

// ════════════════════════════════════════════════════════════════════════════
// D. SINGULAR COUNTS AND THE SERIES-OF-ONE RULE.
// ════════════════════════════════════════════════════════════════════════════
// Barbell overhead press: week 1 main blank, week 2 accessory loaded, week 3 main loaded.
// plotted 1, accessoryDay 1, noLoad 1, entries 3. One point means a headline and no chart.
const D_TABLE = [{
  name: 'Barbell overhead press', sessions: [
    { week: 1, day: 'mon', slot: 'main', weight: 0, sets: [5, 5, 5], setsReps: '3×5' },
    { week: 2, day: 'thu', slot: 'acc', weight: 75, sets: [8, 8, 8], setsReps: '3×8' },
    { week: 3, day: 'mon', slot: 'main', weight: 95, sets: [5, 5, 5], setsReps: '3×5' },
  ]
}];
const D_STORE = buildStore(D_TABLE);
const D_HTML = renderProgress(D_STORE, 'lbs');
const D_CARD = cardTitled(D_HTML, 'Main Lifts');
const D_FOOT = textOf(footerOf(D_CARD));
ok('D1 a single plotted session still renders its headline',
   textOf(D_CARD).indexOf('95×5') >= 0, textOf(D_CARD).slice(0, 160));
ok('D2 series of one draws no chart (the existing series>=2 rule, unchanged)',
   countOf(D_CARD, '<circle') === 0 && countOf(D_CARD, '<svg viewBox="0 0 320') === 0,
   'dots=' + countOf(D_CARD, '<circle'));
ok('D3 one withheld accessory session reads as one session',
   D_FOOT.indexOf('1 session where this ran as an accessory is kept off the line.') >= 0, D_FOOT);
ok('D4 one blank session reads as one session',
   D_FOOT.indexOf('1 session had no load written down. Add the weight and it joins the line.') >= 0, D_FOOT);
const D_DISC = disclosed(D_FOOT);
ok('D5 the card closes on the singular fixture: plotted 1 + 1 + 1 == 3',
   1 + D_DISC[0] + D_DISC[1] === D_TABLE[0].sessions.length,
   '1 + ' + D_DISC[0] + ' + ' + D_DISC[1] + ' vs ' + D_TABLE[0].sessions.length);

// ════════════════════════════════════════════════════════════════════════════
// E. D58 / D56 COPY — the opening line and the disambiguation line.
// ════════════════════════════════════════════════════════════════════════════
const E_FOOT = textOf(footerOf(B_CARD));
ok('E1 the opening sentence is trimmed to what a reps block can back',
   E_FOOT.indexOf('The top set you actually did.') === 0, E_FOOT.slice(0, 80));
ok('E2 the old claim about the working weight is gone',
   E_FOOT.indexOf('The heaviest set you actually did, and the working weight behind it') < 0);
ok('E3 the no-estimated-maxes sentence stays verbatim',
   E_FOOT.indexOf('No estimated maxes: a formula that inflates with reps would rank a heavy single below a lighter double.') >= 0);
ok('E4 D56: the footer disambiguates the classifier in coach’s words',
   E_FOOT.indexOf('This is the lift each day was built around. Everything else you loaded is in the ladder below.') >= 0, E_FOOT);
ok('E5 Mario’s amendment: the card is still called MAIN LIFTS',
   B_CARD.slice(0, 900).indexOf('Main Lifts</div>') >= 0 && B_HTML.indexOf('Top Lifts') < 0);

// ════════════════════════════════════════════════════════════════════════════
// F. D56 — the Range Ladder stops calling the athlete's heavy lifts accessories.
// ════════════════════════════════════════════════════════════════════════════
const F_HTML = renderProgress(C_STORE, 'lbs');
const F_CARD = cardTitled(F_HTML, 'Range Ladder');
const F_TITLE = F_CARD.slice(0, F_CARD.indexOf('</div>') + 6);
ok('F1 the ladder card renders and is titled Range Ladder',
   F_CARD.length > 0 && F_TITLE.indexOf('Range Ladder') >= 0, textOf(F_TITLE));
ok('F2 the title no longer calls them Accessories',
   F_TITLE.indexOf('Accessories') < 0, textOf(F_TITLE));
ok('F3 the title no longer carries a mid-title em-dash',
   F_TITLE.indexOf('—') < 0, textOf(F_TITLE));
ok('F4 the head line reads "across these lifts this block"',
   textOf(F_CARD).indexOf('across these lifts this block') >= 0, textOf(F_CARD).slice(0, 220));
ok('F5 the head line no longer reads "across your accessories this block"',
   textOf(F_CARD).indexOf('across your accessories this block') < 0);
ok('F6 the ladder still ranks the movement it was given',
   F_CARD.indexOf('Dumbbell lateral raise') >= 0);

// ════════════════════════════════════════════════════════════════════════════
// G. D56 — the swap sheet stops printing MAIN LIFT on the heavy-compound arm.
// ════════════════════════════════════════════════════════════════════════════
// Oracle, stated in words and independent of the code: V162 D0 says the MAIN LIFT slot
// is item 0 of a non-superset section whose label starts with "Main". Anything else is
// not a main lift, however heavy it is. "Barbell Romanian deadlift" is, by hand, a
// barbell compound, so at any index other than that slot it is a heavy compound caution.
const G_PROG = (function () {
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  return IA.buildProgram(cfg);
})();
function swapTags(week, dayKey, secIdx, itemIdx) {
  IA.eval(DOM_STUB);
  IA.eval("activeProgId='" + PID + "'");
  IA.eval('activeProg=' + JSON.stringify(G_PROG));
  IA.eval('currentWeek=' + week);
  IA.eval("currentDayKey='" + dayKey + "'");
  IA.eval('openSwapSheet(' + secIdx + ',' + itemIdx + ')');
  return IA.eval('__g196els.swapTags ? __g196els.swapTags.innerHTML : ""') || '';
}
// Find, by the hand-stated rule, one item in each arm.
let G_SLOT = null, G_TIER = null;
Object.keys(G_PROG.weeks).forEach(wk => Object.keys(G_PROG.weeks[wk]).forEach(dk => {
  const day = G_PROG.weeks[wk][dk];
  (day.sections || []).forEach((sec, si) => (sec.items || []).forEach((it, ii) => {
    if (!it || !it.name) return;
    const mainSlot = (ii === 0 && !(sec.superset || sec.type === 'superset') && /^main/i.test(sec.label || ''));
    if (mainSlot && !G_SLOT) G_SLOT = [wk, dk, si, ii, it.name];
    if (!mainSlot && !G_TIER && /^Barbell Romanian deadlift$/.test(it.name)) G_TIER = [wk, dk, si, ii, it.name];
  }));
}));
ok('G0 the built program offers both arms to test',
   !!G_SLOT && !!G_TIER, 'slot=' + JSON.stringify(G_SLOT) + ' tier=' + JSON.stringify(G_TIER));
if (G_SLOT) {
  const t = swapTags(G_SLOT[0], G_SLOT[1], G_SLOT[2], G_SLOT[3]);
  ok('G1 the slot arm still prints MAIN LIFT (' + G_SLOT[4] + ')',
     t.indexOf('>MAIN LIFT<') >= 0, textOf(t));
  ok('G2 the slot arm does not print HEAVY COMPOUND',
     t.indexOf('HEAVY COMPOUND') < 0, textOf(t));
}
if (G_TIER) {
  const t = swapTags(G_TIER[0], G_TIER[1], G_TIER[2], G_TIER[3]);
  ok('G3 the tier arm prints HEAVY COMPOUND (' + G_TIER[4] + ' at item ' + G_TIER[3] + ')',
     t.indexOf('>HEAVY COMPOUND<') >= 0, textOf(t));
  ok('G4 the tier arm no longer claims MAIN LIFT',
     t.indexOf('MAIN LIFT') < 0, textOf(t));
  ok('G5 exactly one classification tag is printed, as before',
     countOf(t, 'class="swap-tag"') === 3, 'tags=' + countOf(t, 'class="swap-tag"'));
}

// ════════════════════════════════════════════════════════════════════════════
// H. COPY RULE — harvested from RENDERED output, never from a literal in this file.
// ════════════════════════════════════════════════════════════════════════════
// Scope is the strings V196 introduced: the Main Lifts footer, every main-lift block
// subhead, the Range Ladder title and head line, and the swap tags. Pre-existing copy
// elsewhere on the screen is not this version's debt and is not swept here.
const H_STRINGS = [];
[A_CARD, B_CARD, D_CARD].forEach(c => {
  if (!c) return;
  H_STRINGS.push(textOf(footerOf(c)));
  blocks(c).forEach(b => {
    const m = b.match(/<div style="font-size:11px;color:var\(--muted\);margin:2px 0 8px">([\s\S]*?)<\/div>(?:<svg|<\/div>)/);
    if (m) H_STRINGS.push(textOf(m[1]));
  });
});
if (F_CARD) { H_STRINGS.push(textOf(F_TITLE)); H_STRINGS.push(textOf(F_CARD).slice(0, 300)); }
if (G_TIER) H_STRINGS.push(textOf(swapTags(G_TIER[0], G_TIER[1], G_TIER[2], G_TIER[3])));
const H_CLEAN = H_STRINGS.filter(s => s && s.length);
ok('H0 the copy sweep harvested real rendered text',
   H_CLEAN.length >= 8, 'harvested ' + H_CLEAN.length + ' strings');
// A separator between a number and a spec is structural and exempt; these strings carry
// none, so any em-dash or spaced hyphen at all is a violation.
const H_DASH = H_CLEAN.filter(s => s.indexOf('—') >= 0 || / - /.test(s) || / – /.test(s));
ok('H1 no em-dash or spaced hyphen in any new athlete-facing string',
   H_DASH.length === 0, H_DASH.join(' || '));
const H_NIKE = H_CLEAN.filter(s => /nike/i.test(s));
ok('H2 no user-facing "Nike"', H_NIKE.length === 0, H_NIKE.join(' || '));
const H_LONG = H_CLEAN.filter(s => s.split(/(?<=[.!?])\s+/).some(t => t.split(/\s+/).length > 26));
ok('H3 sentences stay short and declarative', H_LONG.length === 0, H_LONG.join(' || '));

console.log('');
console.log('PASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
