// g223_d182_racedate.js — GATE for D182 (P-RACEDATE): the race date is parsed once, and the countdown is live.
//
//   node tests/gates/g223_d182_racedate.js <candidate.html>
//   IA_ASSUME_VERSION=223 node tests/gates/g223_d182_racedate.js <tree stamped 222>   (discrimination run only)
//
// THE RULING THIS DEFENDS: tests/measure/v223_rulings/p_racedate_ruling.md, sections (i), (ii), (iii), (v), "After",
// "Blast radius (for gatekeeper)" and "D182 AMENDMENT (a)" ((iv) WITHDRAWN; the mile sheet at 0 and below reads
// "Days out | Race day" / "Days out | Behind you" with the "Race day | Sun, Dec 6, 2026" row kept; the wizard review
// row prints "(behind you)" past the race). D-code D182, ships on ia-version 223.
//
// TIMEZONE. The harness passes the host clock and TZ through ("harness pins TZ? NO"), so a gate that does not set TZ
// passes on a UTC box while the phone is wrong. This file is a PARENT that spawns itself twice, once under
// TZ=America/New_York and once under TZ=UTC, and sums the two children. Every row is printed once per zone, tagged
// [NY] or [UTC]. A child that dies or prints no CHILD summary is a named FAIL, never a silent zero.
//
// CLOCK. Each cell pins the VM clock (Date() with no argument, and Date.now) to local noon of a typed date, the g222
// pin. Dated constructors (new Date(y, m, d), new Date('YYYY-MM-DD')) are untouched, so the old UTC parse still
// shows its old day.
//
// ORACLES. Never asked of the engine (no _fmtStartDay, _parseLocalDate, raceCountdown, toLocaleDateString):
//   the date string "Sun, Dec 6, 2026" is built here from y/m/d integers: weekday by Sakamoto's algorithm, month
//   from a typed table, cross-checked (Z1) against a typed weekday table and a second hand algorithm (days from civil);
//   day counts are integer days-from-civil differences, cross-checked (Z1) against the ruling's printed numbers
//   (75, 97, 16, 119, 82);
//   the Time out state table is typed row by row from the ruling's (ii) table and the amendment's review phrases.
//
// VERSION PREDICATE (standing rulings 2 and 4). D182 ships at 223.
//   below 223      REFUSED, every row FAILS by name.
//   223 and up     every row asserts, in both zones.
//   IA_ASSUME_VERSION=223 lifts a file stamped exactly 222 to 223 for a discrimination run. It is announced, and it
//   is ignored on any file not stamped exactly 222. gate.sh never sets it.
//
// ROWS (each printed once under [NY] and once under [UTC])
//   Z0   CONTROL  the child's zone is the one asked for (NY observes 2027-03-14; UTC has offset 0).
//   Z1   CONTROL  the hand oracle agrees with itself, with a typed weekday table and with the ruling's day counts.
//   Z2   CONTROL  the clock pin reaches the VM.
//   Z3   CONTROL  a program with no race date: card "No date set", no Time out row, copy "Event: no date".
//   R1a  Programs card "Race date" = hand date string, 10 race dates (weekday, month ends, both DST days, leap day).
//   R1b  copy text "Event:" line date = hand date string, same 10 dates.
//   R1c  mile lock sheet "Race day" = hand date string, same 10 dates.
//   R1d  wizard review "Race date" row date = hand date string, same 10 dates.
//   R2a  card "Time out" state table: weeks, "1 week", days, "1 day", "Race day", "Behind you", across DST, and a
//        D106a test goal with a date.
//   R2b  copy text "(N weeks out)" / "(6 days out)" / "(race day)" / "(behind you)", same table.
//   R2c  mile lock sheet "Days out": the day count while days >= 1, "Race day" at 0, "Behind you" below.
//   R2d  wizard review phrase "(N weeks away)" / "(6 days away)" / "(race day)" / "(behind you)".
//   R3   raceAlignment weeksOut = floor(round(days)/7) across the spring-forward (explicit todayIso and pinned clock).
//        [NY] discriminates (V222's raw floor loses a week); [UTC] is a CONTROL (no DST, the raw floor is right).
//   R4   nothing stored is read: cfg.raceDateWeeks / p.raceDateWeeks set to a wrong number, a moved race with a stale
//        top-level raceDate, and WD.raceDateWeeks = 99 on the review: every surface prints the live countdown.
// Every non-CONTROL row FAILS on V222 (IA_ASSUME_VERSION=223 base_v222.html) and PASSES on the D182 tree.
'use strict';
const path = require('path'), cp = require('child_process');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 223;
const ZONES = [['NY', 'America/New_York'], ['UTC', 'UTC']];

