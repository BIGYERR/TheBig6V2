'use strict';
// The Wildcard, for tests/integration/wildcard.test.js and tests/sweeps/wildcard.test.js.
//
// Three things live here, none of which asks the app what it should have done:
//   - a hand calendar: date arithmetic through the Date(y, m, d + n) constructor, never a millisecond division, so it
//     cannot share a daylight saving bug with the code under test;
//   - a bench: the app booted with a document that keeps its elements (tests/support/app.js loadApp, so IA_APP is
//     honoured), the pop-ups replaced by spies, and a hand-built six-week program whose start is fourteen days before
//     a pinned today, so today sits in week 3 whatever weekday it is;
//   - the day lattice for wildcardDayFor across daylight saving changes, run in a child process per time zone
//     (`TZ=<zone> node tests/support/wildcard.js --dst` prints one JSON line), and a small CSS cascade resolver that
//     reads the app's <style> text and says which rule colours a hand-built element.
const { loadApp, pinClock } = require('./app.js');

const DK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']; // index = days after Monday
const J = JSON.stringify;

// ── the hand calendar ────────────────────────────────────────────────────────────────────────────────────────────────
const monIdx = (d) => (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function midnight(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}
const mondayOf = (d) => addDays(midnight(d), -monIdx(midnight(d)));
const dayCount = (a, b) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / 86400000);

/** The seven todays the bench is run on: Monday 2026-09-14 to Sunday 2026-09-20, each at local noon. */
const WEEK = DK.map((_, i) => new Date(2026, 8, 14 + i, 12, 0, 0));

// ── the bench ────────────────────────────────────────────────────────────────────────────────────────────────────────
const PID = 'wildcard';
const TOTAL_WEEKS = 6;
const VIEWED_WEEK = 6; // the week the athlete is browsing: deliberately not today's week

/**
 * Boots the app once. `at(today)` pins the app's clock to `today` and returns the hand fixture for that day: today's
 * key and week (3), two rest sets (one where today trains, one where today rests), a program builder, the hand list of
 * scheduled days, and the readers of what the app rendered and stored.
 */
function wildcardBench() {
  const IA = loadApp({ dom: true });
  const ev = IA.eval;
  const LS = IA.localStorage;
  ev('popFire=function(t,o){ __wcCap=JSON.stringify({tier:t,opts:o}); }');
  ev('fireSeasonPopup=function(){ __wcSeason++; }');
  ev('fireCompletionPopup=function(){ __wcCompletion++; }');
  const resetDom = () => {
    for (const k of Object.keys(IA.els)) delete IA.els[k];
  };
  const html = (id) => (IA.els[id] ? String(IA.els[id].innerHTML || '') : '');

  function at(today) {
    pinClock(IA, today);
    const TODAY = midnight(today);
    const TODAY_KEY = DK[monIdx(TODAY)];
    const START = addDays(TODAY, -14);
    const START_MON = mondayOf(START);
    const EXP_WEEK = Math.floor(dayCount(START_MON, TODAY) / 7) + 1;
    // rest sets that give the shape a case needs whatever weekday today is
    const TRAINS = [TODAY_KEY === 'sun' ? 'sat' : 'sun', TODAY_KEY === 'wed' ? 'thu' : 'wed'];
    const RESTS = [TODAY_KEY, TODAY_KEY === 'sun' ? 'wed' : 'sun'];

    function mkProg(restDays, title) {
      const weeks = {};
      for (let w = 1; w <= TOTAL_WEEKS; w++) {
        weeks[w] = {};
        DK.forEach((d) => {
          weeks[w][d] = restDays.includes(d) ? { title: 'Rest', rest: true, tags: ['rest'] } : { title, sections: [], tags: ['lift'] };
        });
      }
      return { id: PID, name: 'WILDCARD BLOCK', totalWeeks: TOTAL_WEEKS, startDate: iso(START), weeks, goal: 'balanced', cfg: {} };
    }
    /** Every non-rest day of the fixture from the start date to today, ascending: the hand walk. */
    function handScheduled(restDays) {
      const out = [];
      for (let w = 1; w <= TOTAL_WEEKS; w++) {
        DK.forEach((d, off) => {
          if (restDays.includes(d)) return;
          const dt = addDays(START_MON, (w - 1) * 7 + off);
          if (dt < midnight(START) || dt > TODAY) return;
          out.push({ week: w, d, date: dt });
        });
      }
      return out.sort((a, b) => a.date - b.date);
    }
    return { TODAY, TODAY_KEY, START, START_MON, EXP_WEEK, VIEWED_WEEK, TRAINS, RESTS, mkProg, handScheduled };
  }

  /** Stores the program as the active one with an optional ia_comp_ record set, viewing `viewWeek` (week 6 if absent). */
  function install(prog, comp, viewWeek) {
    LS.clear();
    ev("activeProgId='" + PID + "'");
    ev('activeProg=' + J(prog));
    ev('currentWeek=' + (viewWeek === undefined ? VIEWED_WEEK : viewWeek));
    if (comp) LS.setItem('ia_comp_' + PID, J(comp));
    resetDom();
    ev('__wcCap=null; __wcSeason=0; __wcCompletion=0;');
  }

  return {
    IA,
    ev,
    LS,
    PID,
    at,
    install,
    /** The last pop-up the spy caught: {tier, opts}, or null. */
    cap: () => {
      const s = ev('__wcCap');
      return s ? JSON.parse(s) : null;
    },
    seasonFired: () => ev('__wcSeason'),
    completionFired: () => ev('__wcCompletion'),
    setWild: (records) => LS.setItem('ia_wild_' + PID, J(records)),
    wild: () => JSON.parse(LS.getItem('ia_wild_' + PID) || '[]'),
    comp: () => LS.getItem('ia_comp_' + PID),
    hist: () => LS.getItem('ia_hist_' + PID),
    setComp: (comp) => LS.setItem('ia_comp_' + PID, J(comp)),
    weekHTML: () => html('daysList'),
    detailHTML: () => html('detailBody'),
    barHTML: () => html('randFilterBar'),
    randBodyHTML: () => html('randBody'),
    counterText: () => (IA.els.randCounter ? IA.els.randCounter.textContent : null),
    streak: () => ev('computeStreak()'),
    completed: () => ev('completedCount()'),
    skipped: () => ev('skippedCount()'),
  };
}

