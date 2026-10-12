// The wizard's cardio goal step, kept apart from Angular so the app's node --test suite reads it as it is (architecture
// phase E: the last step the legacy renderWizardStep drew moves to the Wizard component). Each word and each style is
// the legacy step's. The lines the legacy updaters repaint in place (the program length, the pace lines, the race date
// card, the mile and swim advisories) keep their ids and start as the legacy step drew them; updateRaceDateFeedback,
// updatePaceDisplay, updateSwimPaceDisplay, updateMileAdvisory and updateSwimAdvisory still repaint them.

export type Sport = 'run' | 'bike' | 'swim';

/** A cardio goal in the draft, as far as the step reads it. Fields hold what the athlete typed, as typed. */
export interface CardioGoalDraft {
  id?: string;
  label?: string;
  swimUnit?: string;
  paceUnit?: string;
  targetDist?: string | number;
  targetMins?: string | number;
  targetSecs?: string | number;
  baseMins?: string | number;
  baseSecs?: string | number;
  base500Mins?: string | number;
  base500Secs?: string | number;
  baselineDist?: string | number;
  mileBestMins?: string | number;
  mileBestSecs?: string | number;
  baseline?: string;
  mileBestSrc?: { kind: string };
  [key: string]: unknown;
}

/** The draft, as far as the step reads and writes it. */
export interface CardioDraft {
  primaryPath?: string;
  cardioTypes: string[];
  cardioGoals: Record<string, CardioGoalDraft | undefined>;
  eventTargeted?: boolean;
  raceDate?: string;
  raceDateWeeks?: number | null;
}

/** A goal on the catalog (the legacy CARDIO_GOALS_BY_TYPE). */
export interface GoalChoice {
  id: string;
  label: string;
  desc: string;
}

/** What the step reads from the legacy script: its tables, and the helpers that draw a piece of the step. */
export interface CardioReads {
  goalsByType: Record<string, GoalChoice[] | undefined>;
  hybridExcluded: ReadonlySet<string>;
  swimDist: Record<string, number | undefined>;
  icon: (key: string, size: number) => string;
  /** The legacy _clkMS: seconds as m:ss. */
  clock: (secs: number) => string;
  /** The legacy paceGoalTarget: the run goal's total time and pace per mile. */
  paceTarget: (g: CardioGoalDraft | undefined) => { tTotalSecs?: number; tPacePerMile?: number };
  /** The legacy _seedBannerHTML, _swimAdvisoryHTML, _mileFieldHelp, _mileAdvisoryHTML and progLenLineHTML. */
  seedBanner: () => string;
  swimAdvisory: () => string;
  mileHelp: () => string;
  mileAdvisory: () => string;
  progLen: () => string;
  /** Today, as the legacy step wrote it (local year-month-day). */
  today: string;
}

/** Which typed field changed, which decides what the legacy handler repainted after writing it. */
export type CardioField = 'swimTarget' | 'swimBase' | 'runDist' | 'runTarget' | 'paceBaseline' | 'mile' | 'baseline';

/** A minutes and seconds pair with their captions. */
export interface TimePair {
  field: CardioField;
  minsKey: string;
  secsKey: string;
  mins: string;
  secs: string;
  /** The minutes field's min and max. */
  lo: string;
  hi: string;
}

/** The current mile time, its help, its fields and its advisory. */
export interface MileField {
  help: string;
  pair: TimePair;
  advisory: string;
}

export type CardioForm =
  | {
    kind: 'swim';
    dist: number | undefined;
    unit: string;
    target: TimePair;
    paceShown: boolean;
    paceLine: string;
    baseLabel: string;
    baseMins: string;
    baseSecs: string;
    advisory: string;
    base500: { label: string; mins: string; secs: string } | null;
  }
  | {
    kind: 'pace';
    unit: string;
    dist: string;
    target: TimePair;
    paceShown: boolean;
    paceLine: string;
    seed: string;
    baseline: string;
    mile: MileField;
  }
  | {
    kind: 'other';
    seed: string;
    question: string;
    placeholder: string;
    step: string;
    unitWord: string;
    baseline: string;
    mile: MileField | null;
  };

