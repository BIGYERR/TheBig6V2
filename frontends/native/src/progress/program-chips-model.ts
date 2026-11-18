// The Progress screen's program chips and the archived program's bar, kept apart from Angular so the app's node --test
// suite reads them as they are (architecture phase E, step 17: the legacy _progChipsHTML and _restoreBarHTML become
// the ProgramChips component). Switching, restoring and deleting are still the legacy handlers.

/** A stored program, as far as the chips read it. */
export interface ChipProgram {
  id: string;
  name?: string;
  archived?: boolean;
  created?: number;
}

/** One chip: the program, its label's markup (a history icon on an archived one, then the name) and whether it is shown. */
export interface Chip {
  id: string;
  label: string;
  sel: boolean;
}

/** The bar under the chips for an archived program: restore or delete, or the delete's confirmation. */
export type RestoreBar = { kind: 'archived'; id: string } | { kind: 'confirm'; id: string; name: string; warn: boolean };

export interface ChipsView {
  /** Null with fewer than two programs: there is nothing to choose between. */
  chips: Chip[] | null;
  bar: RestoreBar | null;
}

/** What the chips read beside the programs: the active one, the confirmation armed, and the legacy pieces. */
export interface ChipsInput {
  activeId: string | null;
  confirmId: string | null;
  confirmTier: number;
  /** Whether deleting this program blanks loads another program starts from (the legacy _purgeWarnsCrossProg). */
  warnsCrossProg(id: string): boolean;
  icon(name: string, size: number): string;
}

/** The legacy _restoreBarHTML: the delete's confirmation while it is armed, else the archived bar. */
export function restoreBar(p: ChipProgram, c: ChipsInput): RestoreBar {
  if (c.confirmId === p.id && c.confirmTier === 2) return { kind: 'confirm', id: p.id, name: p.name || 'Program', warn: c.warnsCrossProg(p.id) };
  return { kind: 'archived', id: p.id };
}

/** The legacy _progChipsHTML: the active program first, then the live ones, then the archived, newest first within each. */
export function chipsView(programs: ChipProgram[], vid: string, c: ChipsInput): ChipsView {
  if (!programs || programs.length < 2) {
    const only = programs && programs[0];
    return { chips: null, bar: only && only.archived ? restoreBar(only, c) : null };
  }
  const rank = (p: ChipProgram) => (p.id === c.activeId ? 0 : p.archived ? 2 : 1);
  const order = [...programs].sort((a, b) => rank(a) - rank(b) || (b.created || 0) - (a.created || 0));
  const viewed = programs.find((p) => p.id === vid);
  return {
    chips: order.map((p) => ({ id: p.id, label: (p.archived ? c.icon('history', 13) + ' ' : '') + (p.name || 'Program'), sel: p.id === vid })),
    bar: viewed && viewed.archived ? restoreBar(viewed, c) : null,
  };
}

/** A chip's inline style: the shown program filled in the accent, the others outlined. */
export function chipStyle(sel: boolean): string {
  return 'flex:0 0 auto;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0;padding:8px 12px;border-radius:16px;cursor:pointer;white-space:nowrap;border:1px solid '
    + (sel ? 'var(--accent)' : 'var(--border)') + ';background:' + (sel ? 'var(--accent)' : 'var(--surface)') + ';color:' + (sel ? 'var(--on-ink)' : 'var(--muted)');
}