/** The rendered week strip: from the strip's opener to the hero. */
function stripOf(h) {
  const a = h.indexOf('<div class="wk-strip">');
  const b = h.indexOf('<div class="wk-hero');
  return a < 0 || b < 0 ? '' : h.slice(a, b);
}
/**
 * The strip split into one blob per weekday, keyed by the day label it prints. The split is a lookahead for a cell
 * opener (the class followed by a space or the closing quote), so the child divs (wk-day-lbl, wk-day-num) never split it.
 */
function stripCells(h) {
  const cells = {};
  stripOf(h).split(/(?=<div class="wk-day[ "])/).forEach((p) => {
    const m = p.match(/<div class="wk-day-lbl">([A-Z]{3})<\/div>/);
    if (m) cells[m[1].toLowerCase()] = p;
  });
  return cells;
}

// ── the day lattice across daylight saving changes ───────────────────────────────────────────────────────────────────
// Windows are chosen so a transition falls inside the program, and so some programs start on a transition date.
// 2026 transitions: US spring 2026-03-08, US fall 2026-11-01, EU spring 2026-03-29, EU fall 2026-10-25, southern
// autumn 2026-04-05, southern spring 2026-10-04 (Lord Howe and Chatham track Australia and New Zealand).
const DST_CASES = [
  ['dst1-us-spring', 'spring forward inside the window (US)', '2026-02-16', 12],
  ['dst2-us-fall', 'fall back inside the window (US)', '2026-10-05', 12],
  ['dst3-eu-spring', 'spring forward inside the window (EU)', '2026-03-09', 8],
  ['dst4-eu-fall', 'fall back inside the window (EU)', '2026-10-05', 8],
  ['dst5-south-autumn', 'southern autumn inside the window', '2026-03-16', 8],
  ['dst6-south-spring', 'southern spring inside the window', '2026-09-14', 8],
  ['dst7-on-us-spring', 'start date on the US spring change', '2026-03-08', 10],
  ['dst8-on-us-fall', 'start date on the US fall change', '2026-11-01', 10],
  ['dst9-on-eu-spring', 'start date on the EU spring change', '2026-03-29', 10],
  ['dst10-on-south', 'start date on the southern change', '2026-04-05', 10],
  ['dst11-midweek', 'a start mid week (Thursday)', '2026-04-02', 6],
  ['dst12-saturday', 'a start on a Saturday', '2026-04-04', 6],
  ['dst13-year', 'a block across the new year', '2025-12-15', 8],
  ['dst14-leap', 'a leap February', '2028-02-14', 6],
];
/** The seven zones the lattice is run in. */
const TZ_LATTICE = ['America/New_York', 'Europe/London', 'Australia/Sydney', 'Australia/Lord_Howe', 'Pacific/Chatham', 'UTC', 'Asia/Kolkata'];

