// A program card's detail (the legacy progDetailHTML), kept apart from Angular so the app's node --test suite reads it
// as it is (architecture phase E: the detail moves into the ProgramDetail component). Each word is the legacy
// builder's; the selections themselves are still the legacy progSelData's, and the run paces the legacy
// runAnchorChips' and runAnchorSentence's.

/** A program's selections, as the legacy progSelData reads them. */
export interface ProgSel {
  goal: string;
  liftLabel: string;
  pathLabel: string;
  experience: string;
  ageBracket: string;
  equipLabel: string;
  unit: string;
  lifts: { squat: number; bench: number; deadlift: number; estimated: boolean };
  trainDays: string[];
  restDays: string[];
  length: number;
  cardio: { type: string; label: string; goal: string }[];
  eventTargeted: boolean;
  raceStr: string;
  raceOut: { card: string } | null;
  seed: number | string | null;
  runAnchor: unknown;
}

export interface DetailRow {
  k: string;
  v: string;
}

/** A pace or lift chip: its name, its number, its unit. */
export interface DetailChip {
  k: string;
  v: string;
  u: string;
}

export interface ProgramDetailView {
  id: string;
  focus: DetailRow[];
  profile: DetailRow[];
  schedule: DetailRow[];
  /** The starting maxes, marked as estimated when none was entered. */
  estimated: boolean;
  lifts: DetailChip[];
  /** The run paces and the sentence that says where they come from (markup), on a program whose run reads the chart. */
  paces: { chips: DetailChip[]; sentence: string } | null;
  /** Each sport's goal with its pencil, or none on a lifting-only program. */
  cardio: { type: string; label: string; goal: string }[] | null;
  /** The race date and the time out, on a race program. */
  event: DetailRow[] | null;
  seed: string;
}

/** The detail, as the legacy progDetailHTML drew it from the selections, its tables and the run paces. */
export function programDetail(
  id: string,
  s: ProgSel,
  tables: { dayNames: Record<string, string | undefined>; goalLabels: Record<string, string | undefined> },
  paces: { chips: DetailChip[]; sentence: string } | null,
): ProgramDetailView {
  const day = (d: string) => tables.dayNames[d] || d;
  const row = (k: string, v: unknown): DetailRow => ({ k, v: String(v) });
  return {
    id,
    focus: [row('Goal', tables.goalLabels[s.goal] || s.goal || '—'), row('Lift emphasis', s.liftLabel), row('Path', s.pathLabel)],
    profile: [row('Experience', s.experience), row('Age range', s.ageBracket), row('Equipment', s.equipLabel), row('Units', s.unit)],
    schedule: [row('Train days', s.trainDays.map(day).join(' · ') || '—'), row('Rest days', s.restDays.map(day).join(' · ') || 'None'), row('Length', s.length + ' weeks')],
    estimated: s.lifts.estimated,
    lifts: [['Squat', s.lifts.squat], ['Bench', s.lifts.bench], ['Deadlift', s.lifts.deadlift]].map(([k, v]) => ({ k: String(k), v: String(v), u: s.unit })),
    paces: s.runAnchor ? paces : null,
    cardio: s.cardio.length ? s.cardio.map((c) => ({ ...c, goal: c.goal || 'General fitness' })) : null,
    event: s.eventTargeted ? [row('Race date', s.raceStr || 'No date set'), ...(s.raceOut ? [row('Time out', s.raceOut.card)] : [])] : null,
    seed: s.seed != null ? 'seed ' + s.seed : '',
  };
}
