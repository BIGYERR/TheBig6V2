// Do the stored-state golden records fail when the code they guard is broken? (MIGRATION.md, constraint 5 and 3.4.)
// Each break below changes one line of the built page, in a copy; the three test files run against that copy
// (IA_APP); the break counts only if a test goes red. Nothing in the working tree is changed.
//
// Run from the repo root, after a build:
//   node tests/measure/stored-state_red-on-break.mjs <scratch dir> > tests/measure/stored-state_red-on-break.md
//
// A slice runs its own breaks first, in a minute or two, and the whole set once before its release commit:
//   node tests/measure/stored-state_red-on-break.mjs <scratch dir> --only overlay
// keeps the breaks whose name holds that text, runs the page as built on the fast file alone, and heads its report
// as a partial run. A partial report is read on the screen, never written over the saved one.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const scratch = resolve(process.argv[2] || '');
const onlyAt = process.argv.indexOf('--only');
const ONLY = onlyAt > 0 ? String(process.argv[onlyAt + 1] || '').toLowerCase() : '';
if (!process.argv[2] || process.argv[2].startsWith('--') || (onlyAt > 0 && !ONLY)) {
  console.error('usage: node tests/measure/stored-state_red-on-break.mjs <scratch dir> [--only <text in a break\'s name>]');
  process.exit(2);
}
const picked = (list) => (ONLY ? list.filter(([name]) => name.toLowerCase().includes(ONLY)) : list);
mkdirSync(scratch, { recursive: true });
const PAGE = join(ROOT, 'dist-' + 'github-pages', 'index.html');
const page = readFileSync(PAGE, 'utf8');
// The fast file first (a few seconds); the sweeps only for a break the fast file lets through (half a minute each).
const FAST = ['integration/stored-state.test.ts'];
const SLOW = ['sweeps/stored-state.test.ts', 'sweeps/data-backup.test.ts'];

