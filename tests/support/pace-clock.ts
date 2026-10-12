// Helpers for the pace clock and mile anchor tests (tests/unit/clock-format.test.ts, tests/integration/clock-format,
// pace-clock, easy-run-ceiling, mile-anchor, mile-pencil and pace-wizard, and their tests/sweeps lattices).
// They hold mechanics only (a pinned boot, card readers, a DOM registry, the comment stripper). Every expected value
// stays in the test that asserts it, typed by hand. tests/support/app.ts and tests/harness.js are not changed.
import { loadApp } from './app.ts';
import type { App } from './app.ts';

export const RealDate = Date;
export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const MON_SUN = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** A cardio session or a program as the app's untyped script builds them: tests read them freely. */
export type Session = any;
/** One cardio session of a program, with its week and day. */
export interface Placed {
  w: number;
  d: string;
  s: Session;
}

/** A Date class whose `new Date()` and `Date.now()` read `t`; a Date built from arguments is unchanged. */
export function pinnedDateClass(t: number): DateConstructor {
  class PinnedDate extends RealDate {
    constructor(...a: unknown[]) {
      if (a.length === 0) super(t);
      else super(...(a as [string | number]));
    }
    static override now(): number {
      return t;
    }
  }
  return PinnedDate as DateConstructor;
}

/**
 * Boots the app with its clock pinned from the first line of its script: the harness hands the VM the global Date,
 * so the global is swapped for exactly the one load and restored. `at` is a local date and time (a Date or what the
 * Date constructor takes), so a test reads the same day in every time zone. `opts` goes to loadApp ({ dom: true }).
 */
export function loadAppAt(at: Date | string | number, opts: { dom?: boolean } = {}): App {
  const t = (at instanceof RealDate ? at : new RealDate(at)).getTime();
  if (!Number.isFinite(t)) throw new Error(`loadAppAt: ${String(at)} is not a date`);
  const saved = globalThis.Date;
  globalThis.Date = pinnedDateClass(t);
  try {
    return loadApp(opts);
  } finally {
    globalThis.Date = saved;
  }
}

/** A deep copy, so a build can never write into a fixture. Untyped, as the app's own records are. */
export const clone = (v: unknown): any => JSON.parse(JSON.stringify(v));

/** The cardio sessions of one day, as an array. */
export function cardioOf(prog: any, wk: number | string, day: string): Session[] {
  const w = (prog && prog.weeks && (prog.weeks[wk] || prog.weeks[String(wk)])) || {};
  const d = w[day];
  if (!d || !d.cardio) return [];
  return Array.isArray(d.cardio) ? d.cardio : [d.cardio];
}

/** Every cardio session of a program, week by week (ascending), day sun..sat. */
export function sessions(prog: any): Placed[] {
  const out: Placed[] = [];
  const weeks = Object.keys((prog && prog.weeks) || {}).sort((a, b) => +a - +b);
  for (const w of weeks) for (const d of DAYS) for (const s of cardioOf(prog, w, d)) if (s) out.push({ w: +w, d, s });
  return out;
}

/** The run sessions of a program, as sessions() gives them. */
export const runSessions = (prog: any): Placed[] => sessions(prog).filter((x) => x.s.type === 'run');

/** An element of the registry: the stub the harness makes, plus a classList that keeps its classes. */
export type RegEl = any;

/**
 * Makes document.getElementById keep one element per id, with a working classList (kept in el._cls). Returns the
 * registry (a Map). A fresh registry each call; `reg.clear()` drops every element so the next read makes a new one.
 */
export function domRegistry(IA: App): Map<string, RegEl> {
  const doc = IA.window['document'];
  const reg = new Map<string, RegEl>();
  const make = doc.createElement;
  doc.getElementById = function (id: string): RegEl {
    if (!reg.has(id)) {
      const el = make('div');
      el.id = id;
      const cls = new Set<string>();
      el._cls = cls;
      el.classList = {
        add: (c: string) => cls.add(c),
        remove: (c: string) => cls.delete(c),
        toggle: (c: string, f?: boolean) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)),
        contains: (c: string) => cls.has(c),
      };
      reg.set(id, el);
    }
    return reg.get(id);
  };
  return reg;
}

// The app's script with its comments removed, so a token scan never counts a comment. Strings, template literals and
// regex literals are kept intact. Lifted verbatim from the legacy gates (g221_d178_active.js, g223_d183_safepace.js).
const BS = String.fromCharCode(92);
export function stripComments(src: string): string {
  const out: string[] = [];
  const n = src.length;
  const tpl: number[] = [];
  let i = 0;
  let depth = 0;
  let prevSig = '';
  let prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
  const at = (k: number): string => src[k] ?? '';
  const readTemplate = (): void => {
    while (i < n) {
      const c = at(i);
      if (c === BS) {
        out.push(src.substr(i, 2));
        i += 2;
        continue;
      }
      if (c === '`') {
        out.push(c);
        i++;
        return;
      }
      if (c === '$' && at(i + 1) === '{') {
        out.push('${');
        i += 2;
        tpl.push(depth);
        depth++;
        return;
      }
      out.push(c);
      i++;
    }
  };
  while (i < n) {
    const c = at(i);
    const d = at(i + 1);
    if (c === '/' && d === '/') {
      while (i < n && at(i) !== '\n') i++;
      continue;
    }
    if (c === '/' && d === '*') {
      const j = src.indexOf('*/', i + 2);
      i = j < 0 ? n : j + 2;
      out.push(' ');
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && at(j) !== c && at(j) !== '\n') {
        if (at(j) === BS) j++;
        j++;
      }
      out.push(src.slice(i, j + 1));
      i = j + 1;
      prevSig = c;
      prevWord = '';
      continue;
    }
    if (c === '`') {
      out.push(c);
      i++;
      readTemplate();
      prevSig = '`';
      prevWord = '';
      continue;
    }
    if (c === '{') {
      depth++;
      out.push(c);
      i++;
      prevSig = c;
      prevWord = '';
      continue;
    }
    if (c === '}') {
      depth--;
      out.push(c);
      i++;
      prevWord = '';
      if (tpl.length && tpl[tpl.length - 1] === depth) {
        tpl.pop();
        readTemplate();
        prevSig = '`';
      } else prevSig = '}';
      continue;
    }
    if (c === '/') {
      if (prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)) {
        let j = i + 1;
        let cls = false;
        while (j < n && at(j) !== '\n') {
          const x = at(j);
          if (x === BS) {
            j += 2;
            continue;
          }
          if (cls) {
            if (x === ']') cls = false;
          } else if (x === '[') cls = true;
          else if (x === '/') break;
          j++;
        }
        j++;
        while (j < n && /[a-z]/i.test(at(j))) j++;
        out.push(src.slice(i, j));
        i = j;
        prevSig = 'r';
        prevWord = '';
        continue;
      }
      out.push(c);
      i++;
      prevSig = c;
      prevWord = '';
      continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(at(j))) j++;
      const w = src.slice(i, j);
      out.push(w);
      i = j;
      prevWord = w;
      prevSig = 'w';
      continue;
    }
    out.push(c);
    i++;
    if (!/\s/.test(c)) {
      prevSig = c;
      prevWord = '';
    }
  }
  return out.join('');
}
