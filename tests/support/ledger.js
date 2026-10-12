'use strict';
// The Lift Ledger on the Progress screen, for tests/integration/ledger.test.js and tests/integration/progress.test.js.
//
// The app boots with a document that keeps its elements (tests/support/app.js loadApp, so IA_APP is honoured) and its
// clock pinned. A store is built from a hand table of sessions, never from buildProgram: each session writes an ia_exw_
// entry and an ia_hist_ snapshot, a 'main' session as item 0 of a "Main — <name>" section (the slot rule: item 0 of a
// section whose label starts with Main, not a superset), an 'acc' session into an "Accessory" section. The one app
// function used to build a store is exStoreKey, the single writer of ia_exw_ keys, and only to key it.
// renderProgressScreen and openSwapSheet are called and what they wrote is read back.
const { loadApp, pinClock } = require('./app.js');

const J = JSON.stringify;
const PID = 'ledger';
/** The day every render sees as today (local noon, a Monday). */
const TODAY = new Date(2026, 8, 14, 12, 0, 0);

function ledgerBench() {
  const IA = loadApp({ dom: true });
  pinClock(IA, TODAY);
  const ev = IA.eval;
  const LS = IA.localStorage;
  const resetDom = () => {
    for (const k of Object.keys(IA.els)) delete IA.els[k];
  };
  const html = (id) => (IA.els[id] ? String(IA.els[id].innerHTML || '') : '');

  /**
   * A table in, an ia_exw_ and ia_hist_ pair out. A movement is {name, sessions}; a session is
   * {week, day, slot: 'main' | 'acc', weight, sets: [reps per set], setsReps, detail}.
   */
  function buildStore(table) {
    const exw = {};
    const hist = {};
    table.forEach((mv) => {
      const key = ev('exStoreKey(' + J(mv.name) + ')');
      if (!exw[key]) exw[key] = { name: mv.name, entries: [] };
      mv.sessions.forEach((s, i) => {
        exw[key].entries.push({
          weight: s.weight || 0, setsReps: s.setsReps || '', setsDone: (s.sets || []).slice(), setsW: [],
          week: s.week, day: s.day, ts: s.week * 1000 + i,
        });
        const hk = 'w' + s.week + '_' + s.day;
        if (!hist[hk]) hist[hk] = { sections: [] };
        if (s.slot === 'main') {
          hist[hk].sections.unshift({ label: 'Main — ' + mv.name, items: [{ name: mv.name, detail: s.detail || '3×10' }] });
        } else {
          let acc = hist[hk].sections.find((x) => x.label === 'Accessory');
          if (!acc) {
            acc = { label: 'Accessory', items: [] };
            hist[hk].sections.push(acc);
          }
          acc.items.push({ name: mv.name, detail: s.detail || '3×8–12 @ RPE 8' });
        }
      });
    });
    return { exw, hist, keys: Object.keys(exw) };
  }

  /** Renders the real Progress screen against a store and returns what the athlete sees in #progressBody. */
  function renderProgress(store, unit) {
    LS.clear();
    resetDom();
    const prog = {
      id: PID, name: 'LEDGER', archived: false, totalWeeks: 10, startDate: '2026-01-05', liftingFocus: 'balanced',
      cfg: { name: 'LEDGER', unit: unit || 'lbs', cardioTypes: [], liftingFocus: 'balanced', experience: 'intermediate' },
      weeks: {},
    };
    LS.setItem('ia_programs', J([prog]));
    LS.setItem('ia_exw_' + PID, J(store.exw));
    LS.setItem('ia_hist_' + PID, J(store.hist));
    // the screen shows an empty state unless something was logged
    LS.setItem('ia_logs_' + PID, J({ w1_mon: { rpe: 7, ts: 1 } }));
    ev("activeProgId='" + PID + "'");
    ev('activeProg=' + J(prog));
    ev('progressViewId=null');
    ev('renderProgressScreen()');
    return html('progressBody');
  }

  /** ledgerModel over a store, as plain data. */
  const model = (store) => JSON.parse(ev('JSON.stringify(ledgerModel(' + J(store.exw) + ',' + J(store.hist) + '))'));

  /** Opens the swap sheet on one item of `prog` and returns the tags it printed. */
  function swapTags(prog, week, dayKey, secIdx, itemIdx) {
    resetDom();
    ev("activeProgId='" + PID + "'");
    ev('activeProg=' + J(prog));
    ev('currentWeek=' + week);
    ev("currentDayKey='" + dayKey + "'");
    ev('openSwapSheet(' + secIdx + ',' + itemIdx + ')');
    return html('swapTags');
  }

  return { IA, ev, LS, buildStore, renderProgress, model, swapTags };
}

// ── readers of the rendered Progress screen ──────────────────────────────────────────────────────────────────────────
const CARD_OPEN = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">';
const BLOCK_OPEN = '<div style="padding:12px 0;border-bottom:1px solid var(--border)">';
const FOOT_OPEN = '<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">';
const cards = (h) => h.split(CARD_OPEN).slice(1);
/** The card whose title is `title`, or ''. */
const cardTitled = (h, title) => cards(h).find((c) => c.slice(0, 900).includes(title + '</div>')) || '';
const blocks = (card) => card.split(BLOCK_OPEN).slice(1);
/** The block of the movement `name` on a card, or ''. */
const blockFor = (card, name) => blocks(card).find((b) => b.includes('>' + name + '</div>')) || '';
/** The card's footer, from its last footer opener. */
const footerOf = (card) => {
  const k = card.lastIndexOf(FOOT_OPEN);
  return k < 0 ? '' : card.slice(k);
};
const countOf = (s, needle) => s.split(needle).length - 1;
const textOf = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
/** The week labels a chart printed on its x axis, in order. */
const weekLabels = (block) => (block.match(/>W(\d+)</g) || []).map((s) => +s.replace(/\D/g, ''));
/** The two numbers a footer discloses: [accessory-day sessions, sessions with no load], read from its words. */
function disclosed(foot) {
  const a = foot.match(/(\d+) sessions? where this ran as an accessory/);
  const b = foot.match(/(\d+) sessions? had no load written down/);
  return [a ? +a[1] : 0, b ? +b[1] : 0];
}

/**
 * A Range Ladder log from hand rows {name, week, day, ts, weight, sets, detail}: the entries for one movement and the
 * ia_hist_ snapshots that carry each session's prescription in an "Accessory" section.
 */
function ladderLog(rows) {
  const hist = {};
  const entries = [];
  rows.forEach((r) => {
    hist['w' + r.week + '_' + r.day] = { sections: [{ label: 'Accessory', items: [{ name: r.name, detail: r.detail }] }] };
    entries.push({ week: r.week, day: r.day, ts: r.ts, weight: r.weight, setsDone: r.sets });
  });
  return { hist, entries };
}

module.exports = {
  PID, TODAY, ledgerBench, cards, cardTitled, blocks, blockFor, footerOf, countOf, textOf, weekLabels, disclosed, ladderLog,
};
