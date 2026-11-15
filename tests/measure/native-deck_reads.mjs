// native-deck: what does today's swipe deck reach in the legacy page, and how much of it does core already hold?
// Read-only (measure). The question before the Expo app draws the deck (MIGRATION.md phase 3, the first screen): every
// place today's Angular deck (frontends/app/src/app/screens/deck) and the exercise cards it draws inside each card
// (screens/day-detail/session-sections*.ts) reach into the legacy script, where that name is declared (core, or the
// page), what else in the page it needs, and whether it writes stored state.
//
// Usage: node tests/measure/native-deck_reads.mjs [repo]     (writes tests/measure/native-deck_reads.md beside itself
// when run from tests/measure, else prints)
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = process.argv[2] || join(HERE, '..', '..');
const out = [];
const say = (s = '') => { out.push(s); };
const FILES = [
  ...readdirSync(join(REPO, 'frontends/app/src/app/screens/deck')).filter((x) => x.endsWith('.ts')).map((f) => 'frontends/app/src/app/screens/deck/' + f),
  'frontends/app/src/app/screens/day-detail/session-sections.ts',
  'frontends/app/src/app/screens/day-detail/session-sections-model.ts',
  'frontends/app/src/app/screens/day-detail/session-sections-reads.ts',
];
const PAGE = join(REPO, 'frontends/app/src/legacy/src/js');
const CORE = join(REPO, 'core/src/engine');

const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const stripStrings = (t) => t.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

const decls = new Map();
const START = /^(?:export\s+)?(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([^;=]+?)\s*[=;:])/;
const EDGE = /^(?:export|import|async function|function|const|let|var|class)\b/;
function declared(text) {
  const names = [];
  let depth = 0, open = true;
  const t = stripStrings(text);
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if ('([{<'.includes(ch)) depth++;
    else if (')]}'.includes(ch) || (ch === '>' && t[i - 1] !== '=')) depth--;
    else if (depth === 0 && ch === ';') break;
    else if (depth === 0 && ch === ',') open = true;
    else if (depth === 0 && open && /[A-Za-z_$]/.test(ch)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(t.slice(i));
      names.push(m[0]);
      i += m[0].length - 1;
      open = false;
    } else if (depth === 0 && open && !/\s/.test(ch)) open = false;
  }
  return names;
}
function scan(dir, where) {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts')).sort()) {
    const lines = stripComments(readFileSync(join(dir, f), 'utf8')).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = START.exec(lines[i]);
      if (!m) continue;
      let j = i + 1;
      while (j < lines.length && !EDGE.test(lines[j])) j++;
      const body = lines.slice(i, j).join('\n');
      const names = m[1] ? [m[1]] : declared(body.replace(/^(?:export\s+)?(?:const|let|var)\s+/, ''));
      for (const name of names) {
        if (where === 'page' && decls.has(name) && decls.get(name).where === 'core') continue;
        decls.set(name, { name, file: relative(REPO, join(dir, f)), where, body, lines: body.split('\n').filter((l) => l.trim()).length, shared: names.length > 1 });
      }
    }
  }
}
scan(CORE, 'core');
scan(PAGE, 'page');