// name, what the break does, the exact text (once in the page), its replacement.
const BREAKS = [
  ['log key', 'a log is stored under w1-mon, not w1_mon', "function logKey(w,d){return dayStoreKey(w,d);}", "function logKey(w,d){return 'w'+w+'-'+d;}"],
  ['set draft', 'a logged card leaves its draft in the log', '  clearSetDraft(exKey);\n', '\n'],
  ['backup scan', 'the backup leaves out the last key', "store.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "store.keys().slice(0,-1).forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});"],
  ['completion status', 'a skipped day is stored as complete', "setDayStatus(iaStore,activeProgId,currentWeek,dayKey,title||null,status,Date.now());", "setDayStatus(iaStore,activeProgId,currentWeek,dayKey,title||null,'complete',Date.now());"],
  // v0.261.4: a break inside the rules that moved to core with the day's log, completion and parts.
  ['part skip', 'a skipped part is not stored', "  writePartSkips(store,programId,all);\n  settleDayParts(", "  settleDayParts("],
  // Post-v0.261.4: open until the records gained the case "a day's parts settle its status" (no history before it let a
  // day's parts write its completion).
  ['parts settle', 'the parts of a day never write its completion', "c[k]={title:(day&&day.title)||null,ts:now,status:want,parts:1};", ''],
  // v0.261.5: two breaks inside the rules that moved to core with the day history. The second was green until the
  // records gained the case "a touched day edited, then its session moved" (no history before it edited a day after
  // its first touch).
  ['history, kept', 'a touched day is never snapshotted', 'if(h[k]) return;', 'return;'],
  ['edit re-snapshot', 'an edit after the first touch is not folded into the day\'s snapshot', 'if(!h[k]) return;', 'return;'],
  // v0.261.6: a break inside each rule that moved to core with the swaps, the swap counts, the day edits, the program
  // list, the active program and the Wildcard's record. Seven of them were green on v0.261.5's records (the next launch
  // prunes a touched week's edits, and no history undid a swap or reached the nudge) until the records gained the case
  // "a day's swaps and edits, made and undone, and the nudge".
  ['swap record', 'a swap is not stored', 's[k]=list; writeSwaps(store,programId,s); return s;', 'return s;'],
  ['swap places', 'a swap is stored without where the lift stood', 'if(Array.isArray(rx)&&rx.length) ent.rx=', 'if(false) ent.rx='],
  ['swap places, merge', 'a pair swapped again forgets the places the earlier tap saw', 'ent.rx=(was?', 'ent.rx=(false?'],
  ['swap undo', 'an undone swap keeps its record', 's[k]=s[k].filter(e=>e&&e.from!==from);', ''],
  ['swap count', 'a run of one swap never counts past one', 'cur.n=(cur.n||0)+1', 'cur.n=1'],
  ['nudge offered', 'a nudge turned down is not marked offered', 'if(c[from]){c[from].offered=true;writeSwapCounts', 'if(c[from]){writeSwapCounts'],
  ['skip record', 'a skipped movement is not stored', 'if(e.skip.indexOf(name)<0) e.skip.push(name);', ''],
  ['skip undo', 'a movement put back stays skipped in the store', 's[k].skip=(s[k].skip||[]).filter(function(x){return x!==name;});', ''],
  ['add record', 'an added movement is not stored', 'e.add.push({name:name,detail:detail,ts:now})', '0'],
  ['add undo', 'a removed movement stays added in the store', 's[k].add=(s[k].add||[]).filter(function(a){return a&&a.name!==name;});', ''],
  ['edits prune', 'the edits of a frozen week are kept', 'if(m&&+m[1]<cutWeek){delete s[k];changed=true;}', ''],
  ['active id', 'the active program is not stored', "function writeActiveProgramId(store, id){store.set('ia_active',id);}", 'function writeActiveProgramId(store, id){}'],
  ['wildcard record', 'a Wildcard done is not stored', 'function writeWildcardDone(store, programId, a){store.set(', 'function writeWildcardDone(store, programId, a){return;store.set('],
  ['purge', 'a deleted program keeps its logs', "['ia_logs_','ia_comp_',", "['ia_comp_',"],
  ['rest move key', 'a moved rest day is stored under the picked day', 'moves[completedKey(w,day)]={from:pick,ts:Date.now()};', 'moves[completedKey(w,pick)]={from:pick,ts:Date.now()};'],
  ['week count', 'the current week is counted one day late', 'const diff=Math.floor((today-weekMon)/86400000);', 'const diff=Math.floor((today-weekMon)/86400000)-1;'],
  // v0.261.7: a break inside each rule that moved to core with what Progress reads and computes, the run card's regime
  // and the nudge's preference. All were green on v0.261.6's records (Progress writes nothing a key record can show, and
  // no history logged an easy pace, took the nudge or made a second program) until the records gained the case "what
  // Progress reads from three weeks of runs, the nudge taken, and a second program".
  ['seed runs', 'the seed counts no run', 'paces.push(r.sec); if(e.ts>latest) latest=e.ts;', 'if(e.ts>latest) latest=e.ts;'],
  ['delete warning', 'a program\'s lift log never warns', 'return Object.keys(readLiftLog(store,programId)||{}).length>0;', 'return false;'],
  ['recovery run', 'any run counts as a recovery run', "if(!/recovery/i.test(c.subtype||'')) return null;", ''],
  ['recovery target', 'the recovery pace has no target', 'if(r.tgt) tgts.push(r.tgt);', ''],
  ['longest run', 'a week\'s runs are summed, not the longest taken', 'wk[w]=Math.max(wk[w]||0, top);', 'wk[w]=(wk[w]||0)+top;'],
  ['runs by class', 'no run is placed in its class', 'out[cls].push({w, sec});', ''],
  ['easy effort count', 'the easy effort counts no run', '(wk[w]=wk[w]||[]).push(sec); n++;', '(wk[w]=wk[w]||[]).push(sec);'],
  ['logged miles', 'no logged mile is counted against the plan', 'wk[w].presc+=+dose.mi; wk[w].act+=act;', 'wk[w].presc+=+dose.mi;'],
  ['program week', 'a program\'s week is counted one week early', 'return Math.min(p.totalWeeks||6, Math.floor(diff/7)+1);', 'return Math.min(p.totalWeeks||6, Math.floor(diff/7));'],
  ['cut week', 'no week is held back', 'return (w>=(p.totalWeeks||6)) ? 0 : w;', 'return 0;'],
  ['run class', 'a long run has no class', "if(/long|LSD/i.test(s)) return 'Long';", ''],
  ['pace seconds', 'a pace reads its minutes only', 'return m ? (+m[1])*60+(+m[2]) : null;', 'return m ? (+m[1])*60 : null;'],
  ['mile from recovery', 'the table is not read between its rows, recovery to mile', 'return a.mile+f*(b.mile-a.mile);', 'return a.mile;'],
  ['half from mile', 'the table is not read between its rows, mile to half', 'return a.halfBest+f*(b.halfBest-a.halfBest);', 'return a.halfBest;'],
  ['run card regime', 'a logged run card reads as a draft', 'return !!e&&(CARDIO_PARK_FIELDS[sport]||[]).some(function(f){ return !!e[f]; });', 'return false;'],
  ['swap preference', 'the nudge taken stores no preference', 'p.cfg.exSwapPrefs[from]=to;', ''],
  // v0.261.8: a break inside each rule that moved to core with the backup's snapshot, reader and loader. Most were green
  // on v0.261.7's records (every backup they held was good and loaded onto an empty phone) until the records gained the
  // case "backups refused, a load refused, and a backup loaded over another program" (stored-state_backup-gaps.md).
  ['backup scan, prefix', 'the backup takes every key, not only the app\'s', "store.keys().forEach(k=>{if(k.indexOf('ia_')===0) keys.push(k);});", "store.keys().forEach(k=>{keys.push(k);});"],
  ['backup order', 'the backup keeps storage order', 'return keys.sort();', 'return keys;'],
  ['snapshot kind', 'the file is not marked as a backup', 'return {kind:BACKUP_KIND,format:BACKUP_FORMAT,', "return {kind:'x',format:BACKUP_FORMAT,"],
  ['snapshot format', 'the file carries no format', 'return {kind:BACKUP_KIND,format:BACKUP_FORMAT,', 'return {kind:BACKUP_KIND,format:0,'],
  ['snapshot version', 'the file does not name its release', 'takeBackup(iaStore,String(IA_VERSION),Date.now())', "takeBackup(iaStore,'0',Date.now())"],
  ['snapshot made', 'the file does not carry when it was made', 'version,made:new Date(now).toISOString(),data};', "version,made:'',data};"],
  ['reader kind', 'a file of another kind is read', 'f.kind!==BACKUP_KIND) return', 'false) return'],
  ['reader newer', 'a newer file reads as not a backup', "return {ok:false,why:'newer'};", "return {ok:false,why:'bad'};"],
  ['reader format', 'a file with no format is read', "if(f.format!==BACKUP_FORMAT) return {ok:false,why:'bad'};", ''],
  ['reader data', 'a file whose data is not an object is read', "if(!d||typeof d!=='object'||Array.isArray(d)) return {ok:false,why:'bad'};", ''],
  ['reader keys', 'a file with a key not the app\'s, or a value not a string, is read', "if(!Object.keys(d).every(k=>k.indexOf('ia_')===0&&typeof d[k]==='string')) return {ok:false,why:'bad'};", ''],
  ['reader programs', 'a file with no program list is read', "if(programs<0) return {ok:false,why:'bad'};", ''],
  ['program count', 'every program list counts one', 'return Array.isArray(a)?a.length:-1;', 'return Array.isArray(a)?1:-1;'],
  ['reader made', 'the file\'s time is not read', "made:typeof f.made==='string'?f.made:''}", "made:''}"],
  ['load clears', 'a load keeps the phone\'s keys the file does not hold', 'keys.forEach(k=>store.remove(k));', ''],
  ['load writes', 'a load writes nothing', 'Object.keys(data).forEach(k=>store.set(k,data[k]));', ''],
  ['load rollback, clear', 'a refused load keeps what it wrote', 'backupKeys(store).forEach(k=>{try{store.remove(k);}catch{}});', ''],
  ['load rollback, restore', 'a refused load does not put back what the phone held', 'Object.keys(before).forEach(k=>{try{store.set(k,before[k]);}catch{}});', ''],
  ['load result', 'a refused load reports success', 'catch{}});\n    return false;', 'catch{}});\n    return true;'],
  // v0.262.1: a break inside each rule that moved to core with the overlay splice (the page's applyOverlays, now
  // spliceOverlays). Sixteen were red on v0.262.0's records, which book an injury and a trip and train under both. Four
  // were green (the travel mark, the legal swaps kept by overlay, an overlay that fails, the length the span is read
  // against) until the records gained the case "a mini gym trip, a swap on a trip day, an overlay that fails, and no
  // stored length" (tests/measure/stored-state_overlays-gaps.md).
  ['overlay order', 'the newest overlay is applied first, so the oldest wins', '.sort((a,b)=>((a&&a.created)||0)-((b&&b.created)||0)).forEach(ov=>{', '.sort((a,b)=>((b&&b.created)||0)-((a&&a.created)||0)).forEach(ov=>{'],
  ['overlay kinds, injury', 'an injury overlay is skipped', "if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;", "if(!ov || (ov.type!=='substitute') || !ov.patch) return;"],
  ['overlay kinds, travel', 'a travel overlay is skipped', "if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;", "if(!ov || (ov.type!=='injury') || !ov.patch) return;"],
  ['overlay window, last week', 'the last week of an overlay\'s span is not searched', 'for(let w=range.fromWeek; w<=range.toWeek; w++){', 'for(let w=range.fromWeek; w<range.toWeek; w++){'],
  ['overlay window, first week', 'the first week of an overlay\'s span is not searched', 'for(let w=range.fromWeek; w<=range.toWeek; w++){', 'for(let w=range.fromWeek+1; w<=range.toWeek; w++){'],
  ['overlay key', 'a spliced day\'s stamp holds the overlay\'s kind only', 'const ck = JSON.stringify([ov.type, ov.patch]);', 'const ck = JSON.stringify([ov.type]);'],
  ['overlay travel mark', 'a trip builds as the athlete\'s own gym', '{...prog.cfg, ...ov.patch, _travel:true}', '{...prog.cfg, ...ov.patch}'],
  ['overlay patch, travel', 'a trip builds without its patch', '{...prog.cfg, ...ov.patch, _travel:true}', '{...prog.cfg, _travel:true}'],
  ['overlay patch, injury', 'an injury builds without its patch', ': {...prog.cfg, ...ov.patch});', ': {...prog.cfg});'],
  ['overlay clean injury build', 'an injury builds as a temporary setup', ': {...prog.cfg, ...ov.patch});', ': {...prog.cfg, ...ov.patch, _travel:true});'],
  ['overlay day, before', 'a day before the span, in its first week, takes the variant', 'if(dt < _from || (_to && dt > _to)) return;', 'if((_to && dt > _to)) return;'],
  ['overlay day, after', 'a day after the span, in its last week, takes the variant', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt < _from) return;'],
  ['overlay day, first', 'the span\'s first day keeps the base', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt <= _from || (_to && dt > _to)) return;'],
  ['overlay day, last', 'the span\'s last day keeps the base', 'if(dt < _from || (_to && dt > _to)) return;', 'if(dt < _from || (_to && dt >= _to)) return;'],
  ['overlay rest days', 'a rest day of the variant replaces the base day', 'const vd = vw[d]; if(!vd || vd.rest) return;', 'const vd = vw[d]; if(!vd) return;'],
  ['overlay stamp', 'a spliced day carries no overlay key', 'rebuilt.weeks[w][d] = Object.assign({}, vd, {_ovKey: ck});', 'rebuilt.weeks[w][d] = Object.assign({}, vd);'],
  ['overlay splice', 'no day takes the variant', 'rebuilt.weeks[w][d] = Object.assign({}, vd, {_ovKey: ck});', ''],
  ['overlay legal swaps', 'no variant\'s legal swaps are kept', 'if(Array.isArray(variant._swapUniverse)) rebuilt._swapUniverseByKey[ck] = variant._swapUniverse;', ''],
  ['overlay failure', 'a failing overlay stops every later one', 'failed(ov, e);', 'throw e;'],
  ['overlay failure, told', 'a failed overlay is not told to the athlete', "try{ showToast('A plan change failed to apply. Flag it in Bugs.'); }catch(_e){}", ''],
  ['overlay length', 'an overlay\'s span is read against the stored length only', 'const totalWeeks = rebuilt.totalWeeks || prog.totalWeeks || 0;', 'const totalWeeks = prog.totalWeeks || 0;'],
  // v0.262.2, the ninth slice: the launch itself (refreshStoredProgram, the date readers, the pace clock, the replays),
  // from tests/measure/stored-state_freeze-gaps.mjs with the lift's substitutions. They replace the five rows this list
  // held inside refreshProgram and the two of the page's applyOverlays. A break of two places is a list of pairs.
  ['overlay week range', 'the launch hands the splice no week range', 'spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);', 'spliceOverlays(prog, rebuilt, ()=>null, _progDayDate, failed.overlay);'],
  ['overlay day date', 'the launch hands the splice no day date', 'spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);', 'spliceOverlays(prog, rebuilt, overlayWeekRange, ()=>null, failed.overlay);'],
  ["launch: guard, no config", "a program with no config is handed back as stored -> a program with no config goes on to the rebuild", "if(!prog || !prog.cfg) return prog;", "if(!prog) return prog;"],
  ["launch: seed, none anywhere", "a program with no seed anywhere is handed back as stored -> a program with no seed is rebuilt", "if(prog.seed == null) return prog;", ""],
  ["launch: seed, into the config", "an older program's seed is put into its config -> the config stays without its seed", "    prog.cfg.seed = prog.seed;\n", "\n"],
  ["launch: seed, saved", "the seed put back is written to ia_programs -> the seed is put back in hand only", "_ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed}; writePrograms(store,_ps);", "_ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};"],
  ["launch: seed, saved on its program", "the seed is written to the stored program of the same id -> the seed is written to the first stored program", "const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};", "const _pi=0; if(_pi>=0){ _ps[_pi].cfg={..._ps[_pi].cfg,seed:prog.seed};"],
  ["launch: test week, only when unset", "a program with a pinned test week is left alone -> every program derives its test week again at each launch", "if(prog.cfg._testWeek == null){", "if(true){"],
  ["launch: test week, backfilled", "a dated test with no pinned week pins it at launch -> no test week is ever backfilled", "if(prog.cfg._testWeek == null){", "if(false){"],
  ["launch: test week, needs a week", "a test before the start or past week 26 pins nothing -> a test with no week still writes the two keys", "if(_tp && _tp.tw){", "if(_tp){"],
  ["launch: test week, a past test", "a test already past pins nothing and writes nothing -> a past test pins", "if(!(_rd && _td && _rd < _td)){", "if(true){"],
  ["launch: test week, set", "the pinned week goes into the config -> the config gets the length and not the week", "        prog.cfg._testWeek = _tp.tw;\n", "\n"],
  ["launch: test week, length", "the program's length is capped at the test week -> the config gets the week and not the length", "prog.cfg._raceDateCappedWeeks = _tp.tw;", ""],
  ["launch: test week, saved", "the pin is written to ia_programs -> the pin is in hand only", "_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks}; writePrograms(store,_ps);", "_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks};"],
  ["launch: test pin, goal family", "only a pace test goal pins -> any run goal with a date pins", "!PACE_GOALS.has(g.id) || ", ""],
  ["launch: test pin, event off", "a goal with its event switched off pins nothing -> it pins", "c.eventTargeted === false || !c.raceDate) return null;", "!c.raceDate) return null;"],
  ["launch: test pin, week range", "a test week outside 1 to 26 pins nothing -> any week pins", "return {tw: (week >= 1 && week <= cap) ? week : null, len, week, cap};", "return {tw: week, len, week, cap};"],
  ["launch: pace shift, set", "an injury that stops quality running sets the pace shift on the config before the build -> no pace shift is ever set", "if(_psm) prog.cfg._paceShift=_psm; else delete prog.cfg._paceShift;", "delete prog.cfg._paceShift;"],
  ["launch: pace shift, cleared", "a pace shift that no longer derives is deleted from the config -> an old pace shift outlives its overlays", "if(_psm) prog.cfg._paceShift=_psm; else delete prog.cfg._paceShift;", "if(_psm) prog.cfg._paceShift=_psm;"],
  ["launch: pace map, modes", "only an injury whose plan touches running counts -> every injury with a cardio mode counts", "if(!P||!P.cardioMode||!SUP[P.cardioMode]) return;", "if(!P||!P.cardioMode) return;"],
  ["launch: pace map, half step", "a half step week never counts -> a half step week counts", "if(inj.halfstep) return;", ""],
  ["launch: pace map, open end", "an injury with no end counts to today -> an injury with no end counts to the program's end", "let t=ov.to?_parseLocalDate(ov.to):today;", "let t=ov.to?_parseLocalDate(ov.to):end;"],
  ["launch: pace map, from the start", "days before the program's first Monday do not count -> they count", "const lo=Math.max(f.getTime(),mon.getTime());", "const lo=f.getTime();"],
  ["launch: pace map, days before the week", "a week is shifted by the days hurt before it -> a week is shifted by the days hurt through its Monday", "const hi=Math.min(s[1],wkStart-86400000);", "const hi=Math.min(s[1],wkStart);"],
  ["launch: pace map, floor of one", "any day hurt shifts the clock by at least a week -> one to three days hurt shift nothing", "map[w]=days>0?Math.max(1,Math.round(days/7)):0;", "map[w]=days>0?Math.round(days/7):0;"],
  ["launch: pace map, merged spans", "overlapping injuries count a day once -> overlapping injuries count a day twice", "if(spans[k][0]<=m[1]+86400000) m[1]=Math.max(m[1],spans[k][1]);\n    else merged.push(spans[k].slice());", "merged.push(spans[k].slice());"],
  ["launch: rebuild, id", "the rebuilt program keeps its id -> it carries the build's own id", "rebuilt.id = prog.id;", ""],
  ["launch: rebuild, name", "the rebuilt program keeps its name -> it carries the build's name", "rebuilt.name = prog.name;", ""],
  ["launch: rebuild, created", "the rebuilt program keeps when it was made -> it carries the instant of this launch", "rebuilt.created = prog.created;", ""],
  ["launch: rebuild, start", "the rebuilt program keeps its start -> it has no start", "rebuilt.startDate = prog.startDate;", ""],
  ["launch: rebuild, block open", "the rebuilt program keeps where its block opened -> it has none", "rebuilt.blockOpen = prog.blockOpen;", ""],
  ["launch: rebuild, seed", "the rebuilt program keeps the stored program's own seed -> it carries the config's", "rebuilt.seed = prog.seed;", ""],
  ["launch: rebuild, overlays", "the rebuilt program keeps its overlays -> it has none", "rebuilt.overlays = Array.isArray(prog.overlays) ? prog.overlays : [];", "rebuilt.overlays = [];"],
  ["launch: rebuild, failure", "a program the engine cannot build is handed back as stored -> nothing is handed back", "failed.rebuild(e);\n    return prog;", "failed.rebuild(e);\n    return null;"],
  ["launch: splice, called", "the overlays are spliced into the rebuilt grid -> no overlay is spliced", "    spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);\n", "\n"],
  ["launch: order, splice before the freeze", "the freeze has the last word over an overlay -> the overlays are spliced after the freeze", [["    spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);\n", "\n"], ["    try{\n      const _mv=JSON.parse(", "    spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);\n    try{\n      const _mv=JSON.parse("]]],
  ["launch: overlay range, clamped", "an overlay's weeks are clamped to the program -> they are not clamped", "const lo=Math.max(1,fw), hi=Math.min(totalWeeks,tw);", "const lo=fw, hi=tw;"],
  ["launch: overlay range, no end", "an overlay with no end runs to the last week -> it covers its first week only", "const tw = ov.to ? weekOfDate(prog, ov.to) : totalWeeks;", "const tw = ov.to ? weekOfDate(prog, ov.to) : fw;"],
  ["launch: day date", "a program day's date is its week's Monday plus its weekday -> every day reads a day late", "dt.setDate(mon.getDate()+(week-1)*7+off);", "dt.setDate(mon.getDate()+(week-1)*7+off+1);"],
  ["launch: freeze, the stored length", "the current week is capped at the stored length first -> it is capped at the rebuilt length", "const _tw = prog.totalWeeks || rebuilt.totalWeeks || 6;", "const _tw = rebuilt.totalWeeks || 6;"],
  ["launch: freeze, no clock", "a program with no start still freezes by what was touched -> the freeze fails for it and every week is rebuilt", "const _hasClock = !!prog.startDate;", "const _hasClock = true;"],
  ["launch: freeze, week count", "the current week is counted from the start's Monday -> it is counted a day late", "const _diff = Math.floor((_today - _mon)/86400000);", "const _diff = Math.floor((_today - _mon)/86400000)-1;"],
  ["launch: freeze, past the end", "after the last week the current week is the last -> it runs past the end", "_curWk = _diff < 0 ? 1 : Math.min(_tw, Math.floor(_diff/7)+1);", "_curWk = _diff < 0 ? 1 : Math.floor(_diff/7)+1;"],
  ["launch: touched, completion", "a completion proves a day was seen -> it proves nothing", "try{ Object.assign(_touched, JSON.parse(store.get('ia_comp_'+prog.id)||'{}')); }catch(e){}", ""],
  ["launch: touched, log", "a log proves a day was seen -> it proves nothing", "try{ Object.assign(_touched, JSON.parse(store.get('ia_logs_'+prog.id)||'{}')); }catch(e){}", ""],
  ["launch: touched, snapshot", "a snapshot proves a day was seen -> it proves nothing to the cut", "try{ Object.assign(_touched, JSON.parse(store.get('ia_hist_'+prog.id)||'{}')); }catch(e){}", ""],
  ["launch: touched, lift log", "a logged lift proves its day was seen -> it proves nothing", "_touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;", ""],
  ["launch: touched, lift log day", "a logged lift freezes its own day -> it moves the cut and freezes no day", "_touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;", "_touched['w'+_wn+'_'] = true;"],
  ["launch: cut, the date", "every week before the current one is frozen, touched or not -> only weeks up to the furthest touched are frozen", "const _cut = Math.max(_dateCut, _maxTouched + 1);", "const _cut = _maxTouched + 1;"],
  ["launch: cut, the furthest touched", "every week up to the furthest touched is frozen, wherever the date is -> only the date decides", "const _cut = Math.max(_dateCut, _maxTouched + 1);", "const _cut = _dateCut;"],
  ["launch: cut, the furthest touched week itself", "the furthest touched week is frozen -> the cut stops a week short of it", "const _cut = Math.max(_dateCut, _maxTouched + 1);", "const _cut = Math.max(_dateCut, _maxTouched);"],
  ["launch: freeze, reach", "every week below the cut is frozen -> the last frozen week is rebuilt", "for(let w=1; w<_cut; w++){", "for(let w=1; w<_cut-1; w++){"],
  ["launch: freeze, written", "a frozen week replaces the rebuilt one -> no week is frozen", "rebuilt.weeks[w] = _merged;", ""],
  ["launch: freeze, history", "a day with a snapshot is given back from it -> a snapshot is not read back", "if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }", ""],
  ["launch: freeze, piercing", "the current week and later take live days where untouched -> no frozen week is pierced", "const _pierce = w >= _curWk;", "const _pierce = false;"],
  ["launch: pierce, new days", "a pierced week gains a day the rebuild has and the stored grid lacks -> it keeps the stored days only", "Object.keys(_live).forEach(d=>{ if(!_seen.has(d)){ _seen.add(d); _days.push(d); } });", ""],
  ["launch: past week, stored days only", "a week behind the current one keeps the stored set of days -> it gains the rebuild's days too", "if(_pierce){\n            _days = [];", "if(true){\n            _days = [];"],
  ["launch: injury cover, kind", "only an injury covers a week -> a trip covers it too", ".filter(ov => ov && ov.type==='injury' && ov.patch && ov.patch.injury)", ".filter(ov => ov && ov.patch)"],
  ["launch: freeze, injured week", "a touched day with no snapshot, in a week an injury covers, takes the live day -> it keeps its stored form", "if(_injCovers(w) && _live[d]){ _merged[d] = _live[d]; return; }", ""],
  ["launch: touched day, stored form", "a touched day with no snapshot keeps its stored form -> it takes the live day", "_merged[d] = _stored[d] || _live[d];\n              return;", "_merged[d] = _live[d];\n              return;"],
  ["launch: touched day, live fallback", "a touched day the stored grid lacks takes the live day -> it is dropped", "_merged[d] = _stored[d] || _live[d];\n              return;", "_merged[d] = _stored[d];\n              return;"],
  ["launch: untouched day, pierced week", "an untouched day of a pierced week takes the live day -> it keeps its stored form", "if(_pierce && _live[d]){ _merged[d] = _live[d]; return; }", ""],
  ["launch: untouched day, past week", "an untouched day of a past week keeps its stored form -> it takes the live day", "_merged[d] = _stored[d] || _live[d];\n          });", "_merged[d] = _live[d];\n          });"],
  ["launch: moves, replayed", "a moved rest day is laid back on the rebuilt grid -> no move is replayed", "if(_mv&&Object.keys(_mv).length) applyRestDayMoves(rebuilt,_mv);", ""],
  ["launch: order, moves before swaps", "the moves are laid before the swaps and the edits -> the moves are laid after the swaps", [["if(_mv&&Object.keys(_mv).length) applyRestDayMoves(rebuilt,_mv);", ""], ["if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut);", "try{const _mv2=JSON.parse(store.get('ia_moves_'+prog.id)||'{}'); if(_mv2&&Object.keys(_mv2).length) applyRestDayMoves(rebuilt,_mv2);}catch(e){} if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut);"]]],
  ["launch: move, already applied", "a move a frozen week already holds is not applied again -> it is applied again", "if(wk[dest]&&wk[dest].movedFrom===origin) return;", ""],
  ["launch: move, source", "a rest day or a day already moved is never the source -> it can be", "const src=wk[origin]; if(!src||src.rest||src.moved) return;", "const src=wk[origin]; if(!src) return;"],
  ["launch: move, mark", "the moved session says where it came from -> it does not", "wk[dest]={...src, movedFrom:origin};", "wk[dest]={...src};"],
  ["launch: move, origin rests", "the day a session left becomes a rest day -> the session shows on both days", "wk[origin]={title:src.title,dot:'rest',tags:['rest'],rest:true,moved:true,movedTo:dest};", ""],
  ["launch: move, old form", "a move stored as a plain day name is read -> it is not", "const origin=(typeof mv==='string')?mv:mv.from;", "const origin=mv.from;"],
  ["launch: swaps, replayed", "a session swap is laid back on the rebuilt day -> no swap is replayed", "if(Object.keys(_swLive).length) applySessionSwaps(rebuilt,_swLive);", ""],
  ["launch: swaps, restored days", "a day given back from its snapshot gets no replay -> its swaps are replayed onto the snapshot", "Object.keys(_sw).forEach(k=>{ if(!_histRestored.has(k)) _swLive[k]=_sw[k]; });", "Object.keys(_sw).forEach(k=>{ _swLive[k]=_sw[k]; });"],
  ["launch: swap replay, order", "a day's swaps replay in the order made -> they replay newest first", "const list=(store[k]||[]).filter(e=>e&&e.from&&e.to);", "const list=(store[k]||[]).filter(e=>e&&e.from&&e.to).reverse();"],
  ["launch: swap replay, applied", "each swap renames its lift on the day -> no lift is renamed", "if(applySwapPrefs(day.sections,m1)) hit=true;", "hit=true;"],
  ["launch: swap replay, injury filter", "a swapped day under an injury goes through the injury filter again -> it does not", "if(hit && _dayPlanCfg(prog,day).injury){", "if(false){"],
  ["launch: swap replay, hold kept", "a renamed lift carries its dose from before the filter -> it does not", "_renamed.forEach(it=>{ if(typeof it.detail==='string') it._preHold=it.detail; });", ""],
  ["launch: swap replay, the day's plan", "the injury that governs a day is its own overlay's -> it is the config's", "return Object.assign({},base,{injury:ov.patch.injury});", "return base;"],
  ["launch: edits, pruned at launch", "the edits of every week below the cut are dropped at launch -> none is dropped", "if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut);", ""],
  ["launch: edits, the prune cut", "the prune stops at the freeze cut -> it takes the cut week too", "if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut);", "if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut+1);"],
  ["launch: edits, replayed", "adds and skips are laid back on the rebuilt day -> none is replayed", "if(_ed&&Object.keys(_ed).length) applyDayEdits(rebuilt,_ed);", ""],
  ["launch: order, swaps before edits", "the edits are laid after the swaps -> the edits are laid before the swaps", [["if(_ed&&Object.keys(_ed).length) applyDayEdits(rebuilt,_ed);", ""], ["const _sw=readSwaps(store,prog.id)||{}, _swLive={};", "{if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut); const _ed0=readDayEdits(store,prog.id); if(_ed0&&Object.keys(_ed0).length) applyDayEdits(rebuilt,_ed0);} const _sw=readSwaps(store,prog.id)||{}, _swLive={};"]]],
  ["launch: edit replay, skip", "a skipped movement is flagged -> it is not", "it._skipped = (skips.indexOf(it.name)>=0) || undefined;", ""],
  ["launch: edit replay, round", "a skipped round is flagged whole -> it is not", "if(sec.superset) sec._skipped=ssKilled||undefined;", ""],
  ["launch: edit replay, add", "an added movement is put on the day -> it is not", "bucket.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});", ""],
  ["launch: edit replay, add mark", "an added movement is marked the athlete's -> it is not", "bucket.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});", "bucket.items.push({name:a.name,detail:a.detail||''});"],
  ["launch: the instant handed over", "the page hands the launch the instant -> it hands it none, so every launch reads as 1970", "return refreshStoredProgram(iaStore, prog, Date.now(), {", "return refreshStoredProgram(iaStore, prog, 0, {"],
  ["launch: the store handed over", "the page hands the launch its store -> it hands it an empty one", "return refreshStoredProgram(iaStore, prog, Date.now(), {", "return refreshStoredProgram(memoryStore(), prog, Date.now(), {"],
];