/**
 * Runs the lattice in this process's time zone against a booted app. Returns { <row id>: { ok, detail } } for the 14
 * windows and the eleven edges (Sunday wrap, rest days, the first and last days, degenerate programs).
 */
function dstLattice(IA) {
  const DPID = 'wildcarddst';
  const out = {};
  const put = (prog) => {
    IA.localStorage.clear();
    IA.eval("activeProgId='" + DPID + "'");
    IA.eval('activeProg=' + J(prog));
    IA.eval('currentWeek=1');
  };
  const call = (d) => IA.eval('JSON.stringify(wildcardDayFor(new Date(' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ',12,0,0)))');
  const mk = (startIso, tw, rest) => {
    const weeks = {};
    for (let w = 1; w <= tw; w++) {
      weeks[w] = {};
      DK.forEach((d) => {
        weeks[w][d] = rest.includes(d) ? { title: 'Rest', rest: true } : { title: 'Session', sections: [] };
      });
    }
    return { id: DPID, name: 'DST', totalWeeks: tw, startDate: startIso, weeks, goal: 'balanced', cfg: { seed: 1 } };
  };
  const rec = (id, ok, detail) => {
    out[id] = { ok: !!ok, detail: ok ? '' : String(detail) };
  };
  for (const [id, , start, tw] of DST_CASES) {
    put(mk(start, tw, ['sun']));
    const SD = new Date(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10));
    const SMON = mondayOf(SD);
    const bad = [];
    for (let off = -10; off < tw * 7 + 10; off++) {
      const d = addDays(SMON, off);
      const got = JSON.parse(call(d));
      // the hand expectation: calendar arithmetic only
      const w = Math.floor(off / 7) + 1;
      const dk = DK[((off % 7) + 7) % 7];
      const exp = off >= 0 && w >= 1 && w <= tw && d >= midnight(SD) ? { week: w, dayKey: dk } : null;
      const g = got ? got.week + '/' + got.dayKey : 'null';
      const e = exp ? exp.week + '/' + exp.dayKey : 'null';
      if (g !== e) bad.push(iso(d) + ' got ' + g + ' want ' + e);
      if (got) {
        // round trip through the app's forward map
        IA.eval('currentWeek=' + got.week);
        const fwd = IA.eval('(function(){var x=dayDateFor(' + got.week + ",'" + got.dayKey + "');return x?x.getFullYear()+'-'+('0'+(x.getMonth()+1)).slice(-2)+'-'+('0'+x.getDate()).slice(-2):null;})()");
        if (fwd !== iso(d)) bad.push('round trip ' + iso(d) + ' -> ' + got.week + '/' + got.dayKey + ' -> ' + fwd);
      }
    }
    rec(id, bad.length === 0, bad.length + ' wrong days: ' + bad.slice(0, 6).join(' | '));
  }
  // Sunday, weekday index 6, is the one a modulo slip drops off the end
  put(mk('2026-04-06', 4, ['wed']));
  let got = JSON.parse(call(new Date(2026, 3, 12)));
  rec('dst15-sunday-wrap', got && got.week === 1 && got.dayKey === 'sun', J(got));
  // a rest day still resolves; scheduledDays is what drops it
  put(mk('2026-04-06', 4, ['wed', 'sun']));
  got = JSON.parse(call(new Date(2026, 3, 8)));
  rec('dst16-rest-resolves', got && got.week === 1 && got.dayKey === 'wed', J(got));
  const sched = IA.eval("JSON.stringify(scheduledDays(new Date(2026,3,30)).filter(function(x){return x.d==='wed';}))");
  rec('dst17-sched-drops-rest', sched === '[]', sched);
  // edges of a block that starts on a Wednesday: week 1 is short
  put(mk('2026-04-08', 4, ['sun']));
  rec('dst18-before-start', call(new Date(2026, 3, 7)) === 'null', call(new Date(2026, 3, 7)));
  rec('dst19-week1-monday', call(new Date(2026, 3, 6)) === 'null', call(new Date(2026, 3, 6)));
  got = JSON.parse(call(new Date(2026, 3, 8)) || 'null');
  rec('dst20-first-day', got && got.week === 1 && got.dayKey === 'wed', J(got));
  got = JSON.parse(call(addDays(new Date(2026, 3, 6), 27)) || 'null');
  rec('dst21-last-day', got && got.week === 4 && got.dayKey === 'sun', J(got));
  rec('dst22-after-end', call(addDays(new Date(2026, 3, 6), 28)) === 'null', call(addDays(new Date(2026, 3, 6), 28)));
  // degenerate program shapes
  const p = mk('2026-04-06', 4, ['sun']);
  delete p.weeks[2].thu;
  put(p);
  rec('dst23-missing-day', call(new Date(2026, 3, 16)) === 'null', call(new Date(2026, 3, 16)));
  const p2 = mk('2026-04-06', 4, ['sun']);
  delete p2.startDate;
  put(p2);
  rec('dst24-no-start', call(new Date(2026, 3, 8)) === 'null', call(new Date(2026, 3, 8)));
  IA.eval('activeProg=null');
  rec('dst25-no-prog', call(new Date(2026, 3, 8)) === 'null', call(new Date(2026, 3, 8)));
  return out;
}

