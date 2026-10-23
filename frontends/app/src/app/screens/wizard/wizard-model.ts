// The new-program wizard, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 19: the wizard moves from the legacy renderWizardStep to the Wizard component; the cardio goal step, the
// last, has its own model in cardio-goal-model.ts). The draft stays the legacy `WD` and the step the legacy
// `wizardStep`; moving between steps and generating the program are still the legacy wizardBack, wizardNext and
// generateProgram. This decides what the shell and the steps show, each word the legacy renderWizardStep's.

/** The steps, in the legacy order. */
export const WIZARD_STEPS = ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** The draft, as far as the moved steps read it. */
export interface WizardDraft {
  primaryPath?: string;
  experience?: string;
  ageBracket?: string;
  unit?: string;
  equipment?: string;
  liftingFocus?: string;
  cardioTypes?: string[];
  cardioGoals?: Record<string, { id?: string; label?: string } | undefined>;
  restDays?: string[];
  name?: string;
  startDate?: string;
  raceDate?: string;
}

/** The shell: the progress bar's width, the step count, and the next button's words. */
export function wizardShell(step: number, path: string | undefined): { fill: string; label: string; next: string } {
  const total = WIZARD_STEPS.length;
  const displayTotal = path === 'body' ? total - 1 : total;
  const displayStep = path === 'body' && step > 1 ? step : step + 1;
  return { fill: ((step + 1) / total) * 100 + '%', label: displayStep + '/' + displayTotal, next: WIZARD_STEPS[step] === 'name' ? 'Generate Program →' : 'Continue →' };
}

/** A card to choose: its id, icon, words, and whether the draft holds it. */
export interface Choice {
  id: string;
  icon: string;
  label: string;
  desc: string;
  detail?: string;
  sel: boolean;
}

/** The first step: what the program is for. */
export function primaryChoices(d: WizardDraft): Choice[] {
  return [
    { id: 'event', icon: '🏅', label: 'Race / Event', desc: 'A cardio goal is the priority! This puts your event/goal at the forefront of the program.', detail: 'Cardio builds to a tapered peak · lifting stays light to support, not compete · set a race date.' },
    { id: 'body', icon: '💪', label: 'Strength / Physique', desc: 'Mass/Strength is the priority, cardio is optional!', detail: 'Full-intensity lifting toward your goal · easy optional cardio that won\'t sap your lifts.' },
    { id: 'both', icon: '⚡', label: 'Hybrid', desc: 'Lift heavy AND build cardio at once.', detail: 'Full lifting + a progressing cardio goal · higher fatigue · no race-day taper. If you like HYROX/CROSSFIT this is for you!' },
  ].map((c) => ({ ...c, sel: d.primaryPath === c.id }));
}

const EXP_HINTS: Record<string, string> = {
  beginner: 'Lower volume, longer rest, technique focus. Progressions are conservative.',
  intermediate: 'Balanced volume and intensity. Standard progressions with room to push.',
  advanced: 'Higher intensity, more volume, shorter rest. Progressions push harder.',
};
const AGE_HINTS: Record<string, string> = {
  '18-35': 'Standard progressions. Peak recovery.',
  '36-54': 'Slightly more rest. Volume tapers a touch.',
  '55+': 'More deload frequency, conservative volume increases, joint-friendly emphasis.',
};

/** The second step: experience, age and units, with what each choice changes. */
export function profileView(d: WizardDraft): { experience: Choice[]; age: Choice[]; kg: boolean; expHint: string; ageLabel: string; ageHint: string } {
  const age = d.ageBracket || '18-35';
  return {
    experience: [
      { id: 'beginner', icon: '🌱', label: 'Beginner', desc: 'Some training background — can run ~2 miles.' },
      { id: 'intermediate', icon: '💪', label: 'Intermediate', desc: '1-3 years consistent, comfortable with the main lifts' },
      { id: 'advanced', icon: '🔥', label: 'Advanced', desc: '3+ years, solid numbers, understand progressive overload' },
    ].map((c) => ({ ...c, sel: d.experience === c.id })),
    age: [{ id: '18-35', icon: '⚡' }, { id: '36-54', icon: '💡' }, { id: '55+', icon: '🧠' }].map((a) => ({ ...a, label: a.id, desc: '', sel: d.ageBracket === a.id })),
    kg: d.unit === 'kg',
    expHint: EXP_HINTS[d.experience || 'intermediate']!,
    ageLabel: 'Age ' + age + ':',
    ageHint: AGE_HINTS[age]!,
  };
}

/** A unit button's inline style: the chosen unit filled in the accent. */
export function unitStyle(on: boolean): string {
  return 'flex:1;font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:9px 20px;border:none;cursor:pointer;background:'
    + (on ? 'var(--accent)' : 'transparent') + ';color:' + (on ? 'var(--on-ink)' : 'var(--muted)');
}

/** The third step: the equipment on hand. */
export function equipmentChoices(d: WizardDraft): Choice[] {
  return [
    { id: 'home_full', icon: '🏠', label: 'Home Gym — Full', desc: 'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands' },
    { id: 'home_basic', icon: '🏠', label: 'Home Gym — Basic', desc: 'Dumbbells, kettlebells, pull-up bar, bands. No barbell.' },
    { id: 'commercial', icon: '🏋️', label: 'Commercial Gym', desc: 'Full gym — cables, machines, barbells, everything' },
    { id: 'crossfit', icon: '🤸', label: 'CrossFit Box', desc: 'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands' },
    { id: 'bodyweight', icon: '👤', label: 'Bodyweight only', desc: 'You, the floor, and something to pull on. No weights.' },
  ].map((c) => ({ ...c, sel: d.equipment === c.id }));
}

