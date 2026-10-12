// Helpers for the superset round-count tests (tests/integration/supersets.test.ts). Rulings: D39 (the round count is
// a field, never a substring) and D176 (a bare remainder inside a round block reads "N reps").
//
// Oracles here are written from the authoring contract, never read back from the app: refItemSets and refStrip parse
// the two authored grammars ('N×reps' and 'N sets — RPE x'), and the lattice is config input typed by hand.
import { fixtures } from './app.ts';
import type { App } from './app.ts';

/** A config as these tests write it: Mario's program with the lattice's axes over it. */
export type CfgRec = Record<string, any>;
/** A section or an item as the app builds it: untyped app data. */
type AppSec = any;

/** The leading set count of an authored detail, in either grammar; null when it states none. */
export function refItemSets(d: unknown): number | null {
  const s = String(d == null ? '' : d);
  let m = s.match(/^(\d+)\s*[x×]/);
  if (m) return parseInt(m[1] ?? '', 10);
  m = s.match(/^(\d+)\s*sets?\b/i);
  return m ? parseInt(m[1] ?? '', 10) : null;
}

/** The detail with its leading set count removed, the way a round block prints a member. */
export function refStrip(d: unknown): string {
  return String(d == null ? '' : d)
    .replace(/^(\d+)\s*[x×]\s*/, '')
    .replace(/^(\d+)\s*sets?\s+of\s+/i, '')
    .replace(/^(\d+)\s*sets?\s*[—–-]\s*/i, '')
    .replace(/^(\d+)\s*sets?\b\s*/i, '');
}

/** D176: a remainder that is only a count or a range reads "N reps"; every other remainder prints as it is. */
export const BARE = /^\d+(\s*[–-]\s*\d+)?$/;
export const wantMemberRow = (d: unknown): string => {
  const r = refStrip(d);
  return r + (BARE.test(r) ? ' reps' : '');
};

export const isSuperset = (sec: AppSec): boolean => !!(sec && (sec.superset || sec.type === 'superset')) && (sec.items || []).length > 1;

/** The text of every `.ex-detail` row in rendered section HTML. */
export const renderedDetails = (html: unknown): string[] =>
  (String(html).match(/class="ex-detail"[^>]*>([\s\S]*?)<\/div>/g) || []).map((s) =>
    s.replace(/^[\s\S]*?class="ex-detail"[^>]*>/, '').replace(/<\/div>$/, ''),
  );