/**
 * Runs the lattice in a child process with TZ set to `zone`, so the zone is in force before Node reads the clock.
 * Returns { ran, offset, rows, error }: `ran` is false when the child printed no result line.
 */
function dstLatticeIn(zone) {
  const cp = require('node:child_process');
  const r = cp.spawnSync(process.execPath, [__filename, '--dst'], {
    env: Object.assign({}, process.env, { TZ: zone }),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120000,
  });
  const line = String(r.stdout || '').split('\n').find((l) => l.startsWith('WILDCARD_DST '));
  if (!line) return { ran: false, rows: {}, error: String(r.stderr || r.error || 'no result line').trim().split('\n').slice(0, 3).join(' | ') };
  const got = JSON.parse(line.slice('WILDCARD_DST '.length));
  return { ran: true, offset: got.offset, rows: got.rows, error: '' };
}

// ── the CSS cascade resolver ─────────────────────────────────────────────────────────────────────────────────────────
// It parses the raw <style> text (selector, declarations, specificity, source order), matches selectors against
// hand-built element trees, and resolves `color` by specificity then source order. Inline style does not occur on these
// selectors, so it is not modelled; @media blocks are kept apart (the light theme is the one resolved). It never runs
// the app's render code.

/** The <style> text of the page with its comments stripped. */
const styleText = (src) => [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');

function cssRules(src) {
  const rules = [];
  let order = 0;
  (function parse(txt, media) {
    let i = 0;
    while (i < txt.length) {
      const ob = txt.indexOf('{', i);
      if (ob < 0) break;
      const head = txt.slice(i, ob).split(';').pop().trim();
      let depth = 1;
      let j = ob + 1;
      while (j < txt.length && depth) {
        if (txt[j] === '{') depth++;
        else if (txt[j] === '}') depth--;
        j++;
      }
      const body = txt.slice(ob + 1, j - 1);
      if (head.startsWith('@media')) parse(body, head);
      else if (!head.startsWith('@')) {
        const decls = [];
        body.split(';').forEach((d) => {
          const k = d.indexOf(':');
          if (k < 0) return;
          let v = d.slice(k + 1).trim();
          const imp = /!important\s*$/.test(v);
          v = v.replace(/!important\s*$/, '').trim();
          decls.push({ p: d.slice(0, k).trim().toLowerCase(), v, imp });
        });
        head.split(',').map((s) => s.trim()).filter(Boolean).forEach((sel) => rules.push({ sel, decls, media, order: order++ }));
      }
      i = j;
    }
  })(styleText(src), null);
  const rootVars = {};
  rules.filter((r) => r.sel === ':root' && !r.media).forEach((r) => r.decls.forEach((d) => {
    if (d.p.startsWith('--')) rootVars[d.p] = d.v;
  }));
  const resolveVar = (v, depth = 0) => (depth > 5 ? v : v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (m, n, fb) => (rootVars[n] !== undefined ? resolveVar(rootVars[n], depth + 1) : fb || m)));
  return { rules, rootVars, resolveVar };
}

