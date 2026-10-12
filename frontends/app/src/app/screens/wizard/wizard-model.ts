// The new-program wizard, kept apart from Angular so the app's node --test suite reads it as it is (architecture phase
// E, step 19: the wizard moves from the legacy renderWizardStep to the Wizard component, a few steps at a time). The
// draft stays the legacy `WD` and the step the legacy `wizardStep`; moving between steps and generating the program
// are still the legacy wizardBack, wizardNext and generateProgram. This decides what the shell and the moved steps
// show, each word the legacy renderWizardStep's.

/** The steps, in the legacy order. */
export const WIZARD_STEPS = ['primary', 'profile', 'equipment', 'cardio_goal', 'lifting_focus', 'days', 'name'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** The steps the Wizard component draws; the rest are still drawn by the legacy renderWizardStep. */
export const MOVED_STEPS: ReadonlySet<string> = new Set(['primary', 'profile', 'equipment']);

/** The draft, as far as the moved steps read it. */
export interface WizardDraft {
  primaryPath?: string;
  experience?: string;
  ageBracket?: string;
  unit?: string;
  equipment?: string;
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
