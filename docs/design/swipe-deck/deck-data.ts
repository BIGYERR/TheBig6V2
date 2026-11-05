// Builds the deck boards' day data from today's engine (HALF_MANNY, seed 76308): cards, swap candidates, the move list.
// Usage, from docs/design/swipe-deck: node deck-data.ts week10.json [boards], boards as KEY:week:day (default: week 10, Monday to Sunday).
import { writeFileSync } from 'node:fs';
import { fixtures, loadApp, pinClock } from '../../../tests/support/app.ts';

const X = loadApp() as any;
pinClock(X, '2026-11-01T10:00:00');
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const cfg = clone(fixtures.HALF_MANNY);
const P = X.buildProgram(clone(cfg));
if (JSON.stringify(P.weeks) !== JSON.stringify(X.buildProgram(clone(cfg)).weeks)) throw new Error('HALF_MANNY is not self-stable');
P.cfg = cfg;
const sc = X.eval('swapCandidates'), ax = X.eval('auxSwapCandidates'), af = X.eval('_auxFamily'), pat = X.eval('_pattern');
const strip = X.eval('_stripLeadingSets'), rxShort = X.eval('_rxShort'), FAM = X.eval('_AUX_FAMILY_LABEL');
const parseRx = X.eval('parseRx'), isW = X.eval('isTrackableWeight'), isKB = X.eval('isKBExercise');
const doseOf = X.eval('doseFromCardio'), codeOf = X.eval('runSessionCode');
const restCands = X.eval('restMoveCandidates'), restClash = X.eval('restMoveCollisions'), dayRegion = X.eval('_dayRegion'), restTip = X.eval('restDayTip');
X.window.activeProg = P; X.eval('activeProg = window.activeProg');
// The rest card: the rest hero's words, the tip of that calendar day, the sessions Training anyway? offers, and the clash
// each would make. The app's clash check looks at both neighbours of the rest day and keeps the day the session leaves;
// that day is a rest day once the move lands, so the deck drops it (flagged to Mario, not ruled).
function restCard(week: number, d: string) {
  const total = P.totalWeeks, race = Date.parse(cfg.raceDate + 'T12:00:00Z');
  const at = new Date(race + ((week - total) * 7 - (6 - DAYS.indexOf(d))) * 86400000).toISOString().slice(0, 10);
  pinClock(X, at + 'T10:00:00'); const tip = restTip(); pinClock(X, '2026-11-01T10:00:00');
  const cands = restCands(week).map((x: any) => {
    const src = P.weeks[week][x.day], hits = restClash(week, d, src).filter((h: any) => h.day !== x.day);
    const reg = dayRegion(src) || 'that';
    return { k: x.day, label: x.label, title: x.title, warn: hits.length ? { ttl: 'That’s ' + reg + ' on top of ' + reg, sub: 'You have ' + reg + ' work on ' + hits.map((h: any) => h.label).join(' and ') + ' too. Stack it here and something gives. Your call.' } : null };
  });
  return { kind: 'rest', c: C.REST, kicker: 'Rest day', title: 'Rest', rx: 'Recovery is where the work sets in. Move easy, refuel, sleep.', chips: [], date: at,
    types: (cfg.cardioTypes || ['run']).filter((t: string) => t !== 'walk').concat(['walk']), cands, tip };
}
// What the app's own parser and load checks give one movement's set rows: count, target (null when open), unit, a load box or not.
function rowsOf(name: string, detail: string) {
  const r = parseRx(detail, name);
  if (!r || !r.sets) return null;
  const yd = /^\d+\s*×\s*\d+\s*(?:yards?|yd)\b/.test(detail);
  return { n: r.sets, target: r.open ? null : (r.target != null ? r.target : null), unit: r.unit === 'sec' ? 'sec' : (yd ? 'yd' : ''), loaded: !!(isW(name) || isKB(name)), last: LAST[name] || null };
}
const TAG: Record<string, string> = { hinge: 'Hinge', squat: 'Squat', lunge: 'Lunge', hip_ext: 'Hip extension', row: 'Row', vpull: 'Vertical pull',
  hpress: 'Horizontal press', vpress: 'Vertical press', bi_iso: 'Biceps', tri_iso: 'Triceps', delt_iso: 'Delts', leg_iso: 'Leg isolation', calf_iso: 'Calves' };