/** A lifting focus, as the legacy LIFTING_OPTIONS listed it. */
export interface LiftOption {
  id: string;
  icon: string;
  label: string;
  desc: string;
}

/** The lifting focus step: the focuses for the path, and on a lifting-first program the optional cardio add-on. */
export function liftingView(d: WizardDraft, options: { body: LiftOption[]; event: LiftOption[] }): {
  subtitle: string;
  choices: Choice[];
  addOn: { sports: { id: string; icon: string; label: string; sel: boolean }[]; liftOnly: boolean } | null;
} {
  const isEvent = d.primaryPath === 'event';
  const types = d.cardioTypes || [];
  return {
    subtitle: isEvent ? 'Lifting supports your cardio goal — it should not compete with it.' : 'This is your primary focus. Cardio is optional and added next.',
    choices: options[isEvent ? 'event' : 'body'].map((o) => ({ ...o, sel: d.liftingFocus === o.id })),
    addOn: d.primaryPath === 'body'
      ? {
        sports: [{ id: 'run', icon: '🏃', label: 'Running' }, { id: 'bike', icon: '🚴', label: 'Cycling' }, { id: 'swim', icon: '🏊', label: 'Swimming' }].map((t) => ({ ...t, sel: types.includes(t.id) })),
        liftOnly: !types.length,
      }
      : null,
  };
}

/** The week as the legacy ALL_DAYS_ORDER runs it, Sunday first. */
export const ALL_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_SHORT: Record<string, string> = { sun: 'SU', mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA' };

/** What the days step reads beside the draft: the advisories, the floor, and the goals' names. */
export interface DaysInput {
  advisories: string[];
  minDays: number;
  goalLabel(id: string | undefined): string;
}

/** The days step: each day training or rest, the days the floor locks, the count, and why the floor holds. */
export function daysView(d: WizardDraft, i: DaysInput): {
  days: { key: string; short: string; rest: boolean; blocked: boolean }[];
  count: string;
  floor: { reason: string | null; min: number } | null;
  advisories: string[];
} {
  const rest = d.restDays || [];
  const train = ALL_DAYS.filter((x) => !rest.includes(x));
  const atFloor = train.length <= i.minDays;
  const labels: string[] = [];
  (d.cardioTypes || []).forEach((t) => {
    const g = (d.cardioGoals || {})[t];
    if (g) labels.push(i.goalLabel(g.id));
  });
  return {
    days: ALL_DAYS.map((x) => ({ key: x, short: DAY_SHORT[x]!, rest: rest.includes(x), blocked: !rest.includes(x) && atFloor })),
    count: train.length + ' training day' + (train.length === 1 ? '' : 's'),
    floor: atFloor ? { reason: labels.length ? labels.join(' + ') : null, min: i.minDays } : null,
    advisories: i.advisories.length && !atFloor ? i.advisories : [],
  };
}

/** The lifting focus as the summary names it. */
export const LIFT_LABELS: Record<string, string> = {
  strength: 'Strength', hypertrophy: 'Size', fatloss: 'Fat Loss', balanced: 'Balanced',
  support_strength: 'Strength Support', support_athletic: 'Athletic Support', support_prevention: 'Injury Prevention',
};
const PATH_LABELS: Record<string, string> = { event: 'Race / Event', body: 'Strength / Physique', both: 'Hybrid' };
const EQUIP_LABELS: Record<string, string> = {
  home_full: 'Home Full', home_basic: 'Home Basic', commercial: 'Commercial Gym', crossfit: 'CrossFit Box', bodyweight: 'Bodyweight only', minimal: 'Minimal / Travel',
};

/** What the name step reads beside the draft, each from its legacy helper. */
export interface NameInput {
  /** The program's length in weeks. */
  weeks: number;
  /** The cardio row's markup: each sport's icon, name and goal, or "Lift only". */
  cardio: string;
  /** The race date row's words, when the program is for a race. */
  raceRow: string | null;
  /** The resolved start's summary words. */
  startSummary: string;
  /** On a race-aligned program: the derived start and the copy and pips under it. */
  aligned: { start: string; warn: boolean; copy: string; pips: string } | null;
  /** Otherwise: the start date field's value and the copy under it. */
  resolveCopy: string;
}

/** The name step's summary rows (a row's value may be markup, as the legacy wrote it). */
export function nameSummary(d: WizardDraft, i: NameInput): { k: string; v: string }[] {
  const train = ALL_DAYS.filter((x) => !(d.restDays || []).includes(x));
  return [
    { k: 'Path', v: String(PATH_LABELS[d.primaryPath || '']) },
    ...(i.raceRow !== null ? [{ k: 'Race date', v: i.raceRow }] : []),
    { k: 'Lifting', v: LIFT_LABELS[d.liftingFocus || ''] || String(d.liftingFocus) },
    { k: 'Cardio', v: i.cardio },
    { k: 'Program length', v: i.weeks + (i.weeks === 1 ? ' week' : ' weeks') },
    { k: 'Start date', v: '<span id="sumStartDate">' + i.startSummary + '</span>' },
    { k: 'Training days', v: train.map((x) => DAY_SHORT[x]).join(' · ') },
    { k: 'Rest days', v: (d.restDays || []).length ? (d.restDays || []).map((x) => DAY_SHORT[x]).join(' · ') : 'None' },
    { k: 'Experience', v: String(d.experience) },
    { k: 'Age range', v: String(d.ageBracket) },
    { k: 'Equipment', v: EQUIP_LABELS[d.equipment || ''] || String(d.equipment) },
  ];
}