const ROWS = {
  Z0: 'Z0 CONTROL: the child runs in the zone the parent asked for',
  Z1: 'Z1 CONTROL: the hand date oracle agrees with a typed weekday table, a second algorithm and the ruling\'s day counts',
  Z2: 'Z2 CONTROL: the pinned clock reaches the VM',
  Z3: 'Z3 CONTROL: no race date: card "No date set", no Time out row, copy "Event: no date"',
  R1a: 'R1a Programs card "Race date" prints the hand date string (weekday, month, day, year) for 10 race dates',
  R1b: 'R1b copy text "Event:" line prints the hand date string for the same 10 race dates',
  R1c: 'R1c mile lock sheet "Race day" row prints the hand date string for the same 10 race dates',
  R1d: 'R1d wizard review "Race date" row prints the hand date string for the same 10 race dates',
  R2a: 'R2a card "Time out" is the live countdown: weeks, 1 week, days, 1 day, Race day, Behind you (13 cells + a D106a test goal)',
  R2b: 'R2b copy text countdown words: (N weeks out) (1 week out) (6 days out) (1 day out) (race day) (behind you)',
  R2c: 'R2c mile lock sheet "Days out": the day count while days >= 1, "Race day" at 0, "Behind you" below',
  R2d: 'R2d wizard review phrase: (N weeks away) (6 days away) (1 day away) (race day) (behind you)',
  R3: 'R3 raceAlignment weeksOut = floor(round(days)/7) across the 2027-03-14 spring-forward (8 cells)',
  R4: 'R4 nothing stored is read: wrong cfg/p raceDateWeeks, a moved race with a stale top-level raceDate, WD.raceDateWeeks 99',
};
const ROW_KEYS = Object.keys(ROWS);
const isControl = (key, tag) => /^Z/.test(key) || (key === 'R3' && tag === 'UTC');

// ═════════════════════════════════════════════ PARENT ═════════════════════════════════════════════
if(!process.env.G223_ZONE){
  let pass = 0, fail = 0;
  const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
  const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };
  let STAMP = NaN;
  try { STAMP = +H.load(ART).version; } catch(e){ ok('boot: the candidate loads in the harness', false, e.message); done(); }
  let VER = STAMP;
  if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
    VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
  }
  console.log('g223 D182 racedate | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));
  if(!(VER >= ERA)){
    console.log('REFUSED: ia-version ' + VER + ' predates D182 P-RACEDATE (V' + ERA + '). No row may pass on it.');
    for(const [tag] of ZONES) for(const k of ROW_KEYS) ok('[' + tag + '] ' + ROWS[k] + ' (REFUSED)', false);
    done();
  }
  for(const [tag, tz] of ZONES){
    console.log('\n-- TZ=' + tz + ' [' + tag + '] --');
    const r = cp.spawnSync(process.execPath, [__filename, ART], { env: Object.assign({}, process.env, { TZ: tz, G223_ZONE: tag }), encoding: 'utf8', maxBuffer: 1 << 26 });
    const out = r.stdout || '';
    for(const line of out.split('\n')){
      const m = /^(PASS|FAIL) (\[(\w+)\] (\w+) .*)$/.exec(line);
      if(m){ if(m[3] === tag && ROWS[m[4]]) (m[1] === 'PASS' ? pass++ : fail++); console.log(line); }
      else if(line.trim() && !/^CHILD /.test(line)) console.log('  ' + line);
    }
    if(r.stderr && r.stderr.trim()) console.log('  stderr: ' + r.stderr.trim().split('\n').slice(-4).join(' | '));
    const s = /^CHILD (\w+) PASS (\d+) FAIL (\d+)\s*$/m.exec(out);
    const seen = ROW_KEYS.filter(k => new RegExp('^(PASS|FAIL) \\[' + tag + '\\] ' + k + ' ', 'm').test(out));
    ok('[' + tag + '] child under TZ=' + tz + ' ran every row and printed its CHILD summary (exit ' + r.status + ')',
       !!s && s[1] === tag && seen.length === ROW_KEYS.length && +s[2] + +s[3] === ROW_KEYS.length,
       (s ? s[0] : 'no CHILD summary') + '; rows seen ' + seen.length + '/' + ROW_KEYS.length);
  }
  done();
}

