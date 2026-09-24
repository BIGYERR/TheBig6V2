// g206_d109_copy.js — the gate for D109 (amended, coach-ruled): the cardio-builder copy sweep.
// No mid-sentence em-dash and no letter-hyphen-letter compound in anything the four cardio
// session builders put in front of the athlete. Coach ruled label dashes IN ("INT — Interval:"
// becomes "INT:", "CHI — Continuous High Intensity:" becomes "CHI:").
// D103a (V208) renamed the RUN builder's heads again ("CHI:" is "LI:", "INT:" is "SI:");
// see SUPERSEDED ENTRIES. The ruled table file is not edited.
//
// ORACLES, all independent of the engine:
//   * The COPY RULE itself (CLAUDE.md, Mario standing): no mid-sentence hyphens or em-dashes in
//     athlete copy. Typed here as two predicates: the character "—", and /[A-Za-z]-[A-Za-z]/.
//   * COACH'S REPLACEMENT TABLE, tests/measure/v206_d109_table.txt, sha256 pinned below. Its new
//     text must appear in each builder exactly as many times as the table's "@@ n" says. This is
//     what stops a deletion from passing: an empty note carries no dash either.
//
// ROWS
//   S-<builder>  STATIC, one per builder (run, NRC, bike, swim). Body = "function buildXSession("
//                to the first line matching ^} after it. Comments stripped by a tokenizer that
//                knows strings, templates and regex literals. Lines assigning `subtype` or
//                `phaseTag` are excluded (a subtype is a name, not a sentence: "Speed Run — …").
//                Asserts 0 lines containing "—" and 0 string literals matching letter-hyphen-letter.
//   T-<builder>  TABLE, one per builder: every entry the table sites in that builder has its new
//                text in the body exactly "@@ n" times, and its old text 0 times.
//   R-<fixture>  RUNTIME, one per fixture (HALF_MANNY, run_base, pace goal, bike, swim): no cardio
//                card's `note` or `detail` contains "—" or letter-hyphen-letter. EXEMPT: the
//                `detail` of NRC Speed Run cards (Nike-verbatim tables) and every `subtype`.
//
// SLICING. V206 lands D109 in slices: run builder (slice 2), NRC (slice 3), bike and swim
// (slice 4). Until a builder's slice lands its S, T and R rows are EXPECTED red.
//
// VERSION PREDICATE (standing ruling 4). D109 ships on ia-version 206. Below 206 every row prints
// its measured count as NOT APPLICABLE, never PASS. No env escape.
//
// Usage: node tests/gates/g206_d109_copy.js [artifact]   Prints PASS n FAIL n.
'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);
const VER = +IA.version;
const D109_ERA = 206;
const LIVE = VER >= D109_ERA;
const SRC = fs.readFileSync(ART, 'utf8');

