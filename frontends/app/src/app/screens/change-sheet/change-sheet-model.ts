// The injury and travel sheet, kept apart from Angular so the app's node --test suite reads it as it is (architecture
// phase E, step 10: the sheet's body moves from the legacy renderOverlaySheet to the ChangeSheet component). The draft
// stays the legacy `_ovDraft`, and each choice is still the legacy _ovSet; applying is still the legacy
// applyOverlayDraft or applyInjuryDraft. This decides what the body shows, each string the legacy one.

/** The legacy draft. */
export interface OverlayDraft {
  type: string;
  from: string | null;
  to: string | null;
  equipment: string;
  tab: string;
  injRegion: string | null;
  injTier: string;
}

/** Which draft field a choice writes. */
export type DraftKey = 'equipment' | 'injRegion' | 'injTier' | 'from' | 'to';

/** A card to choose: its name, its description (shown only when chosen, and only where the legacy showed one). */
export interface ChoiceCard {
  key: DraftKey;
  id: string;
  name: string;
  desc: string | null;
  sel: boolean;
}

/** A date box: its label, the date as it reads, the field's value and its earliest date. */
export interface DateField {
  key: 'from' | 'to';
  label: string;
  shown: string;
  value: string;
  min: string | null;
}

/** The effect panel: a title or none, then its lines, each with its own inline style or none. */
export interface Effect {
  title: string | null;
  subs: { text: string; style: string | null }[];
}

/** The button at the foot: Apply change for travel or for an injury, or Got it, which only closes. */
export type SheetAction = 'travel' | 'injury' | 'close';

export interface TravelView {
  dates: DateField[] | null;
  cards: ChoiceCard[];
  effect: Effect;
  action: SheetAction;
}

export interface InjuryView {
  regions: ChoiceCard[];
  tiers: ChoiceCard[] | null;
  effect: Effect | null;
  dates: DateField[] | null;
  action: SheetAction | null;
}

export interface ChangeSheetView {
  kicker: string;
  title: string;
  intro: string;
  travel: TravelView | null;
  injury: InjuryView | null;
}

/** The legacy pieces the sheet reads: the date words, the day count, and the program's own range and resume line. */
export interface SheetDeps {
  fmtDate(iso: string | null): string;
  fmtDateWd(iso: string | null): string;
  dayCount(from: string | null, to: string | null): number;
  dayCountWord(n: number): string;
  /** Whether the draft's span falls inside the program (the legacy overlayWeekRange, truthy or null). */
  inProgram(ov: PreviewOverlay): boolean;
  /** The day the program picks back up (the legacy overlayBackCopy). */
  backCopy(ov: PreviewOverlay): string;
}

/** The travel draft as the legacy previewed it. */
export interface PreviewOverlay {
  type: 'substitute';
  from: string | null;
  to: string | null;
  patch: { equipment: string };
}

/** Travel tiers, in the order the legacy listed them. */
export const EQUIP_OPTS: readonly (readonly [string, string, string])[] = [
  ['bodyweight', 'Room only', 'Nothing but you. A floor, a wall, and a chair.'],
  ['home_basic', 'Mini gym', 'Dumbbells, a bench, a treadmill. The standard hotel setup.'],
  ['commercial', 'Full gym', 'Racks, barbells, cables. A resort gym or a real gym nearby.'],
];

/** Per-region, per-tier effect copy for the injury sheet. */
export const INJ_EFFECT: Readonly<Record<string, { workaround: string; protect: string }>> = {
  knee: {
    workaround: 'Squats and lunges stay but move to easier variants held at RPE 7. Jumps are out. Running goes easy only, no speed work.',
    protect: 'Leg day becomes a posterior chain day. Hip thrusts, glute work, hamstrings. No squatting, no lunging, no jumping. Runs become easy rides or swims so your engine keeps building.',
  },
  ankle: {
    workaround: 'Calf work is out and single leg work moves to variants that keep the foot planted. Runs get shorter and stay easy.',
    protect: 'Nothing stands on that ankle under load. Leg day leans hip and hamstring. Runs become rides or swims, same slots, same clock.',
  },
  hip: {
    workaround: 'Hinges and lunges back off to RPE 7, swings are out, extra hip mobility comes in. Runs go easy.',
    protect: 'Hinges, lunges, and hip thrusts sit out. Leg day leans quads plus mobility work. Runs move to the pool first, the bike second.',
  },
  lowback: {
    workaround: 'Deadlifts become hip thrusts, rows go single arm and supported, carries are out, core goes spine safe. Cardio stays easy.',
    protect: 'Nothing loads the spine. Hinges and rows sit out, legs go machine based, core stays anti extension only. Cardio is easy swimming and walking.',
  },
  shoulder: {
    workaround: 'Overhead work and dips are out. Pressing stays flat and neutral, held at RPE 7. Face pulls stay, they help. Swims become runs or rides.',
    protect: 'All pressing sits out. Push day becomes a pull volume day. Swims become runs or rides. Pull day trains normally.',
  },
  elbow: {
    workaround: 'Straight bar work moves to neutral grips. Skullcrushers become pushdowns, or close grip pushups where there is no cable. Dips and carries are out. Pressing holds RPE 7.',
    protect: 'Direct arm work and pressing sit out. The day leans legs and core. Cardio is untouched.',
  },
};

export const INJ_SAFETY = 'If it is sharp, swollen, numb, or no better in two weeks, that is a job for a professional, not an app.';