// ═════════════════════════════════════════════ CHILD ══════════════════════════════════════════════
const TAG = process.env.G223_ZONE;
let cpass = 0, cfail = 0;
function row(key, bad, total, note){
  const label = '[' + TAG + '] ' + ROWS[key] + (isControl(key, TAG) && key === 'R3' ? ' (CONTROL under UTC: no DST, the V222 raw floor is right here)' : '');
  const good = bad.length === 0 && total > 0;
  if(good){ cpass++; console.log('PASS ' + label + ' (' + total + '/' + total + ' cells' + (note ? '; ' + note : '') + ')'); }
  else { cfail++; console.log('FAIL ' + label + ' (' + (total - bad.length) + '/' + total + ' cells; ' + bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ' | +' + (bad.length - 4) + ' more' : '') + ')'); }
}

// ── the hand oracle: integers only ────────────────────────────────────────────────────────────────
const WD3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ymd = s => s.split('-').map(Number);
function sakamoto(y, m, d){ const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]; if(m < 3) y -= 1; return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7; }
function civ(y, m, d){   // days from 1970-01-01, Hinnant's days_from_civil
  y -= m <= 2 ? 1 : 0; const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy - 719468;
}
function fromCiv(z){     // Hinnant's civil_from_days
  z += 719468; const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)), mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return (yoe + era * 400 + (m <= 2 ? 1 : 0)) + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}
const civI = s => civ(...ymd(s));
const handDate = s => { const [y, m, d] = ymd(s); return WD3[sakamoto(y, m, d)] + ', ' + MON3[m - 1] + ' ' + d + ', ' + y; };
const daysBetween = (fromIso, toIso) => civI(toIso) - civI(fromIso);

// Typed weekday table (checked by hand from 2026-01-01 = Thu), and the ruling's printed day counts.
const WEEKDAY_TABLE = { '2026-12-06':'Sun', '2026-12-05':'Sat', '2026-11-01':'Sun', '2026-12-31':'Thu', '2027-01-01':'Fri',
  '2027-03-14':'Sun', '2027-03-15':'Mon', '2027-06-30':'Wed', '2028-02-29':'Tue', '2026-10-10':'Sat', '2026-09-22':'Tue',
  '2026-11-16':'Mon', '2026-08-31':'Mon' };
const RULING_DAYS = [['2026-09-22', '2026-12-06', 75], ['2026-08-31', '2026-12-06', 97], ['2026-11-20', '2026-12-06', 16],
  ['2026-11-16', '2027-03-15', 119], ['2026-09-22', '2026-12-13', 82]];
const RACE_DATES = ['2026-12-06', '2026-12-05', '2026-11-01', '2026-12-31', '2027-01-01', '2027-03-14', '2027-03-15', '2027-06-30', '2028-02-29', '2026-10-10'];

