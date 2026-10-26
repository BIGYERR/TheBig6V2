// Lattice claims shared by an integration file (a seeded sample that runs in the 60-second check) and a sweep file
// (the whole lattice, CI only; tests/sweeps/README.md). Each function returns its tests as [name, body] pairs over the
// lattice it is handed, and the test file registers them, so the sample and the sweep assert exactly the same claims
// and differ only in size.
//
// The oracles here are typed by hand, never read from the app:
//   * the NRC pace chart, doctrine/nikerunclub5k.txt page 8 (mile, 5K, 10K, half and marathon average paces in s/mi;
//     the 12:00 row's half 14:05 = 845 and marathon 13:45 = 825 invert, the only row that does);
//   * the ruled reading of a chart row at a goal distance (D100, amended): columns at their true distances in miles,
//     log interpolation between the bracketing columns, a running maximum across the columns in distance order, and
//     a clamp to the table's own bounds;
//   * the experience defaults 690/570/450 s/mi (V176, D9), the planning rate {beginner 3, intermediate 3, advanced 2}
//     s/mi/wk (D187, Mario's T1 ruling) scaled by age {18-35 1.0, 36-54 0.85, 55+ 0.65} (D101), and 0.621 mi per km.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Program } from '@ia/core';
import type { App } from './app.ts';
import { clone, runSessions } from './pace-clock.ts';

/** A test the caller registers: its name and its body. */
export type LatticeTest = [name: string, body: () => void];
/** A chart row in s/mi: mile, fiveK, tenK, half, marathon. */
export type ChartRow = Record<string, number>;