let pass = 0, fail = 0, na = 0;
function row(label, cond, detail){
  const tail = detail ? ' (' + detail + ')' : '';
  if(!LIVE){ na++; console.log('NOT APPLICABLE ' + label + tail); return; }
  if(cond){ pass++; console.log('PASS ' + label + tail); }
  else { fail++; console.log('FAIL ' + label + tail); }
}
function summary(){
  console.log('\n' + (LIVE ? '' : 'ia-version ' + VER + ' predates D109 (V' + D109_ERA + '): '
    + na + ' rows NOT APPLICABLE\n') + 'PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}
console.log('g206 D109 copy sweep — artifact ia-version ' + VER + (LIVE ? '' : ' (below the D109 era)'));

// ── the copy rule, typed ─────────────────────────────────────────────────────
const EM = '—';
const HY = /[A-Za-z]-[A-Za-z]/;
const bad = s => { const t = String(s || ''); return t.indexOf(EM) >= 0 || HY.test(t); };

// ── builder bodies ───────────────────────────────────────────────────────────
const BUILDERS = { run:'buildRunSession', nrc:'buildNRCSession', bike:'buildBikeSession', swim:'buildSwimSession' };
function body(fn){
  const head = 'function ' + fn + '(';
  const n = SRC.split(head).length - 1;
  if(n !== 1) return { err: head + ' count=' + n };
  const a = SRC.indexOf(head);
  const re = /^\}/mg; re.lastIndex = a;
  const m = re.exec(SRC);
  if(!m) return { err: 'no ^} after ' + head };
  return { a, e: m.index + 1, text: SRC.slice(a, m.index + 1), line0: SRC.slice(0, a).split('\n').length };
}

// Tokenizer: returns the body with comments removed (newlines kept, so line numbers hold) and
// every string literal / template text chunk with the line it starts on.
const REGEX_PREV = '(,=:[!&|?{};+-*%<>~^';
const REGEX_WORDS = /(?:^|[^\w$])(return|typeof|case|in|of|new|delete|void|throw|else|do)$/;
function scan(t){
  let i = 0, line = 0, out = '';
  const lits = [];
  function lastSig(){ const s = out.replace(/\s+$/, ''); return s; }
  function readQuoted(q){
    const start = line; let s = ''; i++;
    while(i < t.length && t[i] !== q){
      if(t[i] === '\\'){ s += t[i] + (t[i+1] || ''); i += 2; continue; }
      if(t[i] === '\n') line++;
      s += t[i]; i++;
    }
    i++;
    lits.push({ line: start, text: s });
    out += q + s + q;
  }
  function readTemplate(){
    let start = line, s = ''; out += '`'; i++;
    while(i < t.length && t[i] !== '`'){
      if(t[i] === '\\'){ s += t[i] + (t[i+1] || ''); out += t[i] + (t[i+1] || ''); i += 2; continue; }
      if(t[i] === '$' && t[i+1] === '{'){
        lits.push({ line: start, text: s }); s = '';
        out += '${'; i += 2; code(true); out += '}'; i++; start = line; continue;
      }
      if(t[i] === '\n') line++;
      s += t[i]; out += t[i]; i++;
    }
    lits.push({ line: start, text: s }); out += '`'; i++;
  }
  function readRegex(){
    let inClass = false; out += '/'; i++;
    while(i < t.length){
      const c = t[i];
      if(c === '\\'){ out += c + (t[i+1] || ''); i += 2; continue; }
      if(c === '\n') break;
      if(c === '[') inClass = true; else if(c === ']') inClass = false;
      else if(c === '/' && !inClass){ out += c; i++; break; }
      out += c; i++;
    }
    while(i < t.length && /[a-z]/.test(t[i])){ out += t[i]; i++; }
  }
  function code(stopAtBrace){
    let depth = 0;
    while(i < t.length){
      const c = t[i], d = t[i+1];
      if(c === '/' && d === '/'){ while(i < t.length && t[i] !== '\n') i++; continue; }
      if(c === '/' && d === '*'){
        i += 2;
        while(i < t.length && !(t[i] === '*' && t[i+1] === '/')){ if(t[i] === '\n'){ line++; out += '\n'; } i++; }
        i += 2; continue;
      }
      if(c === "'" || c === '"'){ readQuoted(c); continue; }
      if(c === '`'){ readTemplate(); continue; }
      if(c === '/'){
        const s = lastSig(), p = s.slice(-1);
        if(!p || REGEX_PREV.indexOf(p) >= 0 || REGEX_WORDS.test(s)){ readRegex(); continue; }
      }
      if(c === '{') depth++;
      if(c === '}'){ if(stopAtBrace && depth === 0) return; depth--; }
      if(c === '\n') line++;
      out += c; i++;
    }
  }
  code(false);
  return { code: out, lits };
}
const ASSIGNS_NAME = /\b(subtype|phaseTag)\s*(\+?=(?!=)|:)/;

// ── coach's table ────────────────────────────────────────────────────────────
const TABLE = path.join(__dirname, '..', 'measure', 'v206_d109_table.txt');
const TABLE_SHA256 = '8dfe5e17e8b0bad0ca7838dc834030690afa9ceccb1f3ceb538ff4d2c9918894';
// Entry ranges per builder, from coach's grouping of the ruled table.
const TABLE_RANGE = { run:[1,22], nrc:[23,37], bike:[38,45], swim:[46,56] };
let ents = null, tableErr = '';
if(!fs.existsSync(TABLE)) tableErr = 'table file missing';
else {
  const raw = fs.readFileSync(TABLE);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if(sha !== TABLE_SHA256) tableErr = 'table sha256 ' + sha.slice(0, 12) + ' is not the ruled table';
  else {
    const L = raw.toString('utf8').split('\n'); if(L[L.length-1] === '') L.pop();
    ents = []; let k = 0;
    while(k < L.length){
      const m = /^@@ (\d+)$/.exec(L[k]); if(!m){ tableErr = 'bad header at table line ' + (k+1); ents = null; break; }
      const o = [], nw = []; k++;
      while(k < L.length && L[k] !== '--') o.push(L[k++]);
      k++;
      while(k < L.length && !/^@@ \d+$/.test(L[k])) nw.push(L[k++]);
      ents.push({ n: +m[1], old: o.join('\n'), neu: nw.join('\n') });
    }
    if(ents && ents.length !== 56){ tableErr = 'table parses to ' + ents.length + ' entries, want 56'; ents = null; }
  }
}

// ── SUPERSEDED ENTRIES (standing ruling 4) ───────────────────────────────────
// The table file is D109's ruled record and its sha256 stays pinned: it is never edited. A
// later ruling that rewrites a string the table sited supersedes that entry HERE, keyed on
// the ia-version the later ruling ships on, and only in the builder it names. Below the row's
// version the table text stands. At and above it the superseding text must sit in the body
// exactly "@@ n" times, and both older texts (the table's old AND its D109 new) 0 times.
// D103a (V208, coach-ruled) renamed the NSW run heads: "CHI:" is "LI:" and "INT:" is "SI:",
// bodies unchanged. Bike and swim keep CHI: and INT:, so no bike or swim entry moves for D103a.
// D110a (V212) supersedes swim entries 53, 54 and 55 (rows below).
// A row whose "was" is not the table's own new text is a named FAIL on that builder's T row:
// the table and the supersession would no longer describe the same string.
const TABLE_SUPERSEDED = [
  { from: 208, ruling: 'D103a', builder: 'run', entry: 20,
    was: 'CHI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.',
    now: 'LI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.' },
  { from: 208, ruling: 'D103a', builder: 'run', entry: 21,
    was: 'INT: Pace moves ${pp._weeklyGain} seconds per mile each week.',
    now: 'SI: Pace moves ${pp._weeklyGain} seconds per mile each week.' },
  { from: 208, ruling: 'D103a', builder: 'run', entry: 22,
    was: 'INT: Zone 5 (95%+ max HR) on work efforts.',
    now: 'SI: Zone 5 (95%+ max HR) on work efforts.' },
  // D110a (V212, coach-ruled) rewrites three swim INT notes: the dampened note quotes the
  // sizer's rate and a split the athlete is handed, and Guide A's cap of 8 intervals replaces
  // 10 on both rep notes. Swim keeps the INT: head (D103a renamed the run heads only). D144
  // (same build) names the goal through _goalPhrase ("1:20 for 100yd" on the 100 goal).
  { from: 212, ruling: 'D110a', builder: 'swim', entry: 53,
    was: 'INT: Split capped at +${swimPace._weeklyGain}s/100/week (safe progression limit). Full goal of ${fmt(swimPace._originalTarget)}/100 needs more time. The realistic target for this block is',
    now: 'INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. That is the safe rate for your experience and age. Your full goal of ${_goalPhrase} needs more weeks than this block has. The target for this block is' },
  { from: 212, ruling: 'D110a', builder: 'swim', entry: 54,
    was: 'INT: 100 repeats at your target split. Start at 4, build to 10. Hard cap at 10.',
    now: 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8.' },
  { from: 212, ruling: 'D110a', builder: 'swim', entry: 55,
    was: 'INT: 100 yard repeats. Start at 4, build to 10. Hard cap at 10.',
    now: 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8.' }
];
const SUP_BAD = {};
if(ents){
  for(const s of TABLE_SUPERSEDED){
    if(!(VER >= s.from)) continue;
    const e = ents[s.entry - 1], rg = TABLE_RANGE[s.builder];
    if(!e || !rg || s.entry < rg[0] || s.entry > rg[1] || e.neu !== s.was){
      (SUP_BAD[s.builder] = SUP_BAD[s.builder] || []).push('#' + s.entry + ' (' + s.ruling + ') supersedes text the table does not hold');
      continue;
    }
    ents[s.entry - 1] = { n: e.n, old: e.old, neu: s.now, gone: [s.was], by: s.ruling };
  }
}

// ── S and T rows ─────────────────────────────────────────────────────────────
for(const key of Object.keys(BUILDERS)){
  const fn = BUILDERS[key], b = body(fn);
  if(b.err){ row('S-' + key + ' ' + fn + ' body located', false, b.err); row('T-' + key + ' table text sited', false, b.err); continue; }
  const sc = scan(b.text);
  const lines = sc.code.split('\n');
  const skipLn = new Set(); lines.forEach((l, j) => { if(ASSIGNS_NAME.test(l)) skipLn.add(j); });
  const emLines = [], hyLits = [];
  lines.forEach((l, j) => { if(!skipLn.has(j) && l.indexOf(EM) >= 0) emLines.push(j); });
  sc.lits.forEach(x => { if(!skipLn.has(x.line) && HY.test(x.text)) hyLits.push(x); });
  const at = j => ':' + (b.line0 + j);
  const ex = []
    .concat(emLines.slice(0, 3).map(j => at(j) + ' |' + lines[j].trim().slice(0, 70) + '|'))
    .concat(hyLits.slice(0, 3).map(x => at(x.line) + ' "' + (x.text.match(/\S*[A-Za-z]-[A-Za-z]\S*/) || [''])[0] + '"'));
  row('S-' + key + ' ' + fn + ' (' + lines.length + ' lines, ' + sc.lits.length + ' literals, ' + skipLn.size
      + ' subtype/phaseTag lines excluded): 0 lines carry "—" and 0 literals carry letter-hyphen-letter',
    sc.lits.length > 0 && emLines.length === 0 && hyLits.length === 0,
    'em-dash lines ' + emLines.length + ', hyphenated literals ' + hyLits.length + (ex.length ? '; first: ' + ex.join(' ; ') : ''));

  if(!ents){ row('T-' + key + ' table text sited in ' + fn, false, tableErr); continue; }
  const [lo, hi] = TABLE_RANGE[key], tBad = [];
  let want = 0;
  for(let k = lo; k <= hi; k++){
    const e = ents[k-1];
    const nNew = b.text.split(e.neu).length - 1, nOld = b.text.split(e.old).length - 1;
    const nGone = (e.gone || []).reduce((a, g) => a + b.text.split(g).length - 1, 0);
    want += e.n;
    if(nNew !== e.n || nOld !== 0 || nGone !== 0)
      tBad.push('#' + k + (e.by ? ' (' + e.by + ')' : '') + ' new ' + nNew + '/' + e.n + ' old ' + nOld + (e.gone ? ' superseded ' + nGone : ''));
  }
  (SUP_BAD[key] || []).forEach(x => tBad.push(x));
  row('T-' + key + ' entries ' + lo + '-' + hi + ' of coach\'s table: each new text sits in ' + fn
      + ' exactly "@@ n" times and its old text 0 times (' + want + ' sites)',
    tBad.length === 0, tBad.length ? tBad.length + ' entries off; first: ' + tBad.slice(0, 4).join(', ') : '');
}

// ── R rows ───────────────────────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const clone = o => JSON.parse(JSON.stringify(o));
const BASE = { primaryPath:'goal', eventTargeted:false, liftingFocus:'support_prevention',
  experience:'intermediate', ageBracket:'18-35', equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:DAYS.slice(), bench:185, squat:255, deadlift:315, seed:76308 };
const FIX = [
  // Mario's own block (NRC half), the harness fixture.
  { tag:'HALF_MANNY', type:'run', cfg: clone(fixtures.HALF_MANNY) },
  // run_base, shape from g206_d137_runbase_chi.js (evented, 16 weeks, reaches taper and race week).
  { tag:'run_base', type:'run', cfg: Object.assign(clone(fixtures.HALF_MANNY), { name:'RB', primaryPath:'fitness',
      cardioGoals:{ run:{ id:'run_base', label:'Build Running Base', baselineDist:'0.1', baseline:'0.1mi' } },
      eventTargeted:true, raceDate:'2027-06-01', ageBracket:'55+' }) },
  // pace goal: PRT TING, the pinned cfg of g202_pace_copy.js (entered 8:15 mile, 10:30 over 1.5 mi).
  { tag:'pace_goal', type:'run', cfg: { name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
      eventTargeted:true, raceDate:'2026-10-19', liftingFocus:'support_prevention', experience:'intermediate',
      ageBracket:'18-35', equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
      bench:185, squat:245, deadlift:315, seed:24865,
      cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi', baselineDist:'3',
        baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30',
        mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{ kind:'entered' } } } } },
  // bike, shape from g205_bike_unmoved.js bikeCfg.
  { tag:'bike', type:'bike', cfg: Object.assign({ name:'B', cardioTypes:['bike'],
      cardioGoals:{ bike:{ id:'bike_50', label:'bike_50', baseline:'30 min', baselineDist:'30' } } }, clone(BASE)) },
  // swim, the swim_mile cfg of g205_chi_table6.js T12.
  { tag:'swim', type:'swim', cfg: Object.assign({ name:'S', cardioTypes:['swim'],
      cardioGoals:{ swim:{ id:'swim_mile', label:'Swim a Mile', baseline:'400 yd', baselineDist:'400' } } }, clone(BASE)) },
];
const isSpeed = c => /^Speed Run/.test(String(c.subtype || ''));
for(const f of FIX){
  let p = null, err = '';
  try { p = IA.buildProgram(clone(f.cfg)); } catch(e){ err = String(e && e.message || e); }
  if(!p){ row('R-' + f.tag + ' builds', false, err); continue; }
  let cards = 0, typed = 0, texts = 0, exempt = 0; const hits = [];
  Object.keys(p.weeks || {}).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d]; if(!day || !day.cardio) return;
    (Array.isArray(day.cardio) ? day.cardio : [day.cardio]).forEach(c => {
      if(!c) return; cards++; if(c.type === f.type) typed++;
      for(const fld of ['note','detail']){
        const v = c[fld]; if(v == null || v === '') continue;
        if(fld === 'detail' && isSpeed(c)){ exempt++; continue; }
        texts++;
        if(bad(v)){
          const s = String(v), k = s.indexOf(EM) >= 0 ? s.indexOf(EM) : s.search(HY);
          hits.push('W' + w + ' ' + d + ' ' + (c.subtype || c.type) + ' ' + fld + ' |…' + s.slice(Math.max(0, k - 30), k + 30) + '…|');
        }
      }
    });
  }));
  row('R-' + f.tag + ' (' + typed + ' ' + f.type + ' cards of ' + cards + ', ' + texts + ' note/detail texts audited, '
      + exempt + ' Speed Run details exempt): no note or detail carries "—" or letter-hyphen-letter',
    typed > 0 && texts > 0 && hits.length === 0,
    hits.length ? hits.length + ' texts; first: ' + hits.slice(0, 3).join(' ; ') : '');
}

summary();