function parseCompound(c) {
  const o = { tag: null, ids: [], cls: [], attrs: [], pseudo: [] };
  const re = /([#.]?[\w-]+|\*|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?)/g;
  let m;
  while ((m = re.exec(c))) {
    const t = m[1];
    if (t === '*') continue;
    if (t[0] === '#') o.ids.push(t.slice(1));
    else if (t[0] === '.') o.cls.push(t.slice(1));
    else if (t[0] === '[') o.attrs.push(t);
    else if (t[0] === ':') o.pseudo.push(t);
    else o.tag = t.toLowerCase();
  }
  return o;
}
function specificity(sel) {
  let a = 0;
  let b = 0;
  let c = 0;
  sel.replace(/[>+~]/g, ' ').split(/\s+/).filter(Boolean).forEach((x) => {
    const o = parseCompound(x);
    a += o.ids.length;
    b += o.cls.length + o.attrs.length + o.pseudo.filter((p) => !p.startsWith('::')).length;
    c += (o.tag ? 1 : 0) + o.pseudo.filter((p) => p.startsWith('::')).length;
  });
  return [a, b, c];
}
function matchCompound(o, node) {
  if (o.tag && o.tag !== node.tag) return false;
  if (o.ids.some((i) => node.id !== i)) return false;
  if (o.cls.some((k) => !node.cls.includes(k))) return false;
  if (o.pseudo.length) return false; // :active and :hover never hold at rest
  return true;
}
function matches(sel, node) {
  const parts = sel.replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
  function rec(pi, n) {
    const o = parseCompound(parts[pi]);
    if (!n || !matchCompound(o, n)) return false;
    if (pi === 0) return true;
    if (parts[pi - 1] === '>') return pi - 2 >= 0 && rec(pi - 2, n.parent);
    for (let p = n.parent; p; p = p.parent) if (rec(pi - 1, p)) return true;
    return false;
  }
  return rec(parts.length - 1, node);
}
/** Every rule outside @media that declares `color` and matches `node`. */
const colorCandidates = (rules, node) => {
  const out = [];
  rules.forEach((r) => {
    if (r.media) return;
    r.decls.forEach((d) => {
      if (d.p === 'color' && matches(r.sel, node)) out.push({ sel: r.sel, v: d.v, imp: d.imp, spec: specificity(r.sel), order: r.order });
    });
  });
  return out;
};
/** The rule whose `color` wins on `node`, by the cascade, or null. */
function winningColor(rules, node) {
  const c = colorCandidates(rules, node);
  c.sort((x, y) => y.imp - x.imp || y.spec[0] - x.spec[0] || y.spec[1] - x.spec[1] || y.spec[2] - x.spec[2] || y.order - x.order);
  return c[0] || null;
}
/** A hand-built element: tag, classes, parent. */
const el = (tag, cls, parent) => ({ tag, cls, id: null, parent: parent || null });

/** WCAG 2 contrast ratio of two #rrggbb colours. */
function contrast(a, b) {
  const lum = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const c = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

module.exports = {
  DK, WEEK, PID, TOTAL_WEEKS, VIEWED_WEEK, iso, midnight, addDays, mondayOf, dayCount,
  wildcardBench, stripOf, stripCells,
  DST_CASES, TZ_LATTICE, dstLattice, dstLatticeIn,
  styleText, cssRules, parseCompound, specificity, matches, colorCandidates, winningColor, el, contrast,
};

// The lattice child: `TZ=<zone> node tests/support/wildcard.js --dst` prints `WILDCARD_DST {offset, rows}`.
if (require.main === module && process.argv.includes('--dst')) {
  const rows = dstLattice(loadApp());
  process.stdout.write('WILDCARD_DST ' + J({ offset: new Date().getTimezoneOffset(), rows }) + '\n');
}
