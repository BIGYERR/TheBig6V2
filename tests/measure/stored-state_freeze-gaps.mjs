// Measure, before the ninth and last lift slice: refreshProgram (the page's program-manage.ts) and the freeze, what it
// reaches, who calls it, which ia_ keys it reads and writes, and whether the golden records of stored state are blind
// to its rules. A break inside each rule is made in a copy of the built page and the records run against it: the fast
// file first, the sweeps only for a break it lets through. The first row is a control: the log key break, which the
// records turn red, shows the instrument can fire. Read-only: nothing in the working tree is changed.
//
// Run from the repo root, after a build:
//   node tests/measure/stored-state_freeze-gaps.mjs <scratch dir> > tests/measure/stored-state_freeze-gaps.md
//   node tests/measure/stored-state_freeze-gaps.mjs <scratch dir> --dry     (only checks that each break's text occurs once)
//   node tests/measure/stored-state_freeze-gaps.mjs <scratch dir> --reach   (sections 1 to 3 only: no test is run)
//   ... <scratch dir> --after <results.json>   (adds the column of a second run, made with this slice's records)
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
if (!process.argv[2] || process.argv[2].startsWith('--')) { console.error('usage: node tests/measure/stored-state_freeze-gaps.mjs <scratch dir> [--dry | --reach]'); process.exit(2); }
const DRY = process.argv.includes('--dry');
// --after <results.json>: the kept results of a second run, made once this slice's records were in the golden file.
const afterAt = process.argv.indexOf('--after');
const AFTER = afterAt > 0 ? JSON.parse(readFileSync(resolve(process.argv[afterAt + 1]), 'utf8')) : null;
const scratch = resolve(process.argv[2]);
mkdirSync(scratch, { recursive: true });
const page = readFileSync(join(ROOT, 'dist-' + 'github-pages', 'index.html'), 'utf8');
const version = (page.match(/name="ia-version" content="([^"]+)"/) || [])[1];
const FN = 'refreshProgram';

// ── 1. The reach: every name of the page or of core the function's code uses, comments stripped. ─────────────────────
const PAGE_JS = join(ROOT, 'frontends', 'app', 'src', 'legacy', 'src', 'js');
const CORE = join(ROOT, 'core', 'src', 'engine');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const decl = new Map();   // name -> where it is declared
for (const [dir, label] of [[PAGE_JS, 'page'], [CORE, 'core']]) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const src = strip(readFileSync(join(dir, f), 'utf8'));
    for (const m of src.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
      const n = m[1] || m[2];
      if (!decl.has(n)) decl.set(n, label + ' `' + f + '`');
    }
  }
}
/** The text of a top-level function of the built page, from its `function name(` to the closing brace at column 0.
 *  A name declared twice in the page (the inline script keeps the last) reads as its last declaration. */