// The Time out state table, typed from the ruling's (ii) table and the amendment's review phrases.
const STATE = [
  { clock:'2026-08-31', race:'2026-12-06', days:97,  card:'13 weeks',   copy:'13 weeks out', sheet:'97',         review:'13 weeks away' },
  { clock:'2026-09-22', race:'2026-12-06', days:75,  card:'10 weeks',   copy:'10 weeks out', sheet:'75',         review:'10 weeks away' },
  { clock:'2026-11-20', race:'2026-12-06', days:16,  card:'2 weeks',    copy:'2 weeks out',  sheet:'16',         review:'2 weeks away' },
  { clock:'2026-11-29', race:'2026-12-06', days:7,   card:'1 week',     copy:'1 week out',   sheet:'7',          review:'1 week away' },
  { clock:'2026-11-30', race:'2026-12-06', days:6,   card:'6 days',     copy:'6 days out',   sheet:'6',          review:'6 days away' },
  { clock:'2026-12-05', race:'2026-12-06', days:1,   card:'1 day',      copy:'1 day out',    sheet:'1',          review:'1 day away' },
  { clock:'2026-12-06', race:'2026-12-06', days:0,   card:'Race day',   copy:'race day',     sheet:'Race day',   review:'race day' },
  { clock:'2026-12-07', race:'2026-12-06', days:-1,  card:'Behind you', copy:'behind you',   sheet:'Behind you', review:'behind you' },
  { clock:'2026-12-20', race:'2026-12-06', days:-14, card:'Behind you', copy:'behind you',   sheet:'Behind you', review:'behind you' },
  { clock:'2026-11-16', race:'2027-03-15', days:119, card:'17 weeks',   copy:'17 weeks out', sheet:'119',        review:'17 weeks away' },  // spans spring-forward
  { clock:'2027-03-08', race:'2027-03-15', days:7,   card:'1 week',     copy:'1 week out',   sheet:'7',          review:'1 week away' },    // spans spring-forward
  { clock:'2027-03-07', race:'2027-03-14', days:7,   card:'1 week',     copy:'1 week out',   sheet:'7',          review:'1 week away' },    // race on the spring-forward day
  { clock:'2026-11-01', race:'2026-11-08', days:7,   card:'1 week',     copy:'1 week out',   sheet:'7',          review:'1 week away' },    // fall-back day
];
// raceAlignment lattice: [today, race, goal, weeksOut by hand = floor(days/7)]
const ALIGN = [
  ['2026-11-16', '2027-03-15', 'run_half', 17], ['2027-03-08', '2027-03-15', 'run_5k', 1], ['2027-03-01', '2027-03-15', 'run_10k', 2],
  ['2027-02-15', '2027-03-15', 'run_half', 4], ['2026-11-16', '2027-03-14', 'run_marathon', 16], ['2026-09-22', '2026-12-06', 'run_half', 10],
  ['2026-10-25', '2026-11-08', 'run_half', 2],
];