/** The page names a declaration reaches, itself included, each once; and the core names it calls. */
function closure(name) {
  const seen = new Map(), core = new Set();
  const walk = (n) => {
    const d = decls.get(n);
    if (!d || seen.has(n)) return;
    if (d.where === 'core') { core.add(n); return; }
    seen.set(n, d);
    if (d.shared) return;
    for (const m of stripStrings(d.body).matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)(?!\s*:(?!:))/g)) if (m[2] !== n) walk(m[2]);
  };
  walk(name);
  return { page: [...seen.values()], core: [...core] };
}
// A core function that writes stored state: its own body calls the store's set or remove.
const coreWrites = (n) => /\bstore\.(?:set|remove)\(|\bwrite[A-Z]\w*\(/.test(stripStrings(decls.get(n)?.body || ''));
const flags = (c) => {
  const t = stripStrings(c.page.map((d) => d.body).join('\n'));
  return [
    /\biaStore\b/.test(t) ? 'store' : '',
    /\biaStore\.(?:set|remove)\(/.test(t) || c.core.some(coreWrites) ? '**writes**' : '',
    /\bdocument\b|\bwindow\b|getElementById|innerHTML|classList/.test(t) ? 'DOM' : '',
    /\bactiveProg(?:Id)?\b|\bcurrentWeek\b|\bcurrentDayKey\b/.test(t) ? 'the active program' : '',
    /Date\.now\(\)|new Date\(\)/.test(t) ? 'clock' : '',
  ].filter(Boolean).join(', ') || 'pure';
};

const NAMED = /\b(?:bridge|b)\.(call|global)(?:<[^(]*>)?\(\s*'([A-Za-z_$][\w$]*)'|\b(call)\('([A-Za-z_$][\w$]*)'/g;
const reaches = new Map();
let counted = 0;
for (const f of FILES) {
  const text = stripComments(readFileSync(join(REPO, f), 'utf8'));
  for (const m of text.matchAll(NAMED)) {
    counted++;
    const how = m[1] || m[3], name = m[2] || m[4];
    const r = reaches.get(name) || { how: new Set(), n: 0, files: new Set() };
    r.how.add(how); r.n++; r.files.add(f.split('/').pop());
    reaches.set(name, r);
  }
}
// The ternaries the regex cannot read: act() picks skip or unskip by a flag.
for (const n of ['skipExercise', 'unskipExercise', 'skipSuperset', 'unskipSuperset']) if (!reaches.has(n)) reaches.set(n, { how: new Set(['call']), n: 1, files: new Set(['deck.ts']) });

// What each reach is for, read off the three components by hand.
const KIND = {
  draw: ['activeProg', 'currentWeek', 'currentDayKey', 'window', '_wildDraw', 'getExWeights', 'entryDay', 'exStoreKey', 'crossProgLastEntry', 'isTimeExercise', 'isKBExercise', 'isRepExercise', 'isTrackableWeight', 'exControlFlags', 'swapOriginOf', 'parseRx', 'rxSuffix', 'setsSummary', 'setsSubLabel', 'setsVaried', 'readSetDraft', 'toDispW', 'isStaleTs', 'recencyLabel', '_stripLeadingSets', '_secRounds', 'getLogs', 'logKey', 'statusOf', 'asyIcon', '_rxCache', '_staleWarnShown', '_staleWarnSrc'],
  log: ['saveExWeight', 'autoSaveSets', 'stepSet', 'setDelta', 'onSetWeight', 'cascadeSetWeights', 'reuseWeight', 'fillAllSetWeights', 'toggleSets'],
  callit: ['snapshotDay', 'saveLogs', 'markDayComplete', 'ruReset', 'fireCompletionPopup', 'showToast'],
  edit: ['skipExercise', 'unskipExercise', 'skipSuperset', 'unskipSuperset', 'openSwapSheet', 'undoSwap', 'removeAddedExercise'],
  shell: ['_setStaleWarnShown', '_setStaleWarnSrc', '_setCurrentDayKey', 'ruResetIfIdle', 'openDetail', 'blurFieldIn', 'renderWeekView'],
};
const kindOf = (n) => Object.keys(KIND).find((k) => KIND[k].includes(n)) || 'unsorted';

const row = (name) => {
  const d = decls.get(name), r = reaches.get(name);
  const from = [...r.files].join(', ');
  if (!d) return '| `' + name + '` | a binding of the page (no declaration found) | | | | ' + from + ' |';
  if (d.where === 'core') return '| `' + name + '` | **core** `' + d.file.replace('core/src/engine/', '') + '` | ' + d.lines + ' | | ' + (coreWrites(name) ? '**writes**' : '') + ' | ' + from + ' |';
  const c = closure(name);
  const others = c.page.filter((x) => x.name !== name);
  const total = c.page.reduce((s, x) => s + x.lines, 0);
  return '| `' + name + '` | page `' + d.file.replace('frontends/app/src/legacy/src/js/', '') + '` | ' + d.lines + ' | '
    + (others.length ? others.length + ' more (' + total + ' lines in all): ' + others.map((x) => '`' + x.name + '`').slice(0, 7).join(', ') + (others.length > 7 ? ', …' : '') : 'none')
    + (c.core.length ? '; core: ' + c.core.slice(0, 6).map((x) => '`' + x + '`').join(', ') + (c.core.length > 6 ? ', …' : '') : '')
    + ' | ' + flags(c) + ' | ' + from + ' |';
};

say('# The swipe deck in the Expo app: what today\'s deck reaches, and what core holds');
say();
say('Written by `node tests/measure/native-deck_reads.mjs` (read-only). The tree it read: the working copy.');
say();
say('- Files read: ' + FILES.map((f) => '`' + f.split('/').slice(-2).join('/') + '`').join(', ') + '.');
say('- Reaches into the legacy script (bridge calls and `global` reads): **' + counted + '**, to **' + reaches.size + '** distinct names.');
say();
const TITLES = {
  draw: 'What the cards are drawn from',
  log: 'Set logging: the handlers a set row, the load field and Log call',
  callit: 'Call it: Mark the day done',
  edit: 'Edits: skip, put back, swap, remove',
  shell: 'Opening, closing and the screens around the deck',
  unsorted: 'Unsorted',
};
const tally = {};
for (const k of Object.keys(TITLES)) {
  const names = [...reaches.keys()].filter((n) => kindOf(n) === k).sort((a, b) => a.localeCompare(b));
  if (!names.length) continue;
  const inCore = names.filter((n) => decls.get(n)?.where === 'core'), inPage = names.filter((n) => decls.get(n)?.where === 'page');
  const lines = new Map();
  for (const n of inPage) for (const d of closure(n).page) lines.set(d.name, d.lines);
  const sum = [...lines.values()].reduce((s, x) => s + x, 0);
  tally[k] = { n: names.length, core: inCore.length, page: inPage.length, lines: sum, names: lines.size };
  say('## ' + TITLES[k] + ' (' + names.length + ' names)');
  say();
  say('| Name | Declared in | Lines | Page names it reaches | It touches | Reached from |');
  say('|---|---|---|---|---|---|');
  names.forEach((n) => say(row(n)));
  say();
  say('In core: **' + inCore.length + '**. In the page: **' + inPage.length + '**, which between them reach **' + lines.size + '** page declarations, **' + sum + '** lines. Bindings with no declaration: ' + (names.length - inCore.length - inPage.length) + '.');
  say();
}
say('## The tally');
say();
say('| Group | Names | In core | In the page | Page declarations behind them | Lines |');
say('|---|---|---|---|---|---|');
for (const [k, t] of Object.entries(tally)) say('| ' + TITLES[k] + ' | ' + t.n + ' | ' + t.core + ' | ' + t.page + ' | ' + t.names + ' | ' + t.lines + ' |');
say();

if (process.env['BODIES']) {
  // The page declarations behind one group, printed whole (for the port): BODIES=draw node …
  const seen = new Map();
  for (const n of [...reaches.keys()].filter((x) => kindOf(x) === process.env['BODIES'])) for (const d of closure(n).page) seen.set(d.name, d);
  for (const d of [...seen.values()].sort((a, b) => a.file.localeCompare(b.file))) console.log('// ── ' + d.name + ' (' + d.file.split('/').pop() + ')\n' + d.body.trimEnd() + '\n');
  process.exit(0);
}
const target = join(HERE, 'native-deck_reads.md');
if (existsSync(join(HERE, 'swipe-deck_day-shapes.md'))) writeFileSync(target, out.join('\n') + '\n');
console.log(out.join('\n'));