// Breaks that change no record. They are run and printed, and they do not fail the script: each is a line no history
// can reach an effect through, and the note says how that was shown.
const OPEN = [
  ['overlay cache', 'an overlay\'s variant is built again for every overlay of the same kind and patch', 'if(!_variantCache[ck]) _variantCache[ck] = buildProgram(', '_variantCache[ck] = buildProgram(',
    'No effect is possible, found in v0.262.1 (tests/measure/stored-state_overlays-gaps.md): buildProgram is a pure function of its config (the engine check holds every digest), so a second build of the same kind and patch gives the same days and the same legal swaps, and a spliced day is a copy. The cache saves time and nothing else.'],
  ['freeze cut, the touched term', 'the current week, when touched, is not frozen a week further', 'const _dateCut = _curWk + (_curTouched ? 1 : 0);', 'const _dateCut = _curWk;',
    'No effect is possible: the next line takes the larger of this and the highest touched week plus one, and a touched current week is at least that week. The term is redundant.'],
  ['history, first touch', 'a day\'s snapshot is overwritten on every touch', 'if(h[k]) return;', '',
    'No reachable effect, settled in v0.261.5 (docs/decisions/stored-state.md). The guard decides only when a day is snapshotted again after it changed. A launch gives every snapshotted day back from its snapshot, and an edit is folded into the snapshot as it is made. One tap changes a snapshotted day and leaves its snapshot alone, the rest sheet\'s Move of a day with a logged lift, and it leaves a moved rest day that nothing snapshots (tests/measure/stored-state_first-touch.md). In 180 random histories, 0 of 4,481 repeat snapshots met a changed day (stored-state_first-touch-walks.md). The rule itself is held by the unit tests.'],
  ['snapshot, a key with no value', 'a listed key with no value goes into the backup', 'if(v!=null) data[k]=v;', 'data[k]=v;',
    'No reachable effect, found in v0.261.8 (tests/measure/stored-state_backup-gaps.md): the snapshot asks the store for a key the store has just listed, and both stores, the browser\'s storage and the memory store, give a string for every key they list. The guard moved as written; the unit tests hold the snapshot.'],
  ["launch: week of a date, before the start", "a date before the program reads as week one -> it reads as a week before one", "return diff<0 ? 1 : Math.floor(diff/7)+1;", "return Math.floor(diff/7)+1;",
    "No effect is possible in the grid's path, read in v0.262.2 (tests/measure/stored-state_freeze-gaps.md): overlayWeekRange clamps the week to one again, and the overlay sheet's \"picks your program back up\" line only asks whether the week is past the last. The unit tests hold the rule."],
  ["launch: freeze, before the start", "before the start the current week is one -> it is a week before one", "_curWk = _diff < 0 ? 1 : Math.min(_tw, Math.floor(_diff/7)+1);", "_curWk = Math.min(_tw, Math.floor(_diff/7)+1);",
    "No effect is possible: before the start the broken week is zero or less, the cut is still the furthest touched week plus one, and every week from one on is still pierced."],
  ["launch: touched, lift log week", "a logged lift with no week proves nothing -> it writes a key for week zero or none", "if(!(_wn > 0)) return;", "",
    "No effect is possible: a key for week zero or for no week matches no real day and never raises the furthest touched week."],
  ["launch: empty days dropped", "a day with nothing on either side is left out of the week -> it stays as an empty key", "Object.keys(_merged).forEach(d=>{ if(!_merged[d]) delete _merged[d]; });", "",
    "No record can hold it: the grid in hand is recorded as JSON, which leaves a key with no day out either way. The unit tests hold the week's keys."],
  ["launch: edit replay, added block", "the athlete's own added block is never flagged skipped -> it can be", "if(sec._added) return;", "",
    "No reachable effect: edits are laid only on a week at or above the cut, which the freeze never fills, so the day is the engine's fresh build and holds no added block when the skips are flagged. The unit tests hold the rule (the edits laid twice)."],
  ["launch: edit replay, add once", "an added movement already on the day is not added again -> it is added again", "if(bucket.items.some(function(it){return it.name===a.name;})) return;", "",
    "No reachable effect: edits are laid only on a week at or above the cut, a fresh build each launch, and each day is laid once. The unit tests hold the rule (the edits laid twice)."],
];