// ── the VM: one per child, a registry DOM, a movable clock ────────────────────────────────────────
const IA = H.load(ART);
const doc = IA.window.document, reg = new Map(), baseGet = doc.getElementById;
doc.getElementById = function(id){
  if(!reg.has(id)){
    const el = baseGet.call(doc, id); el.id = id; const cls = new Set();
    el.classList = { add: c => cls.add(c), remove: c => cls.delete(c), toggle: (c, f) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)), contains: c => cls.has(c) };
    reg.set(id, el);
  }
  return reg.get(id);
};
IA.eval('showToast = function(){}');
const RD = Date;
function pin(iso){ const [y, m, d] = ymd(iso); const T = new RD(y, m - 1, d, 12, 0, 0).getTime();
  class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const clone = v => JSON.parse(JSON.stringify(v));
const cfgOf = over => Object.assign(clone(H.fixtures.HALF_MANNY), over || {});
const kv = html => { const out = {}; const re = /<span class="(?:k|summary-key)">([^<]*)<\/span><span class="(?:v|summary-val)"[^>]*>([^<]*)<\/span>/g; let m;
  while((m = re.exec(String(html)))){ (out[m[1]] = out[m[1]] || []).push(m[2]); } return out; };
const one = (o, k) => (o[k] && o[k].length === 1) ? o[k][0] : (o[k] ? 'x' + o[k].length + ':' + o[k].join('/') : null);
const tryDo = f => { try { return f(); } catch(e){ return { crash: e.message }; } };

function card(p){ return tryDo(() => { const o = kv(IA.eval('progDetailHTML')(p)); return { race: one(o, 'Race date'), out: one(o, 'Time out') }; }); }
function copyLine(p){ return tryDo(() => { const l = IA.eval('progSelLines')(p).filter(x => /^Event: /.test(x)); return l.length === 1 ? l[0] : 'x' + l.length; }); }
function sheet(cfg, clockIso){
  return tryDo(() => {
    const c = civI(clockIso), mon = c - ((sakamoto(...ymd(clockIso)) + 6) % 7);   // Monday of the clock's week, by hand
    const p = { id:'g223P', name:'THE HALF MANNY', totalWeeks:14, startDate: fromCiv(mon - 91), cfg };   // week 14 of 14: locked
    reg.clear(); IA.localStorage.setItem('ia_programs', JSON.stringify([p]));
    IA.eval('openMileSheet')('g223P');
    if(!doc.getElementById('mileLockOverlay').classList.contains('open')) return { crash: 'lock sheet did not open' };
    const o = kv(doc.getElementById('mileLockBody').innerHTML); return { out: one(o, 'Days out'), race: one(o, 'Race day') };
  });
}
function review(raceIso, clockIso, extra){
  return tryDo(() => {
    const wd = Object.assign({ primaryPath:'event', cardioTypes:['run'], cardioGoals:{ run:{ id:'run_half', label:'Half Marathon', mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } },
      eventTargeted:true, raceDate:raceIso, liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
      restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, name:'THE HALF MANNY', startDate:clockIso }, extra || {});
    reg.clear(); IA.eval('WD = ' + JSON.stringify(wd) + '; wizardStep = WIZARD_STEPS.indexOf("name"); renderWizardStep();');
    const v = one(kv(doc.getElementById('wizardBody').innerHTML), 'Race date');
    const m = /^(.*?)(?: \(([^()]*)\))?$/.exec(v || ''); return { raw: v, date: m ? m[1] : null, phrase: m && m[2] !== undefined ? m[2] : null };
  });
}
const progOf = (cfg, extra) => Object.assign({ id:'g223C', name:'THE HALF MANNY', totalWeeks:14, startDate:'2026-08-31', cfg }, extra || {});
const eventParts = l => { const m = /^Event: (.*?)(?: \(([^()]*)\))?$/.exec(typeof l === 'string' ? l : ''); return m ? { date: m[1], words: m[2] === undefined ? null : m[2] } : { date: null, words: null }; };
const J = v => JSON.stringify(v);

// ── Z0 zone ──
{ const off = (y, m, d) => new RD(y, m - 1, d, 12).getTimezoneOffset();
  const bad = [];
  if(TAG === 'NY'){ if(!(off(2027, 3, 13) === 300 && off(2027, 3, 15) === 240)) bad.push('NY offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15) + ' (want 300/240)'); }
  else if(!(off(2027, 3, 13) === 0 && off(2027, 3, 15) === 0)) bad.push('UTC offsets ' + off(2027, 3, 13) + '/' + off(2027, 3, 15) + ' (want 0/0)');
  row('Z0', bad, 1, 'TZ=' + process.env.TZ); }
// ── Z1 hand oracle ──
{ const bad = []; let n = 0;
  for(const [iso, w] of Object.entries(WEEKDAY_TABLE)){ n++; const [y, m, d] = ymd(iso);
    if(WD3[sakamoto(y, m, d)] !== w || WD3[((civ(y, m, d) % 7) + 11) % 7] !== w || fromCiv(civ(y, m, d)) !== iso) bad.push(iso + ' ' + WD3[sakamoto(y, m, d)] + '/' + w); }
  for(const [a, b, want] of RULING_DAYS){ n++; if(daysBetween(a, b) !== want) bad.push(a + '->' + b + ' ' + daysBetween(a, b) + '/' + want); }
  for(const s of STATE){ n++; if(daysBetween(s.clock, s.race) !== s.days) bad.push('STATE ' + s.clock + '->' + s.race + ' ' + daysBetween(s.clock, s.race) + '/' + s.days); }
  for(const [t, r, , w] of ALIGN){ n++; if(Math.floor(daysBetween(t, r) / 7) !== w) bad.push('ALIGN ' + t + '->' + r); }
  n++; if(handDate('2026-12-06') !== 'Sun, Dec 6, 2026') bad.push('handDate(2026-12-06) ' + handDate('2026-12-06'));
  row('Z1', bad, n); }
// ── Z2 clock pin ──
{ const bad = []; for(const s of ['2026-09-22', '2026-12-06', '2027-03-14']){ pin(s);
    const got = IA.eval('(function(){ const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })()');
    if(got !== s) bad.push(s + ' read ' + got); }
  row('Z2', bad, 3); }
// ── Z3 no race date ──
{ pin('2026-09-22'); const cfg = cfgOf(); delete cfg.raceDate; const p = progOf(cfg);
  const c = card(p), l = copyLine(p), bad = [];
  if(c.crash || c.race !== 'No date set' || c.out !== null) bad.push('card ' + J(c));
  if(l !== 'Event: no date') bad.push('copy ' + J(l));
  row('Z3', bad, 2); }

// ── R1 four surfaces, one hand date string ──
{ const b = { a: [], b: [], c: [], d: [] };
  pin('2026-09-22');
  for(const r of RACE_DATES){
    const want = handDate(r), p = progOf(cfgOf({ raceDate: r }));
    const c = card(p); if(c.crash || c.race !== want) b.a.push(r + ' ' + J(c.crash || c.race) + ' want ' + J(want));
    const e = eventParts(copyLine(p)); if(e.date !== want) b.b.push(r + ' ' + J(e.date) + ' want ' + J(want));
    const s = sheet(cfgOf({ raceDate: r }), '2026-09-22'); if(s.crash || s.race !== want) b.c.push(r + ' ' + J(s.crash || s.race) + ' want ' + J(want));
    const v = review(r, '2026-09-22'); if(v.crash || v.date !== want) b.d.push(r + ' ' + J(v.crash || v.raw) + ' want ' + J(want));
  }
  row('R1a', b.a, RACE_DATES.length); row('R1b', b.b, RACE_DATES.length); row('R1c', b.c, RACE_DATES.length); row('R1d', b.d, RACE_DATES.length);
}

// ── R2 the Time out state table, movable clock ──
{ const b = { a: [], b: [], c: [], d: [] };
  for(const s of STATE){
    pin(s.clock); const p = progOf(cfgOf({ raceDate: s.race })), tag = s.clock + '->' + s.race;
    const c = card(p); if(c.crash || c.out !== s.card) b.a.push(tag + ' ' + J(c.crash || c.out) + ' want ' + J(s.card));
    const e = eventParts(copyLine(p)); if(e.words !== s.copy) b.b.push(tag + ' ' + J(e.words) + ' want ' + J(s.copy));
    const sh = sheet(cfgOf({ raceDate: s.race }), s.clock); if(sh.crash || sh.out !== s.sheet) b.c.push(tag + ' ' + J(sh.crash || sh.out) + ' want ' + J(s.sheet));
    const v = review(s.race, s.clock); if(v.crash || v.phrase !== s.review) b.d.push(tag + ' ' + J(v.crash || v.raw) + ' want (' + s.review + ')');
  }
  // D106a: a test goal carrying a date has no NRC alignment and its card counts down too (ruling (ii)).
  pin('2026-09-22');
  const tg = progOf(cfgOf({ raceDate:'2026-12-06', cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal', mileBestMins:'8', mileBestSecs:'15',
    targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } }, _raceDateCappedWeeks:11 }));
  const tc = card(tg); if(tc.crash || tc.out !== '10 weeks') b.a.push('D106a test goal ' + J(tc.crash || tc.out) + ' want "10 weeks"');
  const te = eventParts(copyLine(tg)); if(te.words !== '10 weeks out') b.b.push('D106a test goal ' + J(te.words) + ' want "10 weeks out"');
  row('R2a', b.a, STATE.length + 1); row('R2b', b.b, STATE.length + 1); row('R2c', b.c, STATE.length); row('R2d', b.d, STATE.length);
}

// ── R3 raceAlignment weeksOut across the spring-forward ──
{ const bad = []; const ra = IA.eval('raceAlignment');
  for(const [t, r, g, w] of ALIGN){ const a = tryDo(() => ra(g, r, true, t)); const got = a && a.weeksOut;
    if(!a || a.crash || got !== w) bad.push(t + '->' + r + ' ' + g + ' ' + J(a && a.crash || got) + ' want ' + w); }
  pin('2026-11-16'); const a = tryDo(() => ra('run_half', '2027-03-15', true));   // the wizard's call shape: no todayIso, the clock
  if(!a || a.crash || a.weeksOut !== 17) bad.push('pinned clock 2026-11-16->2027-03-15 ' + J(a && a.crash || a && a.weeksOut) + ' want 17');
  row('R3', bad, ALIGN.length + 1); }

// ── R4 nothing stored is read ──
{ const bad = []; pin('2026-09-22');
  const p1 = progOf(cfgOf({ raceDateWeeks: 3 }), { raceDateWeeks: 3 });
  const c1 = card(p1); if(c1.crash || c1.out !== '10 weeks') bad.push('raceDateWeeks 3: card ' + J(c1.crash || c1.out) + ' want "10 weeks"');
  const l1 = copyLine(p1); if(l1 !== 'Event: Sun, Dec 6, 2026 (10 weeks out)') bad.push('raceDateWeeks 3: copy ' + J(l1));
  const p2 = progOf(cfgOf({ raceDate:'2026-12-13', raceDateWeeks:13 }), { raceDate:'2026-12-06', raceDateWeeks:13 });   // after setProgRace(2026-12-13)
  const c2 = card(p2); if(c2.crash || c2.race !== 'Sun, Dec 13, 2026' || c2.out !== '11 weeks') bad.push('moved race: card ' + J(c2) + ' want Sun, Dec 13, 2026 / 11 weeks');
  const l2 = copyLine(p2); if(l2 !== 'Event: Sun, Dec 13, 2026 (11 weeks out)') bad.push('moved race: copy ' + J(l2));
  const s1 = sheet(cfgOf({ raceDateWeeks: 3 }), '2026-09-22'); if(s1.crash || s1.out !== '75') bad.push('raceDateWeeks 3: sheet ' + J(s1.crash || s1.out) + ' want "75"');
  const v1 = review('2026-12-06', '2026-09-22', { raceDateWeeks: 99 }); if(v1.crash || v1.raw !== 'Sun, Dec 6, 2026 (10 weeks away)') bad.push('WD.raceDateWeeks 99: review ' + J(v1.crash || v1.raw));
  row('R4', bad, 6); }

console.log('CHILD ' + TAG + ' PASS ' + cpass + ' FAIL ' + cfail);
