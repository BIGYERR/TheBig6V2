'use strict';
// Helpers for the pace clock and mile anchor tests (tests/unit/clock-format.test.js, tests/integration/clock-format,
// pace-clock, easy-run-ceiling, mile-anchor, mile-pencil and pace-wizard, and their tests/sweeps lattices).
// They hold mechanics only (a pinned boot, card readers, a DOM registry, the comment stripper). Every expected value
// stays in the test that asserts it, typed by hand. tests/support/app.js and tests/harness.js are not changed.
const { loadApp } = require('./app.js');

const RealDate = Date;
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MON_SUN = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** A Date class whose `new Date()` and `Date.now()` read `t`; a Date built from arguments is unchanged. */
function pinnedDateClass(t) {
  return class PinnedDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(t);
      else super(...a);
    }
    static now() {
      return t;
    }
  };
}

/**
 * Boots the app with its clock pinned from the first line of its script: the harness hands the VM the global Date,
 * so the global is swapped for exactly the one load and restored. `at` is a local date and time (a Date or what the
 * Date constructor takes), so a test reads the same day in every time zone. `opts` goes to loadApp ({ dom: true }).
 */
function loadAppAt(at, opts = {}) {
  const t = (at instanceof RealDate ? at : new RealDate(at)).getTime();
  if (!Number.isFinite(t)) throw new Error(`loadAppAt: ${at} is not a date`);
  const saved = globalThis.Date;
  globalThis.Date = pinnedDateClass(t);
  try {
    return loadApp(opts);
  } finally {
    globalThis.Date = saved;
  }
}

/** A deep copy, so a build can never write into a fixture. */
const clone = (v) => JSON.parse(JSON.stringify(v));

/** The cardio sessions of one day, as an array. */
function cardioOf(prog, wk, day) {
  const w = (prog && prog.weeks && (prog.weeks[wk] || prog.weeks[String(wk)])) || {};
  const d = w[day];
  if (!d || !d.cardio) return [];
  return Array.isArray(d.cardio) ? d.cardio : [d.cardio];
}

/** Every cardio session of a program, week by week (ascending), day sun..sat: [{ w, d, s }]. */
function sessions(prog) {
  const out = [];
  const weeks = Object.keys((prog && prog.weeks) || {}).sort((a, b) => +a - +b);
  for (const w of weeks) for (const d of DAYS) for (const s of cardioOf(prog, w, d)) if (s) out.push({ w: +w, d, s });
  return out;
}

/** The run sessions of a program, as sessions() gives them. */
const runSessions = (prog) => sessions(prog).filter((x) => x.s.type === 'run');

/**
 * Makes document.getElementById keep one element per id, with a working classList (kept in el._cls). Returns the
 * registry (a Map). A fresh registry each call; `reg.clear()` drops every element so the next read makes a new one.
 */
function domRegistry(IA) {
  const doc = IA.window.document;
  const reg = new Map();
  const make = doc.createElement;
  doc.getElementById = function (id) {
    if (!reg.has(id)) {
      const el = make('div');
      el.id = id;
      const cls = new Set();
      el._cls = cls;
      el.classList = {
        add: (c) => cls.add(c),
        remove: (c) => cls.delete(c),
        toggle: (c, f) => ((f === undefined ? !cls.has(c) : f) ? cls.add(c) : cls.delete(c)),
        contains: (c) => cls.has(c),
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
function stripComments(src) {
  const out = [];
  const n = src.length;
  const tpl = [];
  let i = 0;
  let depth = 0;
  let prevSig = '';
  let prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
  const readTemplate = () => {
    while (i < n) {
      const c = src[i];
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
      if (c === '$' && src[i + 1] === '{') {
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
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < n && src[i] !== '\n') i++;
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
      while (j < n && src[j] !== c && src[j] !== '\n') {
        if (src[j] === BS) j++;
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
        while (j < n && src[j] !== '\n') {
          const x = src[j];
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
        while (j < n && /[a-z]/i.test(src[j])) j++;
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
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
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

module.exports = { RealDate, DAYS, MON_SUN, pinnedDateClass, loadAppAt, clone, cardioOf, sessions, runSessions, domRegistry, stripComments };