/** One sport's card: its header, and when chosen its goals and the chosen goal's fields. */
export interface SportCard {
  id: Sport;
  sel: boolean;
  icon: string;
  name: string;
  desc: string;
  goals: (GoalChoice & { sel: boolean })[];
  form: CardioForm | null;
}

/** The box under the cards: the program length, and on a race path the race date. */
export interface CardioFooter {
  progLen: string;
  multi: boolean;
  race: { targeted: boolean; value: string; min: string; copy: string } | null;
}

export interface CardioStep {
  sports: SportCard[];
  footer: CardioFooter | null;
}

const SPORTS: { id: Sport; icon: string; name: string; desc: string }[] = [
  { id: 'run', icon: '🏃', name: 'Running', desc: 'Outdoor or treadmill. Pace, distance and race goals.' },
  { id: 'bike', icon: '🚴', name: 'Cycling / Spin', desc: 'Spin bike or outdoor. Intervals, FTP and distance.' },
  { id: 'swim', icon: '🏊', name: 'Swimming', desc: 'Lap pool or open water. Structured sets.' },
];

/** The baseline question on a goal with no fields of its own, per sport, and what the typed number is stored with. */
const BASELINE: Record<Sport, { question: string; placeholder: string; step: string; unitWord: string; suffix: string }> = {
  run: { question: 'How far can you currently run?', placeholder: 'e.g. 3', step: '0.5', unitWord: 'mi', suffix: ' mi' },
  bike: { question: 'How long can you currently ride?', placeholder: 'e.g. 20', step: '0.5', unitWord: 'min', suffix: ' min' },
  swim: { question: 'How far can you currently swim?', placeholder: 'e.g. 400', step: '50', unitWord: 'yards', suffix: ' yd' },
};

/** What a baseline typed on a goal with no fields of its own is stored with ('3' on a run is '3 mi'). */
export function baselineSuffix(sport: string): string {
  return BASELINE[sport as Sport]?.suffix ?? '';
}

/** A field's value as the legacy template wrote it (`${x||''}`). */
const val = (x: unknown): string => String(x || '');
/** A typed number as the legacy step read it (`+x||0`). */
const num = (x: unknown): number => +(x as number) || 0;

/**
 * What the legacy step changed in the draft before drawing it: a race date set to today when the athlete has one but
 * none is picked (the shell's default), no week count without a race date, and on the hybrid path no race goal that
 * needs a taper. It writes into the draft, as the legacy step did.
 */
export function prepareCardioDraft(d: CardioDraft, hybridExcluded: ReadonlySet<string>, today: string): void {
  if (d.eventTargeted && !d.raceDate) d.raceDate = today;
  if (!d.eventTargeted) d.raceDateWeeks = null;
  if (d.primaryPath === 'both') {
    for (const sp of Object.keys(d.cardioGoals || {})) {
      const g = d.cardioGoals[sp];
      if (g && hybridExcluded.has(g.id as string)) delete d.cardioGoals[sp];
    }
  }
}

/** The style of a unit button (yd or m, mi or km): orange when chosen, the second with its divider. */
export function unitButtonStyle(on: boolean, second: boolean): string {
  return 'font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;' + (second ? 'border-left:1px solid var(--border2);' : '') +
    'cursor:pointer;background:' + (on ? 'var(--accent)' : 'var(--surface2)') + ';color:' + (on ? 'var(--on-ink)' : 'var(--muted)');
}

/** The style of a race date button (I have a race date, Just building fitness). */
export function raceButtonStyle(on: boolean): string {
  return 'flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:9px;border:none;cursor:pointer;background:' +
    (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? 'var(--on-ink)' : 'var(--muted)');
}

function milePair(g: CardioGoalDraft): TimePair {
  return { field: 'mile', minsKey: 'mileBestMins', secsKey: 'mileBestSecs', mins: val(g.mileBestMins), secs: val(g.mileBestSecs), lo: '3', hi: '20' };
}

