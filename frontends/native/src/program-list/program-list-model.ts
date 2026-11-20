// The home screen's program list, kept apart from Angular so the app's node --test suite reads it as it is
// (architecture phase E, step 4: the list moves from the legacy renderProgList to the ProgramList component). Each
// string is the legacy renderProgList's, piece for piece; the program store, the active program and the list's state
// (which card is open, which is being renamed, which archive is being confirmed) stay the legacy script's.

/** A stored program, as far as the list reads it. */
export interface ListedProgram {
  id: string;
  name?: string;
  goal?: string;
  archived?: boolean;
  totalWeeks?: number;
  cfg?: {
    days?: string[];
    restDays?: string[];
    equipment?: string;
    experience?: string;
    ageBracket?: string;
    cardioTypes?: string[];
    cardioGoals?: Record<string, { label?: string } | undefined>;
  };
}

/** The legacy list state: the active program, the open cards, the card being renamed, the archive being confirmed. */
export interface ListState {
  activeId: string | null;
  openIds: ReadonlySet<string>;
  editId: string | null;
  confirmId: string | null;
  confirmTier: number;
}

/** One card as the list draws it. */
export interface ProgramCard {
  id: string;
  /** The name as the legacy list wrote it into the page (a template literal): markup in a name is read as markup, as before. */
  name: string;
  /** The rename box's starting value. */
  nameValue: string;
  goal: string;
  goalLabel: string;
  cardClass: string;
  isActive: boolean;
  editing: boolean;
  /** 1 while archiving is confirmed, 2 while deleting forever is, 0 otherwise. */
  confirm: 0 | 1 | 2;
  /** The meta line under the name: the days, the lengths, the equipment, experience and age, and the cardio. */
  metaHtml: string;
}

const GOAL_LABELS: Record<string, string> = { strength: 'Strength', hypertrophy: 'Size', fatloss: 'Fat Loss', athletic: 'Athletic', balanced: 'Balanced' };
const DAY_SHORT: Record<string, string> = { sun: 'Su', mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa' };
const EQUIP_ICON: Record<string, string> = { home_full: 'home', home_basic: 'home', commercial: 'dumbbell', crossfit: 'dumbbell', bodyweight: 'user', minimal: 'backpack' };
const EQUIP_LABEL: Record<string, string> = { home_full: 'Full', home_basic: 'Basic', commercial: 'Gym', crossfit: 'CrossFit', bodyweight: 'Bodyweight', minimal: 'Minimal' };
const SPORT_ICON: Record<string, string> = { run: '🏃', bike: '🚴', swim: '🏊' };

/** The app's icon as inline SVG (the legacy asyIcon), at a size. */
export type IconFn = (key: string, size: number) => string;

/** The meta line, as the legacy renderProgList built it. */
export function metaHtml(p: ListedProgram, icon: IconFn): string {
  const c = p.cfg;
  const trainDays = (c?.days || []).filter((d) => !(c?.restDays || []).includes(d));
  const cts = c?.cardioTypes || [];
  const cardio = cts.length
    ? cts.map((t) => icon(SPORT_ICON[t]!, 13) + (c?.cardioGoals?.[t]?.label ? ' ' + c.cardioGoals[t]!.label : '')).join(' + ')
    : 'Lift only';
  const equip = c?.equipment;
  return (
    trainDays.map((d) => DAY_SHORT[d] || d).join(' · ') + ' · ' + (p.totalWeeks || 6) + ' wks cardio · 6 wks lift<br>' +
    icon((equip && EQUIP_ICON[equip]) || 'home', 13) + ' ' + ((equip && EQUIP_LABEL[equip]) || 'Home') +
    ' · ' + (c?.experience || 'intermediate') + ' · ' + (c?.ageBracket || '18-35') + '<br>' + cardio
  );
}

/** What the list shows: the cards of the unarchived programs, or why there are none. */
export function programList(all: ListedProgram[], state: ListState, icon: IconFn): { empty: 'none' | 'archived' | null; cards: ProgramCard[] } {
  const programs = all.filter((p) => !p.archived);
  if (!programs.length) return { empty: all.length ? 'archived' : 'none', cards: [] };
  return {
    empty: null,
    cards: programs.map((p) => {
      const isActive = p.id === state.activeId;
      const isOpen = state.openIds.has(p.id);
      const goal = p.goal || '';
      return {
        id: p.id,
        name: String(p.name),
        nameValue: p.name || '',
        goal,
        goalLabel: GOAL_LABELS[goal] || goal,
        cardClass: 'prog-card' + (isActive ? ' active-prog' : '') + (isOpen ? ' open' : ''),
        isActive,
        editing: state.editId === p.id,
        confirm: state.confirmId !== p.id ? 0 : state.confirmTier === 1 ? 1 : state.confirmTier === 2 ? 2 : 0,
        metaHtml: metaHtml(p, icon),
      };
    }),
  };
}

/** The empty list's line. */
export const EMPTY_HTML = {
  none: 'No programs yet.<br>Tap below to build your first.',
  archived: 'All programs archived.<br>View them under Progress, or build a new one below.',
} as const;
