// Which objects of a built program are shared (D291 P-OWNITEMS, docs/decisions/session-edits.md): one object reached
// by two paths of one grid, and an object of one build found in another build of the same config, which is then one
// of the engine's own (a table's entry it handed out). Identity only: nothing here reads what an object holds.

/** Every object and array a value reaches, with the path to it. */
export function walkObjects(root: unknown, each: (o: object, path: string) => void): void {
  const go = (v: unknown, path: string): void => {
    if (!v || typeof v !== 'object') return;
    each(v as object, path);
    if (Array.isArray(v)) v.forEach((x, i) => go(x, path + '.' + i));
    else for (const k of Object.keys(v as object)) go((v as Record<string, unknown>)[k], path ? path + '.' + k : k);
  };
  go(root, '');
}

/** What two builds of one config share. */
export interface Shared {
  /** How many objects and arrays the first build holds. */
  objects: number;
  /** Each object of the first build reached a second time, as "first path = second path". */
  twice: string[];
  /** Each object of the second build that is an object of the first, by its path in the second. */
  ours: string[];
}

/** The objects shared inside `a`, and between `a` and `b`. */
export function sharedObjects(a: unknown, b: unknown): Shared {
  const seen = new Map<object, string>();
  const out: Shared = { objects: 0, twice: [], ours: [] };
  walkObjects(a, (o, path) => {
    out.objects++;
    const was = seen.get(o);
    if (was !== undefined) out.twice.push(was + ' = ' + path);
    else seen.set(o, path);
  });
  const once = new Set<object>();
  walkObjects(b, (o, path) => {
    if (!seen.has(o) || once.has(o)) return;
    once.add(o);
    out.ours.push(path);
  });
  return out;
}