function swimForm(g: CardioGoalDraft, r: CardioReads): CardioForm {
  const dist = r.swimDist[g.id as string];
  const unit = g.swimUnit || 'yd';
  const total = num(g.targetMins) * 60 + num(g.targetSecs);
  const paceLine = r.icon('🎯', 13) + ' ' + r.clock(total) + ' is ' + r.clock(total / ((dist as number) / 100)) + ' per 100 ' + unit + '.';
  return {
    kind: 'swim',
    dist,
    unit,
    target: { field: 'swimTarget', minsKey: 'targetMins', secsKey: 'targetSecs', mins: val(g.targetMins), secs: val(g.targetSecs), lo: '0', hi: '99' },
    paceShown: total > 0,
    paceLine,
    baseLabel: 'Your most recent timed ' + dist + unit,
    baseMins: val(g.baseMins),
    baseSecs: val(g.baseSecs),
    advisory: r.swimAdvisory(),
    base500: g.id === 'swim_100_time' ? { label: 'Your most recent timed 500' + unit, mins: val(g.base500Mins), secs: val(g.base500Secs) } : null,
  };
}

function paceForm(g: CardioGoalDraft, run: CardioGoalDraft | undefined, r: CardioReads): CardioForm {
  const t = r.paceTarget(run);
  const paceLine = r.icon('🎯', 13) + ' ' + (t.tPacePerMile ? r.clock(t.tTotalSecs as number) + ' is ' + r.clock(t.tPacePerMile) + ' per mile.' : '');
  const seed = r.seedBanner();
  return {
    kind: 'pace',
    unit: run?.paceUnit || 'mi',
    dist: val(g.targetDist),
    target: { field: 'runTarget', minsKey: 'targetMins', secsKey: 'targetSecs', mins: val(g.targetMins), secs: val(g.targetSecs), lo: '0', hi: '99' },
    paceShown: !!(run?.targetMins !== undefined && run?.targetMins !== '' && run?.targetDist),
    paceLine,
    seed,
    baseline: val(g.baselineDist),
    mile: { help: r.mileHelp(), pair: milePair(g), advisory: r.mileAdvisory() },
  };
}

function otherForm(sport: Sport, g: CardioGoalDraft, r: CardioReads): CardioForm {
  const seed = sport === 'run' ? r.seedBanner() : '';
  const b = BASELINE[sport];
  return {
    kind: 'other',
    seed,
    question: b.question,
    placeholder: b.placeholder,
    step: b.step,
    unitWord: b.unitWord,
    baseline: val(g.baselineDist),
    mile: sport === 'run' ? { help: r.mileHelp(), pair: milePair(g), advisory: r.mileAdvisory() } : null,
  };
}

/** The step, as the legacy renderWizardStep drew it once prepareCardioDraft has run. */
export function cardioStep(d: CardioDraft, r: CardioReads): CardioStep {
  const goals = d.cardioGoals;
  const sports = SPORTS.map((s): SportCard => {
    const sel = d.cardioTypes.includes(s.id);
    const g = goals[s.id];
    const card: SportCard = { ...s, sel, goals: [], form: null };
    if (!sel) return card;
    card.goals = (r.goalsByType[s.id] || [])
      .filter((go) => d.primaryPath !== 'both' || !r.hybridExcluded.has(go.id))
      .map((go) => ({ ...go, sel: g?.id === go.id }));
    if (g) {
      card.form = g.id === 'swim_500_time' || g.id === 'swim_100_time' ? swimForm(g, r)
        : g.id === 'run_pace_goal' ? paceForm(g, goals['run'], r)
          : otherForm(s.id, g, r);
    }
    return card;
  });
  let footer: CardioFooter | null = null;
  if (d.cardioTypes.length && Object.keys(goals).length) {
    const run = goals['run'];
    const trial = run && (run.id === 'run_5k' || run.id === 'run_10k') ? (run.id === 'run_5k' ? '5K' : '10K') : null;
    footer = {
      progLen: r.progLen(),
      multi: d.cardioTypes.length > 1,
      race: d.primaryPath !== 'event' ? null : {
        targeted: !!d.eventTargeted,
        value: d.raceDate || r.today,
        min: r.today,
        copy: trial ? 'Runs the full 8-week ' + trial + ' plan and finishes with a ' + trial + ' time trial in place of race day.' : 'Program builds to peak fitness and holds. Pick a race when ready.',
      },
    };
  }
  return { sports, footer };
}

/** Today as the legacy step wrote it: the local year, month and day. */
export function localIso(t: Date): string {
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}