const body = (name) => {
  const a = page.lastIndexOf('\nfunction ' + name + '(');
  if (a < 0) return '';
  const eol = page.indexOf('\n', a + 1);
  if (page.slice(a + 1, eol).trimEnd().endsWith('}')) return page.slice(a + 1, eol);   // a function written on one line
  const b = page.indexOf('\n}\n', a);
  return page.slice(a + 1, b + 2);
};
const declaredTimes = (name) => page.split('\nfunction ' + name + '(').length - 1;
const uses = (name) => {
  const text = body(name).replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
  const ids = new Set([...text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  ids.delete(name);
  return [...ids].filter((n) => decl.has(n)).sort();
};
const lines = (name) => body(name).split('\n').filter((l) => l.trim()).length;
/** What a function's own text does besides arithmetic: the document, the page's state, the clock, the console. */
const touches = (name) => {
  const t = body(name), out = [];
  if (/\bdocument\b|\bwindow\b/.test(t)) out.push('the document');
  if (/\bactiveProg\b|\bactiveProgId\b|\bcurrentWeek\b|\bcurrentDayKey\b/.test(t)) out.push('the page\'s state');
  if (/new Date\(\)|Date\.now\(\)/.test(t)) out.push('the clock');
  if (/\bconsole\./.test(t)) out.push('the console');
  if (/\biaStore\b/.test(t)) out.push('the store');
  return out.join(', ') || 'nothing';
};
const keysOf = (name) => [...new Set(body(name).match(/ia_[a-z]+_?/g) || [])];
const reach = [];
const seen = new Set([FN]);
const walk = (name, depth) => {
  for (const n of uses(name)) {
    if (seen.has(n)) continue;
    seen.add(n);
    const where = decl.get(n);
    reach.push({ n, where, depth, from: name, lines: lines(n) || '', uses: uses(n), keys: keysOf(n), touches: touches(n), twice: declaredTimes(n) > 1 });
    if (where.startsWith('page')) walk(n, depth + 1);   // a core name is already where it must be
  }
};
walk(FN, 1);

// ── 2. The callers: every call of a name in the built page, by the function it is made from. ─────────────────────────
const callsIn = (name) => {
  const out = [];
  const re = new RegExp('(?<![.\\w$])' + name.replace('$', '\\$') + '\\(', 'g');
  for (const m of page.matchAll(re)) {
    if (page.slice(m.index - 9, m.index) === 'function ') continue;
    const before = page.lastIndexOf('\nfunction ', m.index);
    const fn = (page.slice(before + 10, before + 80).match(/^([\w$]+)/) || [])[1] || '(top level)';
    out.push(fn);
  }
  return out;
};
const tally = (a) => { const t = {}; a.forEach((x) => { t[x] = (t[x] || 0) + 1; }); return Object.keys(t).sort().map((k) => (t[k] > 1 ? k + ' ×' + t[k] : k)); };

// ── 3. The keys: every store call in the function itself, and through the names it reaches. ──────────────────────────
const KEY_ROWS = [
  ['ia_programs', 'read', 'the seed fallback and the test week backfill, each before it saves (`getPrograms`, core\'s `readPrograms`)'],
  ['ia_programs', 'WRITE', 'the seed fallback: the stored config gains `seed`. The test week backfill: the stored config gains `_testWeek` and `_raceDateCappedWeeks` (`savePrograms`, core\'s `writePrograms`)'],
  ['ia_comp_<id>', 'read', 'the freeze: a day with a completion is touched'],
  ['ia_logs_<id>', 'read', 'the freeze: a day with a log is touched'],
  ['ia_hist_<id>', 'read, twice', 'the freeze: a day with a snapshot is touched, and the snapshot is the day it gives back'],
  ['ia_exw_<id>', 'read', 'the freeze: a logged lift touches its week and day (core\'s `entryDay`)'],
  ['ia_moves_<id>', 'read', 'the rest day moves laid back on the grid (`applyRestDayMoves`)'],
  ['ia_swaps_<id>', 'read', 'the session swaps laid back on the grid (`getSwaps`, core\'s `readSwaps`; `applySessionSwaps`)'],
  ['ia_edits_<id>', 'read, twice', 'the prune, then the adds and skips laid back on the grid (`getDayEdits`, core\'s `readDayEdits`; `applyDayEdits`)'],
  ['ia_edits_<id>', 'WRITE', 'the prune: the edits of every week below the freeze cut are dropped, when there are any (`pruneDayEdits`, core\'s `pruneDayEditsBefore`)'],
];

// ── 4. The breaks: a line of a rule changed, in a copy of the page. ─────────────────────────────────────────────────
// group, name, the rule, what the break does, then the exact text (once in the page) and its replacement; a break of
// two places gives a list of [text, replacement] pairs.
const SWAPS_CALL = 'if(Object.keys(_swLive).length) applySessionSwaps(rebuilt,_swLive);';
const MOVES_CALL = 'if(_mv&&Object.keys(_mv).length) applyRestDayMoves(rebuilt,_mv);';
const EDITS_CALL = 'if(_ed&&Object.keys(_ed).length) applyDayEdits(rebuilt,_ed);';
const PRUNE_CALL = "if(typeof _swapCut==='number') pruneDayEdits(prog.id,_swapCut);";
const BREAKS = [
  ['control', 'log key (control)', 'the control', 'a log is stored under w1-mon', "function logKey(w,d){return dayStoreKey(w,d);}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  // The second control: a break the fast file lets through and the sweeps turn red (the break check's "overlay clean
  // injury build"), so a green from the sweeps here is read from an instrument shown to fire.
  ['control', 'injury built as a trip (control, the sweeps)', 'the control for the sweeps', 'an injury builds as a temporary setup', ': {...prog.cfg, ...ov.patch});', ': {...prog.cfg, ...ov.patch, _travel:true});'],

  ['seed fallback', 'guard, no config', 'a program with no config is handed back as stored', 'a program with no config goes on to the rebuild', 'if(!prog || !prog.cfg) return prog;', 'if(!prog) return prog;'],
  ['seed fallback', 'seed, none anywhere', 'a program with no seed anywhere is handed back as stored', 'a program with no seed is rebuilt', 'if(prog.seed == null) return prog;', ''],
  ['seed fallback', 'seed, into the config', 'an older program\'s seed is put into its config', 'the config stays without its seed', '    prog.cfg.seed = prog.seed;\n', '\n'],
  ['seed fallback', 'seed, saved', 'the seed put back is written to ia_programs', 'the seed is put back in hand only', '_ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed}; savePrograms(_ps);', '_ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};'],
  ['seed fallback', 'seed, saved on its program', 'the seed is written to the stored program of the same id', 'the seed is written to the first stored program', 'const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};', 'const _pi=0; if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};'],

  ['test week backfill', 'test week, only when unset', 'a program with a pinned test week is left alone', 'every program derives its test week again at each launch', 'if(prog.cfg._testWeek == null){', 'if(true){'],
  ['test week backfill', 'test week, backfilled', 'a dated test with no pinned week pins it at launch', 'no test week is ever backfilled', 'if(prog.cfg._testWeek == null){', 'if(false){'],
  ['test week backfill', 'test week, needs a week', 'a test before the start or past week 26 pins nothing', 'a test with no week still writes the two keys', 'if(_tp && _tp.tw){', 'if(_tp){'],
  ['test week backfill', 'test week, a past test', 'a test already past pins nothing and writes nothing', 'a past test pins', 'if(!(_rd && _td && _rd < _td)){', 'if(true){'],
  ['test week backfill', 'test week, set', 'the pinned week goes into the config', 'the config gets the length and not the week', '        prog.cfg._testWeek = _tp.tw;\n', '\n'],
  ['test week backfill', 'test week, length', 'the program\'s length is capped at the test week', 'the config gets the week and not the length', 'prog.cfg._raceDateCappedWeeks = _tp.tw;', ''],
  ['test week backfill', 'test week, saved', 'the pin is written to ia_programs', 'the pin is in hand only', '_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks}; savePrograms(_ps);', '_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks};'],
  ['test week backfill', 'test pin, goal family', 'only a pace test goal pins', 'any run goal with a date pins', '!PACE_GOALS.has(g.id) || ', ''],
  ['test week backfill', 'test pin, event off', 'a goal with its event switched off pins nothing', 'it pins', 'c.eventTargeted === false || !c.raceDate) return null;', '!c.raceDate) return null;'],
  ['test week backfill', 'test pin, week range', 'a test week outside 1 to 26 pins nothing', 'any week pins', 'return {tw: (week >= 1 && week <= cap) ? week : null, len, week, cap};', 'return {tw: week, len, week, cap};'],

  ['pace clock', 'pace shift, set', 'an injury that stops quality running sets the pace shift on the config before the build', 'no pace shift is ever set', 'if(_psm) prog.cfg._paceShift=_psm; else delete prog.cfg._paceShift;', 'delete prog.cfg._paceShift;'],
  ['pace clock', 'pace shift, cleared', 'a pace shift that no longer derives is deleted from the config', 'an old pace shift outlives its overlays', 'if(_psm) prog.cfg._paceShift=_psm; else delete prog.cfg._paceShift;', 'if(_psm) prog.cfg._paceShift=_psm;'],
  ['pace clock', 'pace map, modes', 'only an injury whose plan touches running counts', 'every injury with a cardio mode counts', 'if(!P||!P.cardioMode||!SUP[P.cardioMode]) return;', 'if(!P||!P.cardioMode) return;'],
  ['pace clock', 'pace map, half step', 'a half step week never counts', 'a half step week counts', 'if(inj.halfstep) return;', ''],
  ['pace clock', 'pace map, open end', 'an injury with no end counts to today', 'an injury with no end counts to the program\'s end', 'let t=ov.to?_parseLocalDate(ov.to):today;', 'let t=ov.to?_parseLocalDate(ov.to):end;'],
  ['pace clock', 'pace map, from the start', 'days before the program\'s first Monday do not count', 'they count', 'const lo=Math.max(f.getTime(),mon.getTime());', 'const lo=f.getTime();'],
  ['pace clock', 'pace map, days before the week', 'a week is shifted by the days hurt before it', 'a week is shifted by the days hurt through its Monday', 'const hi=Math.min(s[1],wkStart-86400000);', 'const hi=Math.min(s[1],wkStart);'],
  ['pace clock', 'pace map, floor of one', 'any day hurt shifts the clock by at least a week', 'one to three days hurt shift nothing', 'map[w]=days>0?Math.max(1,Math.round(days/7)):0;', 'map[w]=days>0?Math.round(days/7):0;'],
  ['pace clock', 'pace map, merged spans', 'overlapping injuries count a day once', 'overlapping injuries count a day twice', 'if(spans[k][0]<=m[1]+86400000) m[1]=Math.max(m[1],spans[k][1]);\n    else merged.push(spans[k].slice());', 'merged.push(spans[k].slice());'],

  ['rebuild', 'rebuild, id', 'the rebuilt program keeps its id', 'it carries the build\'s own id', 'rebuilt.id = prog.id;', ''],
  ['rebuild', 'rebuild, name', 'the rebuilt program keeps its name', 'it carries the build\'s name', 'rebuilt.name = prog.name;', ''],
  ['rebuild', 'rebuild, created', 'the rebuilt program keeps when it was made', 'it carries the instant of this launch', 'rebuilt.created = prog.created;', ''],
  ['rebuild', 'rebuild, start', 'the rebuilt program keeps its start', 'it has no start', 'rebuilt.startDate = prog.startDate;', ''],
  ['rebuild', 'rebuild, block open', 'the rebuilt program keeps where its block opened', 'it has none', 'rebuilt.blockOpen = prog.blockOpen;', ''],
  ['rebuild', 'rebuild, seed', 'the rebuilt program keeps the stored program\'s own seed', 'it carries the config\'s', 'rebuilt.seed = prog.seed;', ''],
  ['rebuild', 'rebuild, overlays', 'the rebuilt program keeps its overlays', 'it has none', 'rebuilt.overlays = Array.isArray(prog.overlays) ? prog.overlays : [];', 'rebuilt.overlays = [];'],
  ['rebuild', 'rebuild, failure', 'a program the engine cannot build is handed back as stored', 'nothing is handed back', "console.error('refreshProgram failed; using stored program', e);\n    return prog;", "console.error('refreshProgram failed; using stored program', e);\n    return null;"],

  ['overlay splice', 'splice, called', 'the overlays are spliced into the rebuilt grid', 'no overlay is spliced', '    applyOverlays(prog, rebuilt);\n', '\n'],
  ['overlay splice', 'order, splice before the freeze', 'the freeze has the last word over an overlay', 'the overlays are spliced after the freeze', [['    applyOverlays(prog, rebuilt);\n', '\n'], ['    try{\n      const _mv=JSON.parse(', '    applyOverlays(prog, rebuilt);\n    try{\n      const _mv=JSON.parse(']]],
  ['overlay splice', 'week of a date, before the start', 'a date before the program reads as week one', 'it reads as a week before one', 'return diff<0 ? 1 : Math.floor(diff/7)+1;', 'return Math.floor(diff/7)+1;'],
  ['overlay splice', 'overlay range, clamped', 'an overlay\'s weeks are clamped to the program', 'they are not clamped', 'const lo=Math.max(1,fw), hi=Math.min(totalWeeks,tw);', 'const lo=fw, hi=tw;'],
  ['overlay splice', 'overlay range, no end', 'an overlay with no end runs to the last week', 'it covers its first week only', 'const tw = ov.to ? weekOfDate(prog, ov.to) : totalWeeks;', 'const tw = ov.to ? weekOfDate(prog, ov.to) : fw;'],
  ['overlay splice', 'day date', 'a program day\'s date is its week\'s Monday plus its weekday', 'every day reads a day late', 'dt.setDate(mon.getDate()+(week-1)*7+off);', 'dt.setDate(mon.getDate()+(week-1)*7+off+1);'],

  ['freeze', 'freeze, the stored length', 'the current week is capped at the stored length first', 'it is capped at the rebuilt length', 'const _tw = prog.totalWeeks || rebuilt.totalWeeks || 6;', 'const _tw = rebuilt.totalWeeks || 6;'],
  ['freeze', 'freeze, no clock', 'a program with no start still freezes by what was touched', 'the freeze fails for it and every week is rebuilt', 'const _hasClock = !!prog.startDate;', 'const _hasClock = true;'],
  ['freeze', 'freeze, week count', 'the current week is counted from the start\'s Monday', 'it is counted a day late', 'const _diff = Math.floor((_today - _mon)/86400000);', 'const _diff = Math.floor((_today - _mon)/86400000)-1;'],
  ['freeze', 'freeze, before the start', 'before the start the current week is one', 'it is a week before one', '_curWk = _diff < 0 ? 1 : Math.min(_tw, Math.floor(_diff/7)+1);', '_curWk = Math.min(_tw, Math.floor(_diff/7)+1);'],
  ['freeze', 'freeze, past the end', 'after the last week the current week is the last', 'it runs past the end', '_curWk = _diff < 0 ? 1 : Math.min(_tw, Math.floor(_diff/7)+1);', '_curWk = _diff < 0 ? 1 : Math.floor(_diff/7)+1;'],
  ['freeze', 'touched, completion', 'a completion proves a day was seen', 'it proves nothing', "try{ Object.assign(_touched, JSON.parse(iaStore.get('ia_comp_'+prog.id)||'{}')); }catch(e){}", ''],
  ['freeze', 'touched, log', 'a log proves a day was seen', 'it proves nothing', "try{ Object.assign(_touched, JSON.parse(iaStore.get('ia_logs_'+prog.id)||'{}')); }catch(e){}", ''],
  ['freeze', 'touched, snapshot', 'a snapshot proves a day was seen', 'it proves nothing to the cut', "try{ Object.assign(_touched, JSON.parse(iaStore.get('ia_hist_'+prog.id)||'{}')); }catch(e){}", ''],
  ['freeze', 'touched, lift log', 'a logged lift proves its day was seen', 'it proves nothing', "_touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;", ''],
  ['freeze', 'touched, lift log day', 'a logged lift freezes its own day', 'it moves the cut and freezes no day', "_touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;", "_touched['w'+_wn+'_'] = true;"],
  ['freeze', 'touched, lift log week', 'a logged lift with no week proves nothing', 'it writes a key for week zero or none', 'if(!(_wn > 0)) return;', ''],
  ['freeze', 'cut, the current week touched', 'a touched current week is frozen whole', 'the date cut stops at the current week', 'const _dateCut = _curWk + (_curTouched ? 1 : 0);', 'const _dateCut = _curWk;'],
  ['freeze', 'cut, the date', 'every week before the current one is frozen, touched or not', 'only weeks up to the furthest touched are frozen', 'const _cut = Math.max(_dateCut, _maxTouched + 1);', 'const _cut = _maxTouched + 1;'],
  ['freeze', 'cut, the furthest touched', 'every week up to the furthest touched is frozen, wherever the date is', 'only the date decides', 'const _cut = Math.max(_dateCut, _maxTouched + 1);', 'const _cut = _dateCut;'],
  ['freeze', 'cut, the furthest touched week itself', 'the furthest touched week is frozen', 'the cut stops a week short of it', 'const _cut = Math.max(_dateCut, _maxTouched + 1);', 'const _cut = Math.max(_dateCut, _maxTouched);'],
  ['freeze', 'freeze, reach', 'every week below the cut is frozen', 'the last frozen week is rebuilt', 'for(let w=1; w<_cut; w++){', 'for(let w=1; w<_cut-1; w++){'],
  ['freeze', 'freeze, written', 'a frozen week replaces the rebuilt one', 'no week is frozen', 'rebuilt.weeks[w] = _merged;', ''],
  ['freeze', 'freeze, history', 'a day with a snapshot is given back from it', 'a snapshot is not read back', 'if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }', ''],
  ['freeze', 'freeze, piercing', 'the current week and later take live days where untouched', 'no frozen week is pierced', 'const _pierce = w >= _curWk;', 'const _pierce = false;'],
  ['freeze', 'pierce, new days', 'a pierced week gains a day the rebuild has and the stored grid lacks', 'it keeps the stored days only', 'Object.keys(_live).forEach(d=>{ if(!_seen.has(d)){ _seen.add(d); _days.push(d); } });', ''],
  ['freeze', 'past week, stored days only', 'a week behind the current one keeps the stored set of days', 'it gains the rebuild\'s days too', 'if(_pierce){\n            _days = [];', 'if(true){\n            _days = [];'],
  ['freeze', 'injury cover, kind', 'only an injury covers a week', 'a trip covers it too', ".filter(ov => ov && ov.type==='injury' && ov.patch && ov.patch.injury)", '.filter(ov => ov && ov.patch)'],
  ['freeze', 'freeze, injured week', 'a touched day with no snapshot, in a week an injury covers, takes the live day', 'it keeps its stored form', 'if(_injCovers(w) && _live[d]){ _merged[d] = _live[d]; return; }', ''],
  ['freeze', 'touched day, stored form', 'a touched day with no snapshot keeps its stored form', 'it takes the live day', '_merged[d] = _stored[d] || _live[d];\n              return;', '_merged[d] = _live[d];\n              return;'],
  ['freeze', 'touched day, live fallback', 'a touched day the stored grid lacks takes the live day', 'it is dropped', '_merged[d] = _stored[d] || _live[d];\n              return;', '_merged[d] = _stored[d];\n              return;'],
  ['freeze', 'untouched day, pierced week', 'an untouched day of a pierced week takes the live day', 'it keeps its stored form', 'if(_pierce && _live[d]){ _merged[d] = _live[d]; return; }', ''],
  ['freeze', 'untouched day, past week', 'an untouched day of a past week keeps its stored form', 'it takes the live day', '_merged[d] = _stored[d] || _live[d];\n          });', '_merged[d] = _live[d];\n          });'],
  ['freeze', 'empty days dropped', 'a day with nothing on either side is left out of the week', 'it stays as an empty key', 'Object.keys(_merged).forEach(d=>{ if(!_merged[d]) delete _merged[d]; });', ''],

  ['rest day moves', 'moves, replayed', 'a moved rest day is laid back on the rebuilt grid', 'no move is replayed', MOVES_CALL, ''],
  ['rest day moves', 'order, moves before swaps', 'the moves are laid before the swaps and the edits', 'the moves are laid after the swaps', [[MOVES_CALL, ''], [PRUNE_CALL, "try{const _mv2=JSON.parse(iaStore.get('ia_moves_'+prog.id)||'{}'); if(_mv2&&Object.keys(_mv2).length) applyRestDayMoves(rebuilt,_mv2);}catch(e){} " + PRUNE_CALL]]],
  ['rest day moves', 'move, already applied', 'a move a frozen week already holds is not applied again', 'it is applied again', 'if(wk[dest]&&wk[dest].movedFrom===origin) return;', ''],
  ['rest day moves', 'move, source', 'a rest day or a day already moved is never the source', 'it can be', 'const src=wk[origin]; if(!src||src.rest||src.moved) return;', 'const src=wk[origin]; if(!src) return;'],
  ['rest day moves', 'move, mark', 'the moved session says where it came from', 'it does not', 'wk[dest]={...src, movedFrom:origin};', 'wk[dest]={...src};'],
  ['rest day moves', 'move, origin rests', 'the day a session left becomes a rest day', 'the session shows on both days', "wk[origin]={title:src.title,dot:'rest',tags:['rest'],rest:true,moved:true,movedTo:dest};", ''],
  ['rest day moves', 'move, old form', 'a move stored as a plain day name is read', 'it is not', "const origin=(typeof mv==='string')?mv:mv.from;", 'const origin=mv.from;'],

  ['session swaps', 'swaps, replayed', 'a session swap is laid back on the rebuilt day', 'no swap is replayed', SWAPS_CALL, ''],
  ['session swaps', 'swaps, restored days', 'a day given back from its snapshot gets no replay', 'its swaps are replayed onto the snapshot', 'Object.keys(_sw).forEach(k=>{ if(!_histRestored.has(k)) _swLive[k]=_sw[k]; });', 'Object.keys(_sw).forEach(k=>{ _swLive[k]=_sw[k]; });'],
  ['session swaps', 'swap replay, order', 'a day\'s swaps replay in the order made', 'they replay newest first', 'const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);', 'const list=(store[k]||[]).filter(e=>e&&e.from&&e.to).reverse();'],
  ['session swaps', 'swap replay, applied', 'each swap renames its lift on the day', 'no lift is renamed', 'if(applySwapPrefs(day.sections,m1)) hit=true;', 'hit=true;'],
  ['session swaps', 'swap replay, injury filter', 'a swapped day under an injury goes through the injury filter again', 'it does not', 'if(hit && _dayPlanCfg(prog,day).injury){', 'if(false){'],
  ['session swaps', 'swap replay, hold kept', 'a renamed lift carries its dose from before the filter', 'it does not', "_renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });", ''],
  ['session swaps', 'swap replay, the day\'s plan', 'the injury that governs a day is its own overlay\'s', 'it is the config\'s', 'return Object.assign({},base,{injury:ov.patch.injury});', 'return base;'],

  ['day edits', 'edits, pruned at launch', 'the edits of every week below the cut are dropped at launch', 'none is dropped', PRUNE_CALL, ''],
  ['day edits', 'edits, the prune cut', 'the prune stops at the freeze cut', 'it takes the cut week too', PRUNE_CALL, "if(typeof _swapCut==='number') pruneDayEdits(prog.id,_swapCut+1);"],
  ['day edits', 'edits, replayed', 'adds and skips are laid back on the rebuilt day', 'none is replayed', EDITS_CALL, ''],
  ['day edits', 'order, swaps before edits', 'the edits are laid after the swaps', 'the edits are laid before the swaps', [[EDITS_CALL, ''], ['const _sw=getSwaps(prog.id)||{}, _swLive={};', '{' + PRUNE_CALL + ' const _ed0=getDayEdits(prog.id); if(_ed0&&Object.keys(_ed0).length) applyDayEdits(rebuilt,_ed0);} const _sw=getSwaps(prog.id)||{}, _swLive={};']]],
  ['day edits', 'edit replay, skip', 'a skipped movement is flagged', 'it is not', 'it._skipped = (skips.indexOf(it.name)>=0) || undefined;', ''],
  ['day edits', 'edit replay, round', 'a skipped round is flagged whole', 'it is not', 'if(sec.superset) sec._skipped=ssKilled||undefined;', ''],
  ['day edits', 'edit replay, added block', 'the athlete\'s own added block is never flagged skipped', 'it can be', 'if(sec._added) return;', ''],
  ['day edits', 'edit replay, add', 'an added movement is put on the day', 'it is not', "bucket.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});", ''],
  ['day edits', 'edit replay, add once', 'an added movement already on the day is not added again', 'it is added again', 'if(bucket.items.some(function(it){return it.name===a.name;})) return;', ''],
  ['day edits', 'edit replay, add mark', 'an added movement is marked the athlete\'s', 'it is not', "bucket.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});", "bucket.items.push({name:a.name,detail:a.detail||''});"],
];
// ── 5. Why a break stays green: read by hand from the code, one line a break (the report prints it beside the result). ─
// 'record': a history the records do not hold would show it. 'none': the break changes nothing a launch can reach.
const OLD = 'record: an older program, by hand (no history holds one)';
const DIFF = 'record: a stored grid that differs from the rebuild (every history\'s stored grid is the same engine\'s build of the same config)';
const NOSNAP = 'record: a touched day with no snapshot (every touch snapshots its day now, so a launch gives it back from the snapshot and this never decides)';
const WHY = {
  'guard, no config': 'record: a stored program with no config (hostile, by hand)',
  'seed, none anywhere': OLD + ': no seed on the program or in its config',
  'seed, saved on its program': 'record: an older program that is not the first in the list',
  'test week, only when unset': 'record: a program pinned to a week its dates no longer give (hostile, by hand)',
  'test week, backfilled': OLD + ': a dated pace test with no pinned week',
  'test week, needs a week': OLD + ': a dated pace test past week 26',
  'test week, a past test': OLD + ': a dated pace test already past at the launch',
  'test week, set': OLD + ': a dated pace test with no pinned week',
  'test week, length': OLD + ': a dated pace test with no pinned week',
  'test week, saved': OLD + ': a dated pace test with no pinned week',
  'test pin, event off': OLD + ': a dated pace test with its event switched off',
  'test pin, week range': OLD + ': a dated pace test past week 26',
  'pace shift, cleared': 'record: a stored config that still holds a pace shift after its injury is gone',
  'pace map, modes': 'record: an injury whose plan leaves running alone (a shoulder)',
  'pace map, from the start': 'record: an injury dated before the program\'s first Monday',
  'pace map, merged spans': 'record: two injuries that overlap',
  'rebuild, name': 'record: the program in hand, with its name (the records hold the grid in hand, not its name)',
  'rebuild, created': 'record: the program in hand, with when it was made',
  'rebuild, seed': 'record: the program in hand, with its seed, where the program\'s differs from its config\'s (by hand)',
  'rebuild, failure': 'record: a stored config the engine cannot build (hostile, by hand)',
  'week of a date, before the start': 'none in the grid\'s path: overlayWeekRange clamps the week to one again. The overlay sheet\'s "picks your program back up" line reads it too, and there it cannot matter either (a week below one is never past the last). Held by a unit test',
  'overlay range, clamped': 'record: a trip booked wholly after the last week, which the sheet refuses',
  'freeze, the stored length': DIFF + ', with another length: a goal changed mid program',
  'freeze, no clock': OLD + ': no start date, and a stored grid that differs from the rebuild',
  'freeze, week count': DIFF + ', launched on a Monday',
  'freeze, before the start': 'none: before the start the broken week is zero or less, the cut is still the furthest touched week plus one, and every week from one on is still pierced',
  'freeze, past the end': DIFF + ', launched after the last week',
  'touched, completion': NOSNAP + ', touched by a completion alone',
  'touched, log': NOSNAP + ', touched by a log alone',
  'touched, snapshot': DIFF + ', on a day whose only record is its snapshot',
  'touched, lift log': NOSNAP + ', touched by a logged lift alone',
  'touched, lift log day': NOSNAP + ', touched by a logged lift alone',
  'touched, lift log week': 'none: a key for week zero or for no week matches no real day, and never raises the furthest touched week',
  'cut, the current week touched': 'none (open since v0.261.5): a touched current week already puts the furthest touched week plus one at the same cut',
  'cut, the furthest touched': DIFF + ', after the start is moved later than a trained week',
  'cut, the furthest touched week itself': DIFF + ', after the start is moved later than a trained week',
  'pierce, new days': OLD + ': a stored week that lacks a day the rebuild has',
  'past week, stored days only': OLD + ': a stored past week that lacks a day the rebuild has',
  'injury cover, kind': NOSNAP + ', in a week a trip covers',
  'touched day, stored form': NOSNAP + ', and a stored grid that differs from the rebuild',
  'touched day, live fallback': NOSNAP + ', on a day the stored week lacks',
  'empty days dropped': 'none a record can hold: the grid in hand is recorded as JSON, which leaves an empty day out either way. Held by a unit test on the week\'s keys',
  'order, moves before swaps': NOSNAP + ': a swap made on a day a session was moved onto',
  'move, source': 'record: a move whose source day has since become a rest day (a goal changed mid program)',
  'move, old form': OLD + ': a move stored as a plain day name',
  'swaps, restored days': 'record: a launch after a lift traded off was added back to its own day (the replay would rename it again)',
  'swap replay, order': NOSNAP + ', with two swaps in a chain',
  'swap replay, injury filter': NOSNAP + ', swapped, in an injured week',
  'swap replay, hold kept': NOSNAP + ', swapped, in an injured week',
  'swap replay, the day\'s plan': NOSNAP + ', swapped, in an injured week',
  'edits, the prune cut': NOSNAP + ': an edit in the cut week itself',
  'edits, replayed': NOSNAP + ', with an add and a skip',
  'order, swaps before edits': NOSNAP + ', with a swap and then a skip of the lift traded in',
  'edit replay, skip': NOSNAP + ', with a skip',
  'edit replay, round': NOSNAP + ', with a skipped round',
  'edit replay, added block': 'none: edits are laid only on a week at or above the cut, which the freeze never fills, so the day is the engine\'s fresh build and holds no added block when the skips are flagged. Held by a unit test',
  'edit replay, add': NOSNAP + ', with an add',
  'edit replay, add once': 'none: edits are laid only on a week at or above the cut, a fresh build each launch, and each day is laid once, so the movement is never already there. Held by a unit test',
  'edit replay, add mark': NOSNAP + ', with an add',
};
const pairsOf = (b) => (Array.isArray(b[4]) ? b[4] : [[b[4], b[5]]]);
const countOf = (text) => page.split(text).length - 1;

/** Sections 1 to 3 of the report: the reach, the callers and the keys, read off the page with no test run. */
const head = () => {
  const L = [];
  L.push(`# Stored state: refreshProgram and the freeze, its reach, its callers, its keys, and are the records blind to its rules? (on ${version})`);
  L.push('');
  L.push('Written by `tests/measure/stored-state_freeze-gaps.mjs` (read-only), from the built page and the source files.');
  L.push('');
  L.push('## 1. What the function reaches');
  L.push('');
  L.push(`\`${FN}\` is ${lines(FN)} lines of the built page. It uses these names of the page and of core; a page name's own reach is followed, a core name's is not. "Reads besides its arguments" is read off each function's own text.`);
  L.push('');
  L.push('| Name | Declared in | Depth | Reached from | Lines | Names it uses | ia_ keys it names | Reads besides its arguments |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const r of reach) L.push('| `' + r.n + '`' + (r.twice ? ' (declared twice in the page; the last one runs)' : '') + ' | ' + [r.where, r.depth, '`' + r.from + '`', r.lines, r.uses.join(', ') || 'none', r.keys.join(', ') || 'none', r.touches].join(' | ') + ' |');
  L.push('');
  const pageNames = reach.filter((r) => r.where.startsWith('page'));
  L.push(`Page names reached: ${pageNames.length} (${pageNames.map((r) => '`' + r.n + '`').join(', ')}). Core names reached: ${reach.length - pageNames.length}.`);
  L.push('');
  L.push(`\`${FN}\` itself reads besides its arguments: ${touches(FN)}. ia_ keys named in its own text: ${keysOf(FN).join(', ')}. Store calls in it (\`iaStore\`): ${body(FN).split('iaStore').length - 1}.`);
  L.push('');
  L.push('## 2. Who calls it, and who calls what it reaches in the page');
  L.push('');
  L.push('| Name | Calls in the built page | From | Calls not from `' + FN + '` or its reach |');
  L.push('|---|---|---|---|');
  const inside = new Set([FN, ...pageNames.map((r) => r.n)]);
  for (const n of [FN, ...pageNames.map((r) => r.n)]) {
    const c = callsIn(n);
    L.push('| `' + n + '` | ' + c.length + ' | ' + tally(c).join(', ') + ' | ' + c.filter((f) => !inside.has(f)).length + ' |');
  }
  L.push('');
  L.push('## 3. The keys it reads and writes');
  L.push('');
  L.push('| Key | Read or written | Where |');
  L.push('|---|---|---|');
  for (const r of KEY_ROWS) L.push('| `' + r[0] + '` | ' + r[1] + ' | ' + r[2] + ' |');
  L.push('');
  return L;
};
if (process.argv.includes('--reach')) { process.stdout.write(head().join('\n') + '\n'); process.exit(0); }

if (DRY) {
  let bad = 0;
  for (const b of BREAKS) for (const [from] of pairsOf(b)) { const n = countOf(from); if (n !== 1) { bad++; console.log(b[1] + ': the text occurs ' + n + ' times: ' + JSON.stringify(from.slice(0, 70))); } }
  const names = BREAKS.map((b) => b[1]);
  names.forEach((n, i) => { if (names.indexOf(n) !== i) { bad++; console.log('a name used twice: ' + n); } });
  console.log(BREAKS.length + ' breaks, ' + bad + ' not ready');
  process.exit(bad ? 1 : 0);
}

const runFiles = (app, files) => new Promise((done) => {
  execFile('npx', ['vitest', 'run', ...files], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, maxBuffer: 64 << 20 }, (err, stdout, stderr) => {
    if (!err) { done({ red: false, failed: [] }); return; }
    const out = String(stdout || '') + String(stderr || '');
    const failed = [...new Set([...out.matchAll(/^\s*(?:×|✗)\s+(.+?)\s+\d+ms\s*$/gm)].map((m) => m[1].replace(/^.*? > /, '')))];
    done({ red: true, failed, golden: /differs from tests\/snapshots/.test(out), out });
  });
});
/** Runs `job` over `items`, `n` at a time. */
const pool = async (items, n, job) => {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < items.length) await job(items[next++]); }));
};
// A break's result is kept in the scratch folder, so the report can be written again without running the tests again.
// Two passes: the fast file for every break, two at a time; then the sweeps (minutes each) for the breaks the fast file
// let through, four at a time.
const KEPT = join(scratch, 'results.json');
const kept = existsSync(KEPT) ? JSON.parse(readFileSync(KEPT, 'utf8')) : {};
const appOf = (name) => join(scratch, 'fz-' + name.replace(/[^a-z]+/g, '-') + '.html');
const rowOf = (b, r, by) => {
  const which = r.red ? (r.failed.length ? r.failed.length + ': ' + r.failed.slice(0, 3).map((t) => t.slice(0, 70)).join('; ') + (r.failed.length > 3 ? '; …' : '') : r.golden ? 'the golden file' : 'a file failed before its tests') : '';
  return `| ${b[0]} | ${b[1]} | ${b[2]} | ${b[3]} | ${r.red ? 'red (' + by + ')' : 'GREEN (blind)'} | ${which} |`;
};
const settle = (b, r, by) => {
  if (r.red) writeFileSync(appOf(b[1]) + '.out.txt', r.out);
  kept[b[1]] = { blind: !r.red, row: rowOf(b, r, by) };
  writeFileSync(KEPT, JSON.stringify(kept));
  process.stderr.write((r.red ? 'red   ' : 'BLIND ') + b[1] + ' (' + by + ')\n');
};
const notRun = {};
const quiet = [];   // green on the fast file: the sweeps decide
await pool(BREAKS.filter((b) => !kept[b[1]]), 2, async (b) => {
  const pairs = pairsOf(b);
  const wrong = pairs.map(([from]) => countOf(from)).find((n) => n !== 1);
  if (wrong !== undefined) { notRun[b[1]] = `| ${b[0]} | ${b[1]} | ${b[2]} | ${b[3]} | NOT RUN: the text occurs ${wrong} times | |`; return; }
  let broken = page;
  for (const [from, to] of pairs) broken = broken.replace(from, () => to);
  writeFileSync(appOf(b[1]), broken);
  const r = await runFiles(appOf(b[1]), ['integration/stored-state.test.ts']);
  if (r.red) settle(b, r, 'the fast file'); else quiet.push(b);
});
process.stderr.write('the fast file let ' + quiet.length + ' through; the sweeps now\n');
await pool(quiet, 4, async (b) => {
  const r = await runFiles(appOf(b[1]), ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts']);
  settle(b, r, 'the sweeps');
});
const rows = [];
const blindNames = [];
const perGroup = {};
for (const b of BREAKS) {
  const g = (perGroup[b[0]] = perGroup[b[0]] || { n: 0, blind: 0 });
  g.n++;
  if (notRun[b[1]]) { rows.push(notRun[b[1]]); continue; }
  if (kept[b[1]].blind) { blindNames.push(b[1]); g.blind++; }
  rows.push(kept[b[1]].row);
}

const L = head();
L.push('## 4. A break inside each rule, against the records');
L.push('');
const none = blindNames.filter((n) => (WHY[n] || '').startsWith('none'));
L.push(`${BREAKS.length - 2} breaks and two controls (one the fast file turns red, one only the sweeps do; both must be red); **${blindNames.length} green on the records**: ${blindNames.length - none.length} that a history the records do not hold would show, and ${none.length} that change nothing a launch can reach or a record can hold.`);
L.push('');
L.push('| Rules of | Breaks | Green on the records |');
L.push('|---|---|---|');
for (const g of Object.keys(perGroup)) L.push('| ' + g + ' | ' + perGroup[g].n + ' | ' + perGroup[g].blind + ' |');
L.push('');
L.push('Why so many: three things every history shares. Its stored grid is the same engine\'s build of the same config as the launch that reads it, so where a rule picks between the stored day and the rebuilt one, both are the same day. Every touch snapshots its day now, so a launch gives a touched day back from its snapshot, and the replays of swaps and edits, and each proof of a touch on its own, never decide. And no history holds an older program (no pinned test week, no seed, no start date) or a dated pace test.');
L.push('');
L.push('| Rules of | Green break | Why the records do not see it |' + (AFTER ? ' With this slice\'s records |' : ''));
L.push('|---|---|---|' + (AFTER ? '---|' : ''));
for (const b of BREAKS) if (blindNames.includes(b[1])) L.push('| ' + b[0] + ' | ' + b[1] + ' | ' + (WHY[b[1]] || '**NOT READ**') + ' |' + (AFTER ? ' ' + (!AFTER[b[1]] ? 'not run' : AFTER[b[1]].blind ? 'green' : 'red') + ' |' : ''));
if (AFTER) {
  const still = blindNames.filter((n) => AFTER[n] && AFTER[n].blind);
  L.push('');
  L.push(`With the records this slice adds (tests/integration/stored-state.test.ts, written on ${version}'s page): ${blindNames.length - still.length} of the ${blindNames.length} are red, and ${still.length} stay green, each one a break that changes nothing a launch can reach or a record can hold: ${still.join('; ')}.`);
}
L.push('');
L.push('| Rules of | Break | The rule | What the break does | The records | Tests red |');
L.push('|---|---|---|---|---|---|');
L.push(...rows);
process.stdout.write(L.join('\n') + '\n');
