'use strict';
// Helpers for the superset round-count tests (tests/integration/supersets.test.js).
// Rulings: D39 (the round count is a field, never a substring) and D176 (a bare remainder inside a round block reads
// "N reps").
//
// Oracles here are written from the authoring contract, never read back from the app: refItemSets and refStrip parse
// the two authored grammars ('N×reps' and 'N sets — RPE x'), and the lattice is config input typed by hand.
const { fixtures } = require('./app.js');

/** The leading set count of an authored detail, in either grammar; null when it states none. */
function refItemSets(d) {
  const s = String(d == null ? '' : d);
  let m = s.match(/^(\d+)\s*[x×]/);
  if (m) return parseInt(m[1], 10);
  m = s.match(/^(\d+)\s*sets?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

/** The detail with its leading set count removed, the way a round block prints a member. */
function refStrip(d) {
  return String(d == null ? '' : d)
    .replace(/^(\d+)\s*[x×]\s*/, '')
    .replace(/^(\d+)\s*sets?\s+of\s+/i, '')
    .replace(/^(\d+)\s*sets?\s*[—–-]\s*/i, '')
    .replace(/^(\d+)\s*sets?\b\s*/i, '');
}

/** D176: a remainder that is only a count or a range reads "N reps"; every other remainder prints as it is. */
const BARE = /^\d+(\s*[–-]\s*\d+)?$/;
const wantMemberRow = (d) => {
  const r = refStrip(d);
  return r + (BARE.test(r) ? ' reps' : '');
};

const isSuperset = (sec) => !!(sec && (sec.superset || sec.type === 'superset')) && (sec.items || []).length > 1;

/** The text of every `.ex-detail` row in rendered section HTML. */
const renderedDetails = (html) =>
  (String(html).match(/class="ex-detail"[^>]*>([\s\S]*?)<\/div>/g) || []).map((s) =>
    s.replace(/^[\s\S]*?class="ex-detail"[^>]*>/, '').replace(/<\/div>$/, ''),
  );

/** The round sentence a superset header prints. */
const headerText = (html) => (String(html).match(/sshdr-txt">([\s\S]*?)<\/span>/) || [])[1] || '';

/**
 * Calls an app function inside its own realm with JSON arguments and returns its JSON result, so a value never crosses
 * realms half-built.
 */
function callApp(IA, fnName, ...args) {
  const code =
    '(function(){ if(typeof ' + fnName + '!=="function") throw new Error("' + fnName + ' is not defined");' +
    ' var r = ' + fnName + '(' + args.map((a) => JSON.stringify(a)).join(',') + ');' +
    ' return r===undefined ? "__UNDEF__" : JSON.stringify(r); })()';
  const out = IA.eval(code);
  return out === '__UNDEF__' ? undefined : JSON.parse(out);
}

/** Renders sections and hands back the HTML and the section data as it stands after the render. */
function renderAndReturnData(IA, secs) {
  const code =
    '(function(){ var S = ' + JSON.stringify(secs) + '; var h = buildSectionsHTML(S,0);' +
    ' return JSON.stringify({html:h, after:S}); })()';
  return JSON.parse(IA.eval(code));
}

// ── the lattice: goals x focuses x experience x equipment x rest patterns, seed pinned per cell ─────────────────────
const GOALS = {
  run_half: { id: 'run_half', label: 'Half Marathon', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' },
  run_5k: { id: 'run_5k', label: '5K', mileBestMins: '9', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  run_base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  run_pace_goal: { id: 'run_pace_goal', label: 'Pace', mileBestMins: '8', mileBestSecs: '30', baselineDist: '3', baseline: '3mi', targetPace: '7:30' },
};
const FOCUSES = ['support_prevention', 'strength', 'hypertrophy', 'fatloss', 'balanced', 'support_athletic', 'support_strength'];
const EXPS = ['beginner', 'intermediate', 'advanced'];
const EQUIP = ['crossfit', 'commercial', 'home_full', 'home_basic', 'bodyweight'];
const RESTS = [['sun', 'wed'], ['sun'], ['sat', 'sun', 'wed']];

function mkCfg(goal, focus, exp, equip, rest, i) {
  const c = Object.assign({}, fixtures.HALF_MANNY, {
    cardioGoals: { run: GOALS[goal] },
    liftingFocus: focus,
    experience: exp,
    equipment: equip,
    restDays: rest.slice(),
    seed: 76308 + i * 97,
  });
  if (goal !== 'run_half' && goal !== 'run_5k') {
    c.primaryPath = 'body';
    c.eventTargeted = false;
    delete c.raceDate;
  }
  return c;
}

/**
 * The round-count lattice: 4 goals x 7 foci x 3 experience levels x 5 tiers x 3 rest patterns (1,260 cells), keeping
 * every cell whose 1-based index is a multiple of `stride` (3 gives the 420 cells the tests read).
 */
function roundsLattice(stride) {
  const out = [];
  let i = 0;
  for (const g of Object.keys(GOALS))
    for (const f of FOCUSES)
      for (const e of EXPS)
        for (const q of EQUIP)
          for (const r of RESTS) {
            i++;
            if (i % stride !== 0) continue;
            out.push({ key: [g, f, e, q, r.join('+')].join('/'), cfg: mkCfg(g, f, e, q, r, i) });
          }
  return out;
}

/**
 * Builds every cell once and reads what the round-count claims need from the generated sections. Nothing here asks
 * the app what a count should be: every comparison is against refItemSets / refStrip.
 */
function surveyRounds(IA, cells) {
  const out = {
    cells: cells.length, built: 0, errors: [], cfgMutated: 0,
    supersets: 0, noCount: [], nonPositive: [], contradictions: [], desynced: [],
    rows: { sections: 0, rows: 0, bare: 0, nonBare: 0, mismatched: [], renderErrors: [] },
    prevention: { rounds: {}, desynced: [], accessories: 0, accessories3: 0 },
    balancedAccessories3: 0,
  };
  const seen = new Set();
  const accessoryProbe = (it) =>
    it && it.detail && !/warmup|min rest/.test(it.detail) && /@ RPE|sets — RPE/.test(it.detail);
  for (const { key, cfg } of cells) {
    const before = JSON.stringify(cfg);
    let prog;
    try {
      prog = IA.buildProgram(cfg);
      out.built++;
    } catch (e) {
      out.errors.push(key + ': ' + e.message);
      continue;
    }
    if (JSON.stringify(cfg) !== before) out.cfgMutated++;
    const weeks = prog.weeks || {};
    for (const w of Object.keys(weeks))
      for (const d of Object.keys(weeks[w] || {})) {
        const day = weeks[w][d];
        if (!day || !day.sections) continue;
        for (const sec of day.sections) {
          const where = key + ' W' + w + ' ' + d + ' "' + sec.label + '"';
          const parsed = (sec.items || []).map((it) => refItemSets(it && it.detail)).filter((v) => v != null);
          if (isSuperset(sec)) {
            out.supersets++;
            if (typeof sec.rounds !== 'number') out.noCount.push(where + ' rounds=' + JSON.stringify(sec.rounds));
            else if (!(sec.rounds > 0)) out.nonPositive.push(where + ' rounds=' + sec.rounds);
            else if (parsed.some((v) => v !== sec.rounds))
              out.contradictions.push(where + ' rounds=' + sec.rounds + ' members=' + JSON.stringify(sec.items.map((i) => i.detail)));
            if (parsed.length > 1 && new Set(parsed).size > 1)
              out.desynced.push(where + ' ' + JSON.stringify(sec.items.map((i) => i.detail)));
            if (cfg.liftingFocus === 'support_prevention') {
              const r = String(sec.rounds);
              out.prevention.rounds[r] = (out.prevention.rounds[r] || 0) + 1;
              const bad = typeof sec.rounds !== 'number' || parsed.some((v) => v !== sec.rounds) || (parsed.length > 1 && new Set(parsed).size > 1);
              if (bad) out.prevention.desynced.push(where + ' rounds=' + JSON.stringify(sec.rounds) + ' members=' + JSON.stringify(sec.items.map((i) => i.detail)));
            }
            // D176: render each distinct numeric-rounds superset once and read its member rows
            if (typeof sec.rounds === 'number') {
              const k = JSON.stringify(sec);
              if (!seen.has(k)) {
                seen.add(k);
                out.rows.sections++;
                const want = sec.items.map((i) => wantMemberRow(i && i.detail));
                sec.items.forEach((i) => {
                  out.rows.rows++;
                  if (BARE.test(refStrip(i && i.detail))) out.rows.bare++;
                  else out.rows.nonBare++;
                });
                let got;
                try {
                  got = renderedDetails(callApp(IA, 'buildSectionsHTML', [sec], 0));
                } catch (e) {
                  out.rows.renderErrors.push(where + ': ' + e.message);
                  continue;
                }
                if (JSON.stringify(got) !== JSON.stringify(want))
                  out.rows.mismatched.push(where + ' want ' + JSON.stringify(want) + ' got ' + JSON.stringify(got));
              }
            }
            continue;
          }
          for (const it of sec.items || []) {
            if (!accessoryProbe(it)) continue;
            if (cfg.liftingFocus === 'support_prevention') {
              out.prevention.accessories++;
              if (refItemSets(it.detail) === 3) out.prevention.accessories3++;
            } else if (cfg.liftingFocus === 'balanced' && refItemSets(it.detail) === 3) out.balancedAccessories3++;
          }
        }
      }
  }
  return out;
}

module.exports = {
  refItemSets, refStrip, BARE, wantMemberRow, isSuperset, renderedDetails, headerText, callApp, renderAndReturnData,
  roundsLattice, surveyRounds,
};