const INJ_TIERS: readonly (readonly [string, string, string])[] = [
  ['workaround', 'Work around it', 'Annoying but trainable. It warms up okay and settles by the next morning.'],
  ['protect', 'Protect it', 'Sharp, swollen, or it hurts at rest. We pull the load off it entirely.'],
];

const HOLDS_ROOM =
  'Lifting holds steady while you’re away. Reps are yours: three sets, stop two short of failure. Run past 25 and it is time for a harder variant. Your running keeps building. That only needs shoes.';
const HOLDS_GEAR =
  'Lifting holds steady while you’re away. Grab the heaviest load you can control and work in the 8 to 12 range. If that still feels easy, go single arm. Your running keeps building. That only needs shoes.';

function fromField(d: OverlayDraft, deps: SheetDeps): DateField {
  return { key: 'from', label: 'FROM', shown: deps.fmtDate(d.from), value: d.from || '', min: null };
}

/** The travel sheet, as the legacy _renderTravelTab drew it. */
export function travelView(d: OverlayDraft, deps: SheetDeps): TravelView {
  const preview: PreviewOverlay = { type: 'substitute', from: d.from, to: d.to, patch: { equipment: d.equipment } };
  const inProgram = deps.inProgram(preview);
  const isNoOp = d.equipment === 'commercial';
  let effect: Effect;
  if (isNoOp) {
    effect = { title: 'You’re set', subs: [{ text: 'A real gym means nothing needs to change. Train your program as written.', style: null }] };
  } else if (inProgram) {
    const nd = d.to ? deps.dayCount(d.from, d.to) : 0;
    const span = !d.to
      ? deps.fmtDateWd(d.from) + ' onward.'
      : nd === 1
        ? deps.fmtDateWd(d.from) + '. One day.'
        : deps.fmtDateWd(d.from) + ' through ' + deps.fmtDateWd(d.to) + '. ' + deps.dayCountWord(nd) + '.';
    const back = !d.to ? '' : deps.backCopy(preview) + ' Every other day stays as written.';
    effect = {
      title: 'Takes effect ' + span,
      subs: [
        { text: back, style: null },
        { text: d.equipment === 'bodyweight' ? HOLDS_ROOM : HOLDS_GEAR, style: 'margin-top:6px' },
      ],
    };
  } else {
    effect = { title: null, subs: [{ text: 'That range falls outside your program. Pick dates inside it.', style: 'color:var(--muted)' }] };
  }
  return {
    dates: isNoOp ? null : [fromField(d, deps), { key: 'to', label: 'THROUGH', shown: deps.fmtDate(d.to), value: d.to || '', min: d.from || '' }],
    cards: EQUIP_OPTS.map(([id, name, desc]) => ({ key: 'equipment', id, name, desc: d.equipment === id ? desc : null, sel: d.equipment === id })),
    effect,
    action: isNoOp ? 'close' : 'travel',
  };
}

/** The injury sheet, as the legacy _renderInjuryTab drew it. */
export function injuryView(d: OverlayDraft, regions: Readonly<Record<string, { label: string }>>, deps: SheetDeps): InjuryView {
  const R = d.injRegion;
  const T = d.injTier || 'workaround';
  const cards: ChoiceCard[] = Object.keys(regions).map((id) => ({ key: 'injRegion', id, name: regions[id]!.label, desc: null, sel: R === id }));
  cards.push({ key: 'injRegion', id: 'other', name: 'Neck / something else', desc: null, sel: R === 'other' });
  if (R === 'other') {
    return {
      regions: cards,
      tiers: null,
      effect: {
        title: 'That one’s above my pay grade',
        subs: [{
          text: 'Get eyes on it from someone qualified. In the meantime train what doesn’t touch it and cut anything that does. When you know what you’re working with, come back and set it up here if it fits one of the regions above.',
          style: null,
        }],
      },
      dates: null,
      action: 'close',
    };
  }
  const known = R ? INJ_EFFECT[R] : undefined;
  const label = R && regions[R] ? regions[R].label : '';
  return {
    regions: cards,
    tiers: R ? INJ_TIERS.map(([id, name, desc]) => ({ key: 'injTier', id, name, desc: T === id ? desc : null, sel: T === id })) : null,
    effect: known
      ? {
        title: (T === 'protect' ? 'Protected' : 'Working around it') + ' · ' + label,
        subs: [
          { text: T === 'protect' ? known.protect : known.workaround, style: null },
          {
            text: 'Every two weeks it asks how the ' + label.toLowerCase().split(' ')[0] + ' feels. When you’re ready, tap I’m back and it eases you in over one light week before full prescription.',
            style: 'margin-top:6px',
          },
          { text: INJ_SAFETY, style: 'margin-top:6px;color:var(--muted)' },
        ],
      }
      : null,
    dates: R ? [fromField(d, deps)] : null,
    action: R ? 'injury' : null,
  };
}

/** The whole body: the head for the sheet the draft is on, then that sheet. */
export function changeSheetView(d: OverlayDraft, regions: Readonly<Record<string, { label: string }>>, deps: SheetDeps): ChangeSheetView {
  const inj = (d.tab || 'travel') === 'injury';
  return {
    kicker: inj ? 'HURT?' : 'TRAVELING?',
    title: inj ? 'Train around it' : 'Temporary change',
    intro: inj
      ? 'No end date on this one. You tell it when you’re back. Nothing you’ve already trained changes.'
      : 'Your program reverts on its own. Nothing you’ve already trained changes.',
    travel: inj ? null : travelView(d, deps),
    injury: inj ? injuryView(d, regions, deps) : null,
  };
}