export const HAND = {
  EXP_DEFAULT: { beginner: 690, intermediate: 570, advanced: 450 } as Record<string, number>,
  EXP_IMPROVE: { beginner: 3, intermediate: 3, advanced: 2 } as Record<string, number>,
  AGE_SCALE: { '18-35': 1.0, '36-54': 0.85, '55+': 0.65 } as Record<string, number>,
  MI_PER_KM: 0.621,
  COLS: [{ d: 1, k: 'mile' }, { d: 3.107, k: 'fiveK' }, { d: 6.214, k: 'tenK' }, { d: 13.109, k: 'half' }, { d: 26.219, k: 'marathon' }],
  CHART: [
    // mile fiveK tenK half marathon
    [300, 330, 345, 360, 375], [330, 360, 375, 390, 410], [360, 390, 405, 435, 445],
    [390, 425, 440, 455, 480], [420, 460, 475, 500, 515], [450, 485, 505, 525, 550],
    [480, 520, 540, 570, 585], [510, 550, 570, 595, 615], [540, 580, 600, 640, 650],
    [570, 615, 635, 665, 685], [600, 640, 665, 705, 720], [630, 675, 695, 730, 755],
    [660, 700, 720, 775, 780], [690, 735, 755, 795, 800], [720, 760, 785, 845, 825],
  ].map((r): ChartRow => ({ mile: r[0]!, fiveK: r[1]!, tenK: r[2]!, half: r[3]!, marathon: r[4]! })),
};
export const secs = (mm: string | number, ss: string | number): number => +mm * 60 + +ss;
export const miles = (dist: string | number, unit: string): number => (unit === 'km' ? +dist * HAND.MI_PER_KM : +dist);
/** A full chart row from a mile time, interpolated linearly between the bracketing rows and rounded, clamped at the ends. */
export function handRow(mileSec: number): ChartRow {
  const R = HAND.CHART;
  const K = ['mile', 'fiveK', 'tenK', 'half', 'marathon'];
  const first = R[0]!;
  const last = R[R.length - 1]!;
  if (mileSec <= first['mile']!) return { ...first };
  if (mileSec >= last['mile']!) return { ...last };
  for (let i = 0; i < R.length - 1; i++) {
    const lo = R[i]!;
    const hi = R[i + 1]!;
    if (mileSec >= lo['mile']! && mileSec <= hi['mile']!) {
      const f = (mileSec - lo['mile']!) / (hi['mile']! - lo['mile']!);
      const o: ChartRow = {};
      for (const k of K) o[k] = Math.round(lo[k]! + (hi[k]! - lo[k]!) * f);
      return o;
    }
  }
  return { ...last };
}
/** A row read at a distance in miles: running maximum, log interpolation, clamps (D100). */
export function handRowPaceAt(row: ChartRow, distMiles: number): number {
  let run = -Infinity;
  const v = HAND.COLS.map((c) => {
    run = Math.max(run, +row[c.k]!);
    return { d: c.d, p: run };
  });
  const d = +distMiles;
  const first = v[0]!;
  const last = v[v.length - 1]!;
  if (!(d > 0) || d <= first.d) return first.p;
  if (d >= last.d) return last.p;
  for (let i = 0; i < v.length - 1; i++) {
    const a = v[i]!;
    const b = v[i + 1]!;
    if (d >= a.d && d <= b.d) {
      const f = (Math.log(d) - Math.log(a.d)) / (Math.log(b.d) - Math.log(a.d));
      return a.p + (b.p - a.p) * f;
    }
  }
  return last.p;
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** Mario's "PRT TING" pace-goal cfg: an event-targeted athlete, race 2026-10-19, seed 24865, full gym. */
export const prtTing = (over?: Record<string, any>): Record<string, any> =>
  Object.assign(
    {
      name: 'PRT TING', primaryPath: 'event', cardioTypes: ['run'], eventTargeted: true, raceDate: '2026-10-19',
      liftingFocus: 'support_prevention', experience: 'intermediate', ageBracket: '18-35', equipment: 'full_gym', unit: 'lbs',
      restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 185, squat: 245, deadlift: 315, seed: 24865,
    },
    over || {},
  );
export const paceGoal = (g: Record<string, any>, over?: Record<string, any>): Record<string, any> =>
  prtTing(Object.assign({ cardioGoals: { run: Object.assign({ id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', paceUnit: 'mi', baselineDist: '3', baseline: '3mi' }, g) } }, over || {}));

/** The pace progression a build produced, as buildRunProgressionForLength publishes it. */
export interface Progression {
  arr: number[];
  dampened: boolean;
  gain: number;
  real: number;
  orig: number;
  ip: number;
  tp: number;
}
/**
 * The pace progression the build just produced. buildRunSession leaves the anchor, target and rate it computed on
 * buildRunProgressionForLength's statics; re-running that function with the same arguments reads the array they give.
 * Call it right after the build it describes.
 */
export function progression(IA: App, prog: Program | any, cfg: Record<string, any>): Progression {
  const bm = parseFloat(cfg['cardioGoals'].run.baselineDist) || 1.5;
  return JSON.parse(
    IA.eval(`(function(){
      const p = buildRunProgressionForLength('run_pace_goal', ${prog.totalWeeks}, ${bm}, '${cfg['experience']}', true).paceProgression;
      return JSON.stringify({ arr: Array.from(p), dampened: p._dampened, gain: p._weeklyGain, real: p._realisticTarget, orig: p._originalTarget,
        ip: buildRunProgressionForLength._initialPace, tp: buildRunProgressionForLength._targetPace }); })()`),
  );
}

/** A pace-goal lattice: experience x age x unit x entered mile x entered goal. */
export interface AnchorLattice {
  exps: string[];
  ages: string[];
  units: string[];
  miles: [string, string][];
  goals: { targetDist: string; targetMins: string; targetSecs: string }[];
}
interface AnchorRow {
  exp: string;
  age: string;
  unit: string;
  mb: [string, string];
  goal: Record<string, any>;
  prog: any;
  pp: Progression;
  d: number;
  handIP: number;
  handMileCol: number;
  handTarget: number;
  met: boolean;
}
function anchorRows(IA: App, lattice: AnchorLattice): AnchorRow[] {
  const rows: AnchorRow[] = [];
  for (const exp of lattice.exps)
    for (const age of lattice.ages)
      for (const unit of lattice.units)
        for (const mb of lattice.miles)
          for (const g of lattice.goals) {
            const goal = Object.assign({ paceUnit: unit, mileBestMins: mb[0], mileBestSecs: mb[1] }, g, { targetTime: g.targetMins + ':' + g.targetSecs });
            const cfg = paceGoal(goal, { experience: exp, ageBracket: age });
            const prog = IA.buildProgram(clone(cfg));
            const pp = progression(IA, prog, cfg);
            const d = miles(g.targetDist, unit);
            const handIP = handRowPaceAt(handRow(secs(mb[0], mb[1])), d);
            const handTarget = secs(g.targetMins, g.targetSecs) / d;
            rows.push({ exp, age, unit, mb, goal, prog, pp, d, handIP, handMileCol: handRow(secs(mb[0], mb[1]))['mile']!, handTarget, met: handTarget >= handIP });
          }
  return rows;
}

export const E12 = 'Your goal pace is already within your current pace. This block holds your pace and builds your reps.';
const SI = /Short Interval \(SI\)/;
const tag = (r: AnchorRow): string => `${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} goal ${r.goal['targetDist']}${r.unit} ${r.goal['targetMins']}:${r.goal['targetSecs']}`;

/** The pace clock's anchor, target and rate over a lattice (D100 amended, D101, D187, E7, E12). `label` names the lattice. */
function anchorLatticeCases(IA: App, label: string, lattice: AnchorLattice): LatticeTest[] {
  let rows: AnchorRow[] | undefined;
  const all = (): AnchorRow[] => rows || (rows = anchorRows(IA, lattice));
  return [
    [`${label}: the anchor is the athlete's own chart row read at the goal distance, beginners included`, () => {
      const bad = all().filter((r) => Math.abs(r.pp.ip - r.handIP) > 1e-9).map((r) => `${tag(r)} got ${r.pp.ip} want ${r.handIP.toFixed(4)}`);
      assert.deepEqual(bad.slice(0, 3), []);
      // A beginner never sits on the 690 row when he typed a faster mile (D188).
      const on690 = all().filter((r) => r.exp === 'beginner' && secs(r.mb[0], r.mb[1]) < 690 && Math.abs(r.pp.ip - handRowPaceAt(handRow(690), r.d)) < 1e-9);
      assert.deepEqual(on690.map(tag), []);
    }],
    [`${label}: no build falls back to its experience default row while a mile time is on file`, () => {
      const bad = all().filter((r) => {
        const dflt = handRowPaceAt(handRow(HAND.EXP_DEFAULT[r.exp]!), r.d);
        return Math.abs(r.handIP - dflt) > 1e-9 && Math.abs(r.pp.ip - dflt) < 1e-9;
      });
      assert.deepEqual(bad.map(tag), []);
    }],
    [`${label}: at or below a mile the anchor is the mile column; past a mile it is strictly slower`, () => {
      const short = all().filter((r) => r.d <= 1);
      const long = all().filter((r) => r.d > 1);
      assert.ok(short.length > 0 && long.length > 0, `both sides are in the lattice (${short.length} at or below a mile, ${long.length} past it)`);
      assert.deepEqual(short.filter((r) => Math.abs(r.pp.ip - r.handMileCol) > 1e-9).map(tag), []);
      assert.deepEqual(long.filter((r) => r.pp.ip <= r.handMileCol + 1e-9).map(tag), []);
    }],
    [`${label}: the target is the entered time over the entered distance, km converted once at 0.621`, () => {
      const bad = all().filter((r) => Math.abs(r.pp.tp - r.handTarget) > 1e-6).map((r) => `${tag(r)} got ${r.pp.tp}`);
      assert.deepEqual(bad.slice(0, 3), []);
    }],
    [`${label}: the block is sized and paced on one number (paceGoalTarget equals the progression's target)`, () => {
      assert.equal(IA.eval('typeof paceGoalTarget'), 'function');
      const bad = all().filter((r) => {
        const s = JSON.parse(IA.eval(`JSON.stringify(paceGoalTarget(${JSON.stringify(r.goal)}))`));
        return Math.abs(s.tDist - r.d) > 1e-9 || Math.abs(s.tPacePerMile - r.handTarget) > 1e-6 || Math.abs(s.tPacePerMile - r.pp.tp) > 1e-9;
      });
      assert.deepEqual(bad.map(tag).slice(0, 3), []);
    }],
    [`${label}: no build improves faster than the age-scaled rate, and every dampened build improves at exactly that rate`, () => {
      const over: string[] = [];
      const dampBad: string[] = [];
      let damp = 0;
      for (const r of all()) {
        // _weeklyGain is published at one decimal, so the hand rate is compared at one decimal too.
        const cap = +(HAND.EXP_IMPROVE[r.exp]! * HAND.AGE_SCALE[r.age]!).toFixed(2);
        if (r.pp.gain > +cap.toFixed(1) + 1e-9) over.push(`${tag(r)} gain ${r.pp.gain} > ${cap}`);
        if (r.pp.dampened) {
          damp++;
          if (Math.abs(r.pp.gain - cap) > 0.051) dampBad.push(`${tag(r)} gain ${r.pp.gain} cap ${cap}`);
        }
      }
      assert.deepEqual(over.slice(0, 3), []);
      assert.deepEqual(dampBad.slice(0, 3), []);
      assert.ok(damp > 0, `the dampened branch is exercised (${damp} builds)`);
      assert.ok(new Set(all().map((r) => r.pp.gain)).size > 1, 'the rate varies with experience and age');
    }],
    [`${label}: an improving block starts at the anchor and falls by the weekly rate, never past the realistic target`, () => {
      const bad: string[] = [];
      const improving = all().filter((r) => !r.met);
      assert.ok(improving.length > 0, 'the lattice has improving builds');
      for (const r of improving) {
        const a = r.pp.arr;
        if (a[0] !== +r.pp.ip.toFixed(1)) bad.push(`${tag(r)} week 1 is ${a[0]}, not the anchor`);
        for (let i = 1; i < a.length; i++) {
          const prev = a[i - 1]!;
          const cur = a[i]!;
          if (cur > prev + 1e-9) { bad.push(`${tag(r)} week ${i + 1} regresses`); break; }
          if (cur < r.pp.real - 1e-9) { bad.push(`${tag(r)} week ${i + 1} passes the realistic target`); break; }
          // Entries are published at one decimal, so a 1.95 s/mi/wk rate steps 1.9 and 2.0; one rounding unit of slack.
          const step = +(prev - cur).toFixed(1);
          if (step > 1e-9 && Math.abs(step - r.pp.gain) > 0.11) { bad.push(`${tag(r)} week ${i + 1} step ${step} != ${r.pp.gain}`); break; }
        }
      }
      assert.deepEqual(bad.slice(0, 3), []);
    }],
    [`${label}: a goal at or slower than the athlete's own pace holds the anchor all block, undampened, the entered goal kept`, () => {
      const met = all().filter((r) => r.met);
      assert.ok(met.length > 0, 'the lattice has goal-met builds');
      const flat = met.filter((r) => new Set(r.pp.arr).size !== 1 || r.pp.arr.some((v) => Math.abs(v - +r.handIP.toFixed(1)) > 1e-9));
      assert.deepEqual(flat.map((r) => `${tag(r)} [${r.pp.arr.join(' ')}] want ${r.handIP.toFixed(1)}`).slice(0, 3), []);
      assert.deepEqual(met.filter((r) => r.pp.dampened !== false).map(tag), [], 'nothing in this class is dampened');
      assert.deepEqual(met.filter((r) => Math.abs(r.pp.orig - +r.handTarget.toFixed(1)) > 0.06).map(tag), [], '_originalTarget is the entered goal');
    }],
    [`${label}: every non-cutback interval week of a goal-met block reads the ruled sentence verbatim, with no dash`, () => {
      let seen = 0;
      const bad: string[] = [];
      for (const r of all().filter((x) => x.met)) {
        for (const { w, s } of runSessions(r.prog)) {
          if (!SI.test(String(s.subtype || '')) || /^CUTBACK WEEK:/.test(String(s.note || ''))) continue;
          if (s.note === E12) seen++;
          else if (bad.length < 3) bad.push(`${tag(r)} W${w} reads ${String(s.note || '').slice(0, 80)}`);
        }
      }
      assert.deepEqual(bad, []);
      assert.ok(seen > 0, 'the sentence appears');
      assert.doesNotMatch(E12, /\s[—–-]\s/, 'the ruled sentence carries no mid-sentence dash');
    }],
  ];
}

// D2b-iii (V142, re-sited V202 S1): an athlete back from injury must be told why this week's target is not the
// calendar's. The sentence is about the SHIFT, so it appends to whichever interval note fires (goal met, dampened or
// on schedule), once, as the tail, and to none when the shift is zero. Typed from coach's ruling.
const APPENDIX = ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';
/** The class a zero-shift interval note belongs to, by its opening words (only to prove every class is reached). */
function limbOf(n: string): 'cutback' | 'goalMet' | 'dampened' | 'neither' {
  if (/^CUTBACK WEEK/.test(n)) return 'cutback';
  if (/already within your current pace/.test(n)) return 'goalMet';
  if (/Pace moves \d+ seconds per mile/.test(n)) return 'dampened';
  return 'neither';
}

/** An appendix lattice: mile x distance x goal time x level. */
export interface AppendixLattice {
  exps: string[];
  miles: [string, string][];
  dists: string[];
  times: [string, string][];
}
/**
 * The appendix over a lattice of pace goals, plus one cfg on schedule (an 8:15 mile and a 1 mi goal of 8:14: a 1 s/mi
 * gap clears the rate), so all three classes are reached. Every cfg is built with no shift and with a two week shift
 * on every week.
 */
function appendixLatticeCases(IA: App, label: string, lattice: AppendixLattice): LatticeTest[] {
  return [
    [`${label}: an injury pace shift appends the PACE CLOCK sentence once, as the tail, to every interval note in every class; no shift, no sentence`, () => {
      const cfgs: Record<string, any>[] = [];
      for (const mb of lattice.miles)
        for (const dist of lattice.dists)
          for (const tt of lattice.times)
            for (const exp of lattice.exps)
              cfgs.push(paceGoal({ targetDist: dist, targetMins: tt[0], targetSecs: tt[1], targetTime: tt.join(':'), mileBestMins: mb[0], mileBestSecs: mb[1], mileBestSrc: { kind: 'entered' } }, { experience: exp }));
      cfgs.push(paceGoal({ targetDist: '1', targetMins: '8', targetSecs: '14', targetTime: '8:14', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' } }));
      const shift: Record<number, number> = {};
      for (let i = 1; i <= 30; i++) shift[i] = 2;
      const intNotes = (cfg: Record<string, any>) =>
        runSessions(IA.buildProgram(clone(cfg)))
          .filter((r) => SI.test(String(r.s.subtype || '')))
          .map((r) => ({ w: r.w, note: String(r.s.note || '') }));
      const classes = { goalMet: 0, dampened: 0, neither: 0, cutback: 0 };
      const bad: Record<string, string[]> = { missing: [], zero: [], double: [], tail: [] };
      for (const cfg of cfgs) {
        const zero = intNotes(cfg);
        const sh = intNotes(Object.assign({}, cfg, { _paceShift: shift }));
        for (const n of zero) if (n.note.includes('PACE CLOCK')) bad['zero']!.push(`W${n.w}`);
        for (let i = 0; i < sh.length; i++) {
          const k = limbOf((zero[i] || { note: '' }).note);
          classes[k]++;
          const { w, note: n } = sh[i]!;
          const hits = n.split('PACE CLOCK:').length - 1;
          if (hits === 0) bad['missing']!.push(`${k} W${w}`);
          if (hits > 1) bad['double']!.push(`${k} W${w}`);
          if (hits === 1 && !n.endsWith(APPENDIX)) bad['tail']!.push(`${k} W${w}: ${n.slice(-40)}`);
        }
      }
      assert.ok(classes.goalMet > 0 && classes.dampened > 0 && classes.neither > 0, `all three classes are reached: ${JSON.stringify(classes)}`);
      const first = (o: Record<string, string[]>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.slice(0, 3)]));
      assert.deepEqual(first(bad), { missing: [], zero: [], double: [], tail: [] });
    }],
  ];
}

// ── The beginner's mile (D188): a beginner may enter a mile and every engine read uses it ──
// The chart rows typed from doctrine/nikerunclub5k.txt page 8: the 12:00 row (:160) is mile 12:00, 5K 12:40, 10K 13:05,
// tempo 13:35, recovery 14:30. A 13:00 mile (780 s) is slower than the chart's slowest row (720 s), so it reads 12:00.
export const ROW_1200: Record<string, string> = { Mile: '12:00', '5K': '12:40', '10K': '13:05', Tempo: '13:35', Recovery: '14:30' };
const RACE_GOALS = new Set(['run_5k', 'run_10k', 'run_half', 'run_marathon']);
/** The D188 lattice cfg: hybrid (event for a race goal, raced 2027-01-31), balanced, crossfit, rest Sunday and Wednesday. */
export function mileCfg(goal: string, exp: string, seed: number, mileSec: number, tgt?: [string, string]): Record<string, any> {
  const g: Record<string, any> = { id: goal, label: goal, baselineDist: '', baseline: '' };
  if (goal === 'run_pace_goal') Object.assign(g, { targetDist: '1.5', targetMins: tgt ? tgt[0] : '12', targetSecs: tgt ? tgt[1] : '0' });
  if (mileSec) Object.assign(g, { mileBestMins: String(Math.floor(mileSec / 60)), mileBestSecs: String(mileSec % 60), mileBestSrc: { kind: 'entered' } });
  const c: Record<string, any> = {
    name: 'G226', primaryPath: RACE_GOALS.has(goal) ? 'event' : 'hybrid', cardioTypes: ['run'], cardioGoals: { run: g },
    liftingFocus: 'balanced', experience: exp, ageBracket: '18-35', equipment: 'crossfit', unit: 'lbs',
    restDays: ['sun', 'wed'], days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed,
  };
  if (RACE_GOALS.has(goal)) Object.assign(c, { eventTargeted: true, raceDate: '2027-01-31' });
  return c;
}
/** Week 1's run cards, Monday to Sunday. */
export function w1Runs(p: any, wk = 1): { d: string; st: string; detail: string }[] {
  const out: { d: string; st: string; detail: string }[] = [];
  const w = (p && p.weeks && (p.weeks[String(wk)] || p.weeks[wk])) || {};
  for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
    const day = w[d];
    if (!day || day.rest) continue;
    for (const c of [].concat(day.cardio || []) as any[]) if (c && c.type === 'run') out.push({ d, st: c.subtype || '', detail: String(c.detail || '') });
  }
  return out;
}
const paceToks = (s: string): string[] => s.match(/\d{1,2}:\d\d\/mi/g) || [];
const tokSig = (p: any): string => JSON.stringify(w1Runs(p).map((c) => [c.d, c.st, paceToks(c.detail)]));
function labeled(s: string): [string, string][] {
  const out: [string, string][] = [];
  const re = /\b(Mile|5K|10K|Tempo|Recovery) Pace:? \(?(\d{1,2}:\d\d)\/mi/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push([m[1]!, m[2]!]);
  return out;
}
const clk = (s: number): string => {
  const t = Math.round(s);
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};

/** D188's engine reads over `seeds` (the sweep runs 20 seeds, 1000 + 37 i; a sample runs a few). */
function beginnerMileLatticeCases(IA: App, progDigest: (p: any) => string, label: string, seeds: number[]): LatticeTest[] {
  const build = (cfg: Record<string, any>) => IA.buildProgram(clone(cfg));
  const out: LatticeTest[] = [];
  for (const goal of ['run_5k', 'run_half']) {
    // Weeks 1 and 2: since D252 (v0.248.0) the half's week 1 speed day is the 21:00 fartlek, which prints no pace, so
    // the 5K Pace label it carried moved to week 2's 5K reps.
    out.push([`${label}: a beginner's 13:00 mile on ${goal} prints every week 1 and 2 labelled pace off the 12:00 chart row, 5K and Recovery included`, () => {
      for (const s of seeds) {
        const p = build(mileCfg(goal, 'beginner', s, 780));
        const labs = ([] as [string, string][]).concat(...w1Runs(p).concat(w1Runs(p, 2)).filter((c) => /^Speed Run|^Recovery Run|^Long Run/.test(c.st)).map((c) => labeled(c.detail)));
        assert.deepEqual(labs.filter(([k, v]) => ROW_1200[k] !== v), [], `seed ${s}`);
        assert.ok(labs.some(([k]) => k === '5K') && labs.some(([k]) => k === 'Recovery'), `seed ${s}: 5K and Recovery are on the week`);
      }
    }]);
  }
  out.push([`${label}: a beginner's 13:00 mile on run_base prints the 12:00 row's recovery, 14:30, as the easy run's Around pace`, () => {
    for (const s of seeds) {
      const arounds = w1Runs(build(mileCfg('run_base', 'beginner', s, 780))).map((c) => (/Around (\d{1,2}:\d\d)\/mi/.exec(c.detail) || [])[1]).filter(Boolean);
      assert.ok(arounds.length > 0, `seed ${s}: an Around pace`);
      assert.deepEqual([...new Set(arounds)], [ROW_1200['Recovery']], `seed ${s}`);
    }
  }]);
  out.push([`${label}: a beginner's 13:00 mile on a 1.5 mi pace goal prints week 1's short intervals at 11:58/mi off a 12:14/mi goal pace`, () => {
    // The 12:00 row: mile 720, 5K 760. Read at 1.5 mi (D100): 720 + 40 x ln 1.5 / ln 3.107 = 734.31 s = 12:14 (goal pace).
    // Guide A (physicaltrainingguide2020.txt:251): 4 s per 400 m = 16 s/mi faster: 718.31 s = 11:58.
    const gp = 720 + (40 * Math.log(1.5)) / Math.log(3.107);
    assert.equal(clk(gp), '12:14');
    assert.equal(clk(gp - 16), '11:58');
    let cells = 0;
    for (const tgt of [['12', '0'], ['13', '30']] as [string, string][])
      for (const rest of [['sun', 'wed'], ['sat', 'sun']])
        for (const s of seeds) {
          const si = w1Runs(build(Object.assign(mileCfg('run_pace_goal', 'beginner', s, 780, tgt), { restDays: rest }))).filter((c) => c.detail.includes('4x400m at'));
          assert.ok(si.length > 0, `${tgt.join(':')} ${rest.join('/')} seed ${s}: a "4x400m at" card in week 1`);
          for (const c of si) {
            assert.ok(c.detail.includes('4x400m at 11:58/mi') && c.detail.includes('goal pace is 12:14/mi'), c.detail.slice(0, 160));
          }
          cells++;
        }
    assert.ok(cells > 0);
  }]);
  for (const goal of ['run_pace_goal', 'run_5k', 'run_half', 'run_base']) {
    out.push([`${label}: a beginner with a 9:00 mile on ${goal} paces week 1 exactly as an intermediate with the same mile and seed`, () => {
      for (const s of seeds) {
        const beg = tokSig(build(mileCfg(goal, 'beginner', s, 540)));
        assert.notEqual(beg, '[]', `seed ${s}: week 1 has run cards`);
        assert.equal(beg, tokSig(build(mileCfg(goal, 'intermediate', s, 540))), `seed ${s}`);
      }
    }]);
  }
  out.push([`${label}: a beginner with no mile builds the same program twice on every run goal`, () => {
    for (const goal of ['run_pace_goal', 'run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base'])
      for (const s of seeds) {
        const cfg = mileCfg(goal, 'beginner', s, 0);
        assert.equal(progDigest(build(cfg)), progDigest(build(cfg)), `${goal} seed ${s}`);
      }
  }]);
  return out;
}

// ── The default disclosure (D189 S1): a guessed pace says so on the first paced run card of week 1 ──
export const DEF_MILE: Record<string, string> = { beginner: '11:30', intermediate: '9:30', advanced: '7:30' }; // 690, 570, 450 s by hand
export const ART_OF: Record<string, string> = { beginner: 'an', intermediate: 'a', advanced: 'a' }; // an 11:30, a 9:30, a 7:30
export const S1 = (e: string): string =>
  `Paces here start from ${ART_OF[e]} ${DEF_MILE[e]} mile, the ${e} default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.`;
const S1_STEM = 'Paces here start from ';
const D189_GOALS = ['run_5k', 'run_10k', 'run_half', 'run_marathon', 'run_base', 'run_pace_goal'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
/** The D189 lattice cfg: hybrid, undated, balanced, crossfit, 18-35. */
export function discloseCfg(goal: string, exp: string, mile: number, seed: number, rest: string[], src?: Record<string, any>): Record<string, any> {
  const g: Record<string, any> = { id: goal, label: goal, baselineDist: '', baseline: '' };
  if (goal === 'run_pace_goal') Object.assign(g, { targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0' });
  if (mile) Object.assign(g, { mileBestMins: String(Math.floor(mile / 60)), mileBestSecs: String(mile % 60), mileBestSrc: src || { kind: 'entered' } });
  return {
    name: 'M', primaryPath: 'hybrid', cardioTypes: ['run'], cardioGoals: { run: g }, liftingFocus: 'balanced', experience: exp, ageBracket: '18-35',
    equipment: 'crossfit', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), eventTargeted: false, raceDate: '', seed,
  };
}
export const countS1 = (prog: unknown): number => JSON.stringify(prog).split(S1_STEM).length - 1;
/** Week 1's first paced run card, Monday to Sunday: a run whose detail prints m:ss/mi and is no race day, time trial or benchmark. */
function firstPaced(prog: any): { d: string; c: any } | null {
  const w1 = prog.weeks && (prog.weeks['1'] || prog.weeks[1]);
  if (!w1) return null;
  for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
    const day = w1[d];
    if (!day || day.rest) continue;
    for (const c of [].concat(day.cardio || []) as any[]) {
      if (!c || c.type !== 'run' || /RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype || '') || !/\d:\d\d\/mi/.test(c.detail || '')) continue;
      return { d, c };
    }
  }
  return null;
}

/** D189 S1 over `seeds` x `rests` (the sweep: 20 seeds x 2 rest patterns, 640 no-mile cells and 720 mile cells). */
function disclosureLatticeCases(IA: App, label: string, seeds: number[], rests: string[][], counts?: { noMile: number; mile: number }): LatticeTest[] {
  const build = (cfg: Record<string, any>) => IA.buildProgram(clone(cfg));
  return [
    [`${label}: every no-mile program carries the default sentence once, appended to week 1's first paced run card (intermediate and advanced pace goals are refused first)`, () => {
      let cells = 0;
      for (const goal of D189_GOALS)
        for (const exp of LEVELS) {
          if (goal === 'run_pace_goal' && exp !== 'beginner') continue;
          for (const seed of seeds)
            for (const rest of rests) {
              const where = `${goal}|${exp}|${seed}|${rest.join('/')}`;
              const p = build(discloseCfg(goal, exp, 0, seed, rest));
              assert.equal(countS1(p), 1, `${where}: one default sentence`);
              const site = firstPaced(p);
              assert.ok(site, `${where}: week 1 has a paced run card`);
              const note = String(site.c.note || '');
              assert.ok(note === S1(exp) || note.endsWith(' ' + S1(exp)), `${where}: W1 ${site.d} note ${JSON.stringify(note.slice(-200))}`);
              cells++;
            }
        }
      if (counts) assert.equal(cells, counts.noMile);
    }],
    [`${label}: a program with a mile entered carries no default sentence anywhere`, () => {
      let cells = 0;
      for (const goal of D189_GOALS)
        for (const exp of LEVELS)
          for (const seed of seeds)
            for (const rest of rests) {
              assert.equal(countS1(build(discloseCfg(goal, exp, 480, seed, rest))), 0, `${goal}|${exp}|${seed}|${rest.join('/')}`);
              cells++;
            }
      if (counts) assert.equal(cells, counts.mile);
    }],
  ];
}

// ── Long-run tiers for a beginner with a mile (D188's Class A2 and A1-L, as they stand today) ──
// "The run is the day": a non-race long run of 75 minutes or more takes mobility only (A); 45 to 75 takes upper body
// and trunk, no hinge or leg work, no power, at most 8 working sets (B); under 45 is a normal day (C). An NRC
// rehearsal is A. No tier ever carries a carry. The tier is worked out here from the dose (minutes, or miles x tgt /
// 60) and compared with the tier read off the printed day. The vocabularies are the legacy gates' (g209 D18/D140, D153).
const LEGH = /swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol|pull-?through|back extension/i;
const STR = /stretch|mobility|90\/90|foam|worlds greatest/i;
const CAR = /carry|farmer|suitcase/i;
const PWR = /power|explosive/i;
const minOf = (d: any): number => (!d ? 0 : d.k === 'time' ? +d.mins || 0 : ((+d.mi || 0) * (+d.tgt || 0)) / 60);
function longRunOf(day: any): any {
  const c = day && day.cardio;
  if (!c || Array.isArray(c) || !c.dose) return null;
  if (c.isNRC) {
    if (!/^long run/i.test(c.subtype || '') || /race day|time trial/i.test(c.subtype || '')) return null;
  } else if (c.type !== 'run' || c.dose.key !== 'long') return null;
  return c;
}
function oracleTier(day: any): 'A' | 'B' | 'C' | null {
  const c = longRunOf(day);
  if (!c) return null;
  if (c.isNRC && /rehearsal/i.test(c.detail || '')) return 'A';
  const m = minOf(c.dose);
  if (!m) return null;
  return m >= 75 ? 'A' : m >= 45 ? 'B' : 'C';
}
const dSets = (det: unknown): number => {
  const s = String(det || '');
  let x = /^(\d+)\s*[x×]/.exec(s);
  if (x) return +x[1]!;
  x = /\b(\d+)\s*sets?\b/i.exec(s);
  return x ? +x[1]! : 1;
};
const sectionsOf = (day: any): any[] => day.sections || [];
const itemsOf = (day: any): any[] => sectionsOf(day).reduce((a: any[], s: any) => a.concat(s.items || []), []);
const workSets = (day: any): number => itemsOf(day).filter((i) => !STR.test(i.name || '')).reduce((a: number, i: any) => a + dSets(i.detail), 0);
const mobilityOnly = (day: any): boolean => sectionsOf(day).every((s) => /post-run mobility|taper/i.test(s.label || ''));
const bannedOnB = (day: any): boolean =>
  itemsOf(day).some((i) => LEGH.test(i.name || '')) || sectionsOf(day).some((s) => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')) || workSets(day) > 8;
const carriesOf = (day: any): number =>
  itemsOf(day).filter((i) => CAR.test(i.name || '')).length + sectionsOf(day).filter((s) => /carry/i.test(s.label || '') || /carry/i.test(s.coreHeader || '')).length;
/** The tier read off the printed day: '-' nothing printed, 'A' post-run mobility only, 'C' carries what B bans, '?' B or C. */
const appliedTier = (day: any): string =>
  !sectionsOf(day).length ? '-' : mobilityOnly(day) && sectionsOf(day).some((s) => /post-run mobility/i.test(s.label || '')) ? 'A' : bannedOnB(day) ? 'C' : '?';
const agrees = (o: string, a: string): boolean => a === o || a === '-' || (a === '?' && (o === 'B' || o === 'C'));

/** A long-run tier lattice: level x goal x path and focus x mile x rest pattern x seed. */
export interface TierLattice {
  exps: string[];
  goals: [string, Record<string, string>][];
  paths: [string, string][];
  miles: number[];
  rests: string[][];
  seeds: number[];
}
/** `need` lists the tiers the lattice must reach. */
function longRunTierLatticeCases(IA: App, label: string, lattice: TierLattice, need?: ('A' | 'B' | 'C')[]): LatticeTest[] {
  return [
    [`${label}: every long run's tier worked out from its minutes is the tier printed on its day, and each tier holds its content rules`, () => {
      const seen = { A: 0, B: 0, C: 0 };
      let days = 0;
      for (const exp of lattice.exps)
        for (const [gk, g] of lattice.goals)
          for (const [pth, foc] of lattice.paths)
            for (const m of lattice.miles)
              for (const rest of lattice.rests)
                for (const seed of lattice.seeds) {
                  const run: Record<string, any> = Object.assign({}, g);
                  if (m) Object.assign(run, { mileBestMins: String(Math.floor(m / 60)), mileBestSecs: String(m % 60), mileBestSrc: { kind: 'entered' } });
                  const race = RACE_GOALS.has(String(g['id']));
                  const p = IA.buildProgram({
                    name: 'G226h', primaryPath: pth, eventTargeted: race, raceDate: race ? '2026-12-20' : '', liftingFocus: foc, experience: exp, ageBracket: '18-35',
                    equipment: 'commercial', unit: 'lbs', restDays: rest.slice(), days: DAYS.slice(), bench: 185, squat: 255, deadlift: 315, seed,
                    startDate: '2026-10-05', cardioTypes: ['run'], cardioGoals: { run },
                  } as Record<string, any>);
                  const tagOf = (w: number, d: string) => [exp, gk, pth + '/' + foc, m ? clk(m) : 'no mile', rest.join('+'), 's' + seed, 'W' + w, d].join(' ');
                  for (let w = 1; w <= p.totalWeeks; w++)
                    for (const d of DAYS) {
                      const day = p.weeks[w] && p.weeks[w][d];
                      const t = day ? oracleTier(day) : null;
                      if (!t) continue;
                      days++;
                      seen[t]++;
                      const where = tagOf(w, d);
                      assert.ok(agrees(t, appliedTier(day)), `${where}: tier ${t} by minutes, ${appliedTier(day)} printed`);
                      assert.equal(carriesOf(day), 0, `${where}: tier ${t} carries no carry`);
                      if (t === 'A') assert.ok(mobilityOnly(day), `${where}: tier A lifts nothing`);
                      if (t === 'B') {
                        assert.deepEqual(itemsOf(day).filter((i) => LEGH.test(i.name || '')).map((i) => i.name), [], `${where}: tier B has no hinge or leg work`);
                        assert.ok(!sectionsOf(day).some((s) => PWR.test(s.label || '') || PWR.test(s.coreHeader || '')), `${where}: tier B has no power block`);
                        assert.ok(workSets(day) <= 8, `${where}: tier B has at most 8 working sets (${workSets(day)})`);
                      }
                    }
                }
      assert.ok(days > 0, 'long-run days were read');
      for (const t of need || []) assert.ok(seen[t] > 0, `tier ${t} is reached (${JSON.stringify(seen)})`);
    }],
  ];
}

// Each lattice registers its cases as Vitest tests where it is called (as the node:test original did), and returns
// them too. A caller never registers them a second time.
function registered<A extends unknown[]>(cases: (...args: A) => LatticeTest[]): (...args: A) => LatticeTest[] {
  return (...args: A) => {
    const list = cases(...args);
    for (const [name, body] of list) test(name, body);
    return list;
  };
}
export const anchorLatticeTests = registered(anchorLatticeCases);
export const appendixLatticeTests = registered(appendixLatticeCases);
export const beginnerMileLatticeTests = registered(beginnerMileLatticeCases);
export const disclosureLatticeTests = registered(disclosureLatticeCases);
export const longRunTierLatticeTests = registered(longRunTierLatticeCases);