const REGION: Record<string, string> = { push: 'Push day', pull: 'Pull day', legs: 'Leg day' };
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAYNAME: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const C = { LIFT: '#8F4A28', HIP: '#574068', CORE: '#6F5620', RUN: '#3F6236', REST: '#3B5266' };
// Sample loads, as the September boards carried (not anyone's log).
const LAST: Record<string, number> = { 'Deadlift': 155, 'Sumo deadlift': 155, 'Front squat': 115, 'Dumbbell row': 40, 'Barbell row': 95,
  'Suitcase carry': 53, 'Dumbbell split-stance calf raise': 30, 'Spanish squat hold (KB)': 35, 'Kettlebell swing': 35, 'Step-downs (KB)': 26,
  'Weighted 90/90 hip switch': 10, 'Single-leg KB pass-around': 18, 'Single-leg hip thrust': 45,
  'Back squat': 135, 'Incline barbell press': 95, 'Barbell overhead press': 65, 'Single-arm dumbbell bench press': 35,
  'Seated dumbbell shoulder press': 30, 'Dumbbell goblet side lunge': 30, 'Dumbbell split-stance deadlift': 40,
  'Dumbbell standing calf raise': 30, 'Farmer carry': 53, 'Landmine rotations': 25 };

function swapsFor(name: string, day: any, week: number, main: boolean) {
  const c = sc(name, day, week, P);
  const fam = !c.pattern ? af(name) : null;
  if (!c.pattern && !fam) return null;
  const tags = [fam ? FAM[fam] : (TAG[c.pattern] || 'Lift'), REGION[c.region] || 'Today'];
  if (main) tags.push('Main lift');
  return { tags, t1: fam ? ax(name, day, P) : c.tier1, t2: fam ? [] : c.tier2,
    sub: 'Still ' + (c.region || 'the same') + ' work. You give up the ' + (TAG[c.pattern] || 'lift').toLowerCase() + ' for today.' };
}
function setsOf(detail: string) {
  const m = String(detail).match(/^(\d+)\s*×\s*(\d+)(?:\s*[–-]\s*(\d+))?/);
  if (!m) return null;
  const unit = /^\d+\s*×\s*\d+(?:\s*[–-]\s*\d+)?\s*sec\b/.test(detail) ? 'sec' : (/^\d+\s*×\s*\d+(?:\s*[–-]\s*\d+)?\s*(?:yards?|yd)\b/.test(detail) ? 'yd' : '');
  return { sets: Array(+m[1]).fill(+(m[3] || m[2])), unit };
}
function mainRx(detail: string) {
  const rx = detail.split(' (')[0];
  const rest = (detail.match(/(\d+(?:–\d+)?) min rest/) || [])[1];
  const words: Record<string, string> = { '3': 'Three minutes rest.', '2–3': 'Two to three minutes rest.', '2': 'Two minutes rest.' };
  return { rx, cue: 'Leave about three reps in reserve. Ramp up with two or three warmup sets. ' + (rest ? words[rest] || rest + ' minutes rest.' : '') };
}
function restOf(detail: string, main: boolean) {
  const m = String(detail).match(/(\d+(?:–\d+)?) min rest/);
  if (m) return m[1] + ' min rest';
  const s = String(detail).match(/(\d+)\s*s(?:ec)? rest/);
  if (s) return s[1] + ' sec rest';
  return main ? '2–3 min rest' : '60–90 sec rest';
}
function setsPill(detail: string) {
  const n = (String(detail).match(/^(\d+)\s*(?:×|sets)/) || [])[1];
  return n ? n + ' sets' : null;
}
function chipsOf(detail: string) {
  const out: string[] = [];
  const s = setsOf(detail); const n = (String(detail).match(/^(\d+)\s*(?:×|sets)/) || [])[1];
  if (n) out.push(n + ' sets');
  if (/RPE 7/.test(detail)) out.push('RPE 7');
  if (/\beach\b/.test(detail) && out.length < 2) out.push('each side');
  if (s && s.unit === 'sec' && out.length < 2) out.push(s.sets[0] + ' sec');
  return out;
}
function runCard(day: any) {
  const cd = day.cardio; const lines = String(cd.detail).split('\n');
  const head = lines[0]; const [left, right] = head.split(' — ');
  let title = left, rx = right || '';
  let extra: string[] = [];
  if (/ at /.test(left)) { title = left.split(' at ')[0]; rx = 'at ' + left.split(' at ').slice(1).join(' at ') + (right ? ' — ' + right : ''); }
  if (/\. /.test(rx)) { const parts = rx.split(/(?<=\.) /); rx = parts[0]!.replace(/\.$/, ''); extra = parts.slice(1); }
  else if (!right && /, /.test(left)) { title = left.split(', ')[0]; rx = left.split(', ').slice(1).join(', '); }
  const short = String(cd.subtype).split(' — ').pop() as string;
  const dose = right ? right.replace(/ of work$/, ' work') : ((title.match(/^(\d+ min)/) || [])[1] || '');
  const rd = doseOf(cd) || null;
  const log = { sport: cd.type || 'run', dose: rd, code: codeOf(cd.subtype || '', rd && rd.key, cd.type || 'run'), speedHint: /speed run/i.test(cd.subtype || '') };
  return { kind: 'run', c: C.RUN, kicker: cd.subtype, title, rx, chips: dose ? [dose] : [], log,
    lines: extra.concat(lines.slice(1)), note: String(cd.note || '').replace(/^[A-Z][A-Z ]+:\s*/, ''), word: short === 'Intervals' ? 'the intervals session' : 'the ' + short.toLowerCase() };
}
function moveList(week: number, from: string, runWord: string, hard: boolean) {
  const wk = P.weeks[week];
  const lr = DAYS.find((d) => wk[d] && wk[d].cardio && /^Long Run/.test(wk[d].cardio.subtype));
  const lrLabel = lr ? String(wk[lr].cardio.detail).split(':')[0] : 'the long run';
  const Word = runWord[0]!.toUpperCase() + runWord.slice(1);
  const out: any[] = [];
  DAYS.forEach((d, k) => {
    if (k <= DAYS.indexOf(from)) return;
    const day = wk[d]; const name = DAYNAME[d] + ' · ' + (day.rest ? 'Rest' : day.title);
    const main = ((day.sections || [])[0] || {}).label || '';
    const run = day.cardio && !day.rest ? day.cardio : null;
    const runName = run ? String(run.subtype).split(' — ').pop()!.toLowerCase() : '';
    const mins = run ? (String(run.detail).match(/^(\d+) min/) || [])[1] : '';
    const after = !!lr && DAYS[DAYS.indexOf(lr) + 1] === d;
    if (d === lr) { out.push({ k: d, name, tone: 'off', note: 'Your long run. Not offered.' }); return; }
    if (lr && DAYS[k + 1] === lr) {
      out.push(hard
        ? { k: d, name, tone: 'bad', note: 'Eve of your long run. ' + DAYNAME[lr] + "'s " + lrLabel + ' starts on tired legs.', effect: DAYNAME[d] + ' gets ' + runWord + (run ? ' and its easy run drops' : '') + '. Hard running the day before the long run.' }
        : { k: d, name, tone: 'warn', note: 'Eve of your long run. Keep it very easy, or leave it.', effect: DAYNAME[d] + (run ? ' runs twice' : ' gets ' + runWord) + ', the day before the ' + lrLabel + '.' });
      return;
    }
    if (day.rest) {
      if (after && !hard) { out.push({ k: d, name, tone: 'good', note: 'The day after your long run. Easy miles help here.', effect: DAYNAME[d] + ' gets ' + runWord + '. ' + DAYNAME[from] + ' is lifting only.' }); return; }
      const nextRest = DAYS.slice(k + 1).find((x) => wk[x] && wk[x].rest);
      out.push({ k: d, name, tone: 'warn', note: after ? 'The day after your long run. Legs still cooked.' : 'Your midweek rest goes. No rest day until ' + (nextRest ? DAYNAME[nextRest] : 'next week') + '.',
        effect: DAYNAME[d] + ' stops being a rest day. ' + DAYNAME[from] + ' is lifting only.' });
      return;
    }
    if (run) {
      out.push(hard
        ? { k: d, name, tone: 'warn', note: 'Already has ' + (mins ? 'a ' + mins + ' min ' + runName : 'the ' + runName) + '. ' + Word + ' takes its place.', effect: DAYNAME[d] + ' becomes the hard run. Its easy one drops.' }
        : { k: d, name, tone: 'warn', note: 'Already has ' + (mins ? 'a ' + mins + ' min ' + runName : 'the ' + runName) + '. Two runs that day.', effect: DAYNAME[d] + ' runs twice. ' + DAYNAME[from] + ' is lifting only.' });
      return;
    }
    const lift = main.replace(/^Main — /, '').toLowerCase();
    const heavy = /squat|deadlift|lunge/i.test(main);
    out.push(hard
      ? { k: d, name, tone: heavy ? 'good' : 'warn', note: heavy ? 'Good fit. Pairs with your ' + lift + '. Hard day stays hard.' : 'Nothing clashes, but it stacks a hard run on a lifting day.', effect: DAYNAME[d] + ' is ' + lift + ' and ' + runWord + '. ' + DAYNAME[from] + ' is lifting only.' }
      : { k: d, name, tone: 'good', note: 'Fine. An easy run fits after the lifts.', effect: DAYNAME[d] + ' is ' + lift + ' and ' + runWord + '. ' + DAYNAME[from] + ' is lifting only.' });
  });
  return out;
}
function board(week: number, d: string) {
  const day = P.weeks[week][d];
  const cards: any[] = []; const swaps: Record<string, any> = {};
  if (day.rest) return { head: { dayLine: 'Week ' + week + ' · ' + DAYNAME[d] + ' · THE HALF MANNY', title: 'Rest day', day: DAYNAME[d] }, cards: [restCard(week, d)], swaps, runIdx: -1, runWord: '', week: [] };
  const put = (n: string, main: boolean) => { const s = swapsFor(n, day, week, main); if (s) swaps[n] = s; };
  (day.sections || []).forEach((s: any) => {
    const items = s.items || [];
    const isMain = /^main/i.test(s.label || '');
    if (/mobility/i.test(s.label || '') && !isMain && !s.superset) {
      // Post-run mobility is a cool down, not a circuit: one tap per move, no sets, no pills, and a name that does not
      // repeat the day's (Mario 2026-11-03: the Mobility kicker over Post-run mobility read twice).
      const secs = items.reduce((t: number, it: any) => {
        const h = String(it.detail).match(/^(\d+)\s*×\s*(\d+)\s*sec(\s+each side)?/), m = String(it.detail).match(/(\d+)\s*min/);
        return t + (h ? +h[1]! * +h[2]! * (h[3] ? 2 : 1) : (m ? +m[1]! * 60 : 0));
      }, 0);
      const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
      cards.push({ kind: 'block', c: C.HIP, kicker: 'After the run', title: 'Stretch and roll', mobility: true,
        rx: (WORDS[items.length] || String(items.length)) + ' easy moves, about ' + Math.round(secs / 60) + ' minutes. Take your time.', chips: [],
        members: items.map((it: any) => ({ name: it.name, detail: it.detail, straight: it.detail, keeps: rxShort(it.detail), log: null })) });
      return;
    }
    if (s.core || s.hip) {
      const label = s.core ? String(s.coreHeader || 'Core') : s.label;
      items.forEach((it: any) => put(it.name, false));
      cards.push({ kind: 'block', c: s.core ? C.CORE : C.HIP, kicker: s.core ? 'Core' : 'Prehab', title: s.core ? label.replace(/^Core — /, '') : label,
        rx: 'One block, straight through', chips: [setsPill(items[0].detail), '60–90 sec rest'].filter(Boolean),
        members: items.map((it: any) => ({ name: it.name, detail: it.detail, straight: it.detail, keeps: rxShort(it.detail), log: rowsOf(it.name, it.detail) })) });
      return;
    }
    if (s.superset && items.length > 1) {
      items.forEach((it: any) => put(it.name, false));
      const r = s.rounds;
      cards.push({ kind: 'round', c: C.LIFT, kicker: 'Round', title: s.label, rounds: r,
        rx: r ? r + ' rounds, no rest inside · ' + (r <= 2 ? 90 : 60) + ' sec between rounds' : s.label, chips: r ? [r + ' rounds', (r <= 2 ? 90 : 60) + ' sec rest'] : [],
        members: items.map((it: any) => ({ name: it.name, detail: strip(it.detail).replace(/^\d+(\s*[–-]\s*\d+)?$/, '$& reps'), straight: it.detail, keeps: rxShort(it.detail), log: rowsOf(it.name, it.detail) })) });
      return;
    }
    items.forEach((it: any, k: number) => {
      const main = isMain && k === 0;
      put(it.name, main);
      const lg = rowsOf(it.name, it.detail);
      const m = main ? mainRx(it.detail) : { rx: it.detail, cue: '' };
      cards.push({ kind: 'lift', c: C.LIFT, kicker: main ? 'Main' : (isMain ? 'Main, second lift' : s.label), title: it.name, main,
        rx: m.rx, cue: m.cue, chips: [setsPill(it.detail), restOf(it.detail, main)].filter(Boolean), sets: lg ? Array(lg.n).fill(lg.target) : null, unit: lg ? lg.unit : '', loaded: lg ? lg.loaded : false, last: LAST[it.name] || null, keeps: rxShort(it.detail) });
    });
  });
  let runIdx = -1, week7: any[] = [], runWord = '';
  if (day.cardio && !day.rest) {
    // The app's order (openDetail, V123): lift first only when lifting is the priority. On an event path or a support
    // focus the run is the point of the block and keeps the top slot.
    const runFirst = (day.sections || []).length > 0 && (cfg.primaryPath === 'event' || /^support_/.test(String(cfg.liftingFocus || '')));
    const rc = runCard(day); runWord = rc.word;
    if (runFirst) { runIdx = 0; cards.unshift(rc); } else { runIdx = cards.length; cards.push(rc); }
    week7 = moveList(week, d, runWord, /Speed|Tempo|Intervals|Hills|Long/.test(String(day.cardio.subtype)));
  }
  cards.push({ kind: 'finish', c: 'var(--finish)', kicker: 'Finish', title: 'Call it', rx: 'How did the whole thing feel?', chips: [] });
  return { head: { dayLine: 'Week ' + week + ' · ' + DAYNAME[d] + ' · THE HALF MANNY', title: day.title, day: DAYNAME[d] }, cards, swaps, runIdx, runWord, week: week7 };
}
const which = (process.argv[3] || 'M:10:mon,T:10:tue,W:10:wed,H:10:thu,F:10:fri,S:10:sat,U:10:sun').split(',').map((x) => x.split(':'));
const out: Record<string, any> = {};
for (const [k, w, d] of which) out[k] = board(+w!, d!);
writeFileSync(process.argv[2]!, JSON.stringify(out, null, 1));
for (const [k, b] of Object.entries(out)) console.log(k, b.head.title, b.cards.map((c: any) => c.kind + ':' + c.title).join(' | '), 'run', b.runIdx, 'swaps', Object.keys(b.swaps).length, 'week', b.week.map((w: any) => w.k + ':' + w.tone).join(' '));