const runFiles = (app, files) => {
  try {
    execFileSync('npx', ['vitest', 'run', ...files], { cwd: join(ROOT, 'tests'), env: { ...process.env, IA_APP: app, UPDATE_SNAPSHOTS: '' }, stdio: 'pipe' });
    return { red: false, failed: [] };
  } catch (e) {
    const out = String(e.stdout || '') + String(e.stderr || '');
    const failed = [...new Set([...out.matchAll(/^\s*(?:×|✗)\s+(.+?)\s+\d+ms\s*$/gm)].map((m) => m[1]))];
    return { red: true, failed, out };
  }
};
/** Fast first; the sweeps only when the fast file stays green. `by` says which caught it. */
const run = (app, all = false) => {
  const f = runFiles(app, FAST);
  if (f.red && !all) return { ...f, by: 'the fast file' };
  const s = runFiles(app, SLOW);
  if (f.red) return { ...f, by: 'the fast file' };
  return s.red ? { ...s, by: 'the sweeps' } : { red: false, failed: [], by: '' };
};

const breaks = picked(BREAKS);
const opens = picked(OPEN);
if (ONLY && !breaks.length && !opens.length) { console.error('no break\'s name holds "' + ONLY + '"'); process.exit(2); }
const rows = [];
const clean = ONLY ? runFiles(PAGE, FAST) : run(PAGE, true);
rows.push(['(no break)', 'the page as built', clean.red ? 'RED' : 'green', clean.red ? clean.failed.length : 0, ONLY ? 'the fast file alone' : 'all three files']);
let bad = clean.red ? 1 : 0;
for (const [name, what, from, to] of breaks) {
  // One place, or a list of [text, replacement] pairs for a break of two places (an order of two calls).
  const pairs = Array.isArray(from) ? from : [[from, to]];
  const n = pairs.map(([x]) => page.split(x).length - 1).find((c) => c !== 1);
  if (n !== undefined) { rows.push([name, what, 'NOT RUN: the text occurs ' + n + ' times in the page', '', '']); bad++; continue; }
  const app = join(scratch, 'break-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, pairs.reduce((t, [x, y]) => t.replace(x, () => y), page));
  const r = run(app);
  if (!r.red) bad++;
  if (r.red && !r.failed.length) writeFileSync(app + '.out.txt', r.out);
  rows.push([name, what, r.red ? 'red' : 'GREEN (the records miss it)', r.red ? (r.failed.length || (/differs from tests\/snapshots/.test(r.out) ? 'the golden file' : 'a file failed before its tests')) : 0, r.by]);
}

const open = [];
for (const [name, what, from, to, note] of opens) {
  const n = page.split(from).length - 1;
  if (n !== 1) { open.push([name, what, 'NOT RUN: the text occurs ' + n + ' times', note]); continue; }
  const app = join(scratch, 'open-' + name.replace(/[^a-z]+/g, '-') + '.html');
  writeFileSync(app, page.replace(from, () => to));
  const r = run(app);
  open.push([name, what, r.red ? 'red now (' + r.failed.length + ' tests): move it to the list above' : 'no record changed', note]);
}

const L = [];
L.push('# Stored state: do the golden records go red when the code is broken on purpose?');
L.push('');
if (ONLY) {
  L.push('**A partial run (`--only ' + ONLY + '`): ' + breaks.length + ' of ' + BREAKS.length + ' breaks and ' + opens.length + ' of ' + OPEN.length + ' open ones, the page as built on the fast file alone. Not the saved report.**');
  L.push('');
}
L.push('Written by `tests/measure/stored-state_red-on-break.mjs`. Each break changes one line of a copy of the built page;');
L.push('`tests/integration/stored-state.test.ts`, `tests/sweeps/stored-state.test.ts` and `tests/sweeps/data-backup.test.ts`');
L.push('run against the copy (`IA_APP`): the fast file first, the sweeps only for a break it lets through. The page as built');
L.push('must be green on all three and every break red.');
L.push('');
L.push('| Break | What it does | Result | Tests red | Caught by |');
L.push('|---|---|---|---|---|');
for (const r of rows) L.push('| ' + r.join(' | ') + ' |');
L.push('');
L.push(bad ? '**' + bad + ' row(s) not as required.**' : ONLY
  ? '**The page as built is green on the fast file, and these ' + breaks.length + ' breaks turn the records red.**'
  : '**The page as built is green, and all ' + BREAKS.length + ' breaks turn the records red.**');
L.push('');
L.push('## Breaks that change no record');
L.push('');
L.push('| Break | What it does | Result | Why |');
L.push('|---|---|---|---|');
for (const r of open) L.push('| ' + r.join(' | ') + ' |');
process.stdout.write(L.join('\n') + '\n');
process.exit(bad ? 1 : 0);