/** The round sentence a superset header prints. */
export const headerText = (html: unknown): string => (String(html).match(/sshdr-txt">([\s\S]*?)<\/span>/) || [])[1] || '';

/**
 * Calls an app function inside its own realm with JSON arguments and returns its JSON result, so a value never crosses
 * realms half-built.
 */
export function callApp(IA: App, fnName: string, ...args: unknown[]): any {
  const code =
    '(function(){ if(typeof ' + fnName + '!=="function") throw new Error("' + fnName + ' is not defined");' +
    ' var r = ' + fnName + '(' + args.map((a) => JSON.stringify(a)).join(',') + ');' +
    ' return r===undefined ? "__UNDEF__" : JSON.stringify(r); })()';
  const out = IA.eval(code);
  return out === '__UNDEF__' ? undefined : JSON.parse(out);
}

/** Renders sections and hands back the HTML and the section data as it stands after the render. */
export function renderAndReturnData(IA: App, secs: unknown[]): { html: string; after: AppSec[] } {
  const code =
    '(function(){ var S = ' + JSON.stringify(secs) + '; var h = buildSectionsHTML(S,0);' +
    ' return JSON.stringify({html:h, after:S}); })()';
  return JSON.parse(IA.eval(code));
}

// ── the lattice: goals x focuses x experience x equipment x rest patterns, seed pinned per cell ─────────────────────
const GOALS: Record<string, Record<string, string>> = {
  run_half: { id: 'run_half', label: 'Half Marathon', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' },
  run_5k: { id: 'run_5k', label: '5K', mileBestMins: '9', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  run_base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  run_pace_goal: { id: 'run_pace_goal', label: 'Pace', mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi', targetPace: '7:30' },
};
const FOCUSES = ['support_prevention', 'strength', 'hypertrophy', 'fatloss', 'balanced', 'support_athletic', 'support_strength'];
const EXPS = ['beginner', 'intermediate', 'advanced'];
const EQUIP = ['crossfit', 'commercial', 'home_full', 'home_basic', 'bodyweight'];
const RESTS = [['sun', 'wed'], ['sun'], ['sat', 'sun', 'wed']];

function mkCfg(goal: string, focus: string, exp: string, equip: string, rest: string[], i: number): CfgRec {
  const c: CfgRec = Object.assign({}, fixtures.HALF_MANNY, {
    cardioGoals: { run: GOALS[goal] },
    liftingFocus: focus,
    experience: exp,
    equipment: equip,
    restDays: rest.slice(),
    seed: 76308 + i * 97,
  });
  if (goal !== 'run_half' && goal !== 'run_5k') {
    c['primaryPath'] = 'body';
    c['eventTargeted'] = false;
    delete c['raceDate'];
  }
  return c;
}

/** One lattice cell: a readable key and its config. */
export interface RoundsCell {
  key: string;
  cfg: CfgRec;
}

/**
 * The round-count lattice: 4 goals x 7 foci x 3 experience levels x 5 tiers x 3 rest patterns (1,260 cells), keeping
 * every cell whose 1-based index is a multiple of `stride` (3 gives the 420 cells the tests read).
 */
export function roundsLattice(stride: number): RoundsCell[] {
  const out: RoundsCell[] = [];
  let i = 0;
  for (const g of Object.keys(GOALS))
    for (const f of FOCUSES)
      for (const e of EXPS)
        for (const q of EQUIP)
          for (const r of RESTS) {
            i++;
            if (i % stride !== 0) continue;
            out.push({ key: [g, f, e, q, r.join('+')].join('/'), cfg: mkCfg(g, f, e, q, r, i) });
          }
  return out;
}

/** What surveyRounds reads off the lattice. */
export interface RoundsSurvey {
  cells: number;
  built: number;
  errors: string[];
  cfgMutated: number;
  supersets: number;
  noCount: string[];
  nonPositive: string[];
  contradictions: string[];
  desynced: string[];
  rows: { sections: number; rows: number; bare: number; nonBare: number; mismatched: string[]; renderErrors: string[] };
  prevention: { rounds: Record<string, number>; desynced: string[]; accessories: number; accessories3: number };
  balancedAccessories3: number;
}

/**
 * Builds every cell once and reads what the round-count claims need from the generated sections. Nothing here asks
 * the app what a count should be: every comparison is against refItemSets / refStrip.
 */
export function surveyRounds(IA: App, cells: RoundsCell[]): RoundsSurvey {
  const out: RoundsSurvey = {
    cells: cells.length, built: 0, errors: [], cfgMutated: 0,
    supersets: 0, noCount: [], nonPositive: [], contradictions: [], desynced: [],
    rows: { sections: 0, rows: 0, bare: 0, nonBare: 0, mismatched: [], renderErrors: [] },
    prevention: { rounds: {}, desynced: [], accessories: 0, accessories3: 0 },
    balancedAccessories3: 0,
  };
  const seen = new Set<string>();
  const accessoryProbe = (it: AppSec): boolean =>
    !!it && !!it.detail && !/warmup|min rest/.test(it.detail) && /@ RPE|sets — RPE/.test(it.detail);
  const details = (sec: AppSec): string => JSON.stringify((sec.items || []).map((i: AppSec) => i.detail));
  for (const { key, cfg } of cells) {
    const before = JSON.stringify(cfg);
    let prog: any;
    try {
      prog = IA.buildProgram(cfg);
      out.built++;
    } catch (e) {
      out.errors.push(key + ': ' + (e as Error).message);
      continue;
    }
    if (JSON.stringify(cfg) !== before) out.cfgMutated++;
    const weeks: Record<string, Record<string, any>> = prog.weeks || {};
    for (const w of Object.keys(weeks))
      for (const d of Object.keys(weeks[w] || {})) {
        const day = weeks[w]?.[d];
        if (!day || !day.sections) continue;
        for (const sec of day.sections as AppSec[]) {
          const where = key + ' W' + w + ' ' + d + ' "' + sec.label + '"';
          const parsed = (sec.items || []).map((it: AppSec) => refItemSets(it && it.detail)).filter((v: number | null): v is number => v != null);
          if (isSuperset(sec)) {
            out.supersets++;
            if (typeof sec.rounds !== 'number') out.noCount.push(where + ' rounds=' + JSON.stringify(sec.rounds));
            else if (!(sec.rounds > 0)) out.nonPositive.push(where + ' rounds=' + sec.rounds);
            else if (parsed.some((v: number) => v !== sec.rounds)) out.contradictions.push(where + ' rounds=' + sec.rounds + ' members=' + details(sec));
            if (parsed.length > 1 && new Set(parsed).size > 1) out.desynced.push(where + ' ' + details(sec));
            if (cfg['liftingFocus'] === 'support_prevention') {
              const r = String(sec.rounds);
              out.prevention.rounds[r] = (out.prevention.rounds[r] || 0) + 1;
              const bad = typeof sec.rounds !== 'number' || parsed.some((v: number) => v !== sec.rounds) || (parsed.length > 1 && new Set(parsed).size > 1);
              if (bad) out.prevention.desynced.push(where + ' rounds=' + JSON.stringify(sec.rounds) + ' members=' + details(sec));
            }
            // D176: render each distinct numeric-rounds superset once and read its member rows
            if (typeof sec.rounds === 'number') {
              const k = JSON.stringify(sec);
              if (!seen.has(k)) {
                seen.add(k);
                out.rows.sections++;
                const want = sec.items.map((i: AppSec) => wantMemberRow(i && i.detail));
                for (const i of sec.items as AppSec[]) {
                  out.rows.rows++;
                  if (BARE.test(refStrip(i && i.detail))) out.rows.bare++;
                  else out.rows.nonBare++;
                }
                let got: string[];
                try {
                  got = renderedDetails(callApp(IA, 'buildSectionsHTML', [sec], 0));
                } catch (e) {
                  out.rows.renderErrors.push(where + ': ' + (e as Error).message);
                  continue;
                }
                if (JSON.stringify(got) !== JSON.stringify(want))
                  out.rows.mismatched.push(where + ' want ' + JSON.stringify(want) + ' got ' + JSON.stringify(got));
              }
            }
            continue;
          }
          for (const it of (sec.items || []) as AppSec[]) {
            if (!accessoryProbe(it)) continue;
            if (cfg['liftingFocus'] === 'support_prevention') {
              out.prevention.accessories++;
              if (refItemSets(it.detail) === 3) out.prevention.accessories3++;
            } else if (cfg['liftingFocus'] === 'balanced' && refItemSets(it.detail) === 3) out.balancedAccessories3++;
          }
        }
      }
  }
  return out;
}
