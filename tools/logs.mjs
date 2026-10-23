#!/usr/bin/env node
// Reads the run log (tools/runlog.mjs) back.
//
//   node tools/logs.mjs                  the last 40 lines of the shared history (temp/events.log)
//   node tools/logs.mjs -n 200           the last 200
//   node tools/logs.mjs grep <text>      every history line containing <text> (case-insensitive)
//   node tools/logs.mjs orch [-n N]      the machine's orchestration log: one line per top-level start, every checkout
//   node tools/logs.mjs orch grep <text> orchestration lines containing <text>
//   node tools/logs.mjs runs [type]      the newest 25 runs (of one type): start, type, result, how long, folder
//   node tools/logs.mjs show [type|dir]  the newest run's summary and events (of one type, or one folder)
//   node tools/logs.mjs follow [type]    print the newest run's events as they arrive (a running server), Ctrl-C ends
//   node tools/logs.mjs open [type]      open temp/ (or the newest run of a type) in Finder
//   node tools/logs.mjs path [type]      print the folder
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, watch } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { HISTORY, ORCH_LOG, REPO, ROOT, listRuns, readSummary } from './runlog.mjs';

const args = process.argv.slice(2);
const cmd = args[0] && !args[0].startsWith('-') ? args[0] : 'tail';
const rest = cmd === 'tail' ? args : args.slice(1);
const rel = (p) => relative(process.cwd(), p) || '.';

function fail(msg) {
  console.error(`logs: ${msg}`);
  process.exit(1);
}

function readLines(file) {
  try {
    return readFileSync(file, 'utf8').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** The newest run, of `which` (a type), or the folder `which` names. */
function pick(which) {
  if (which && existsSync(which) && statSync(which).isDirectory()) return { dir: which, name: basename(which) };
  const runs = listRuns().filter((r) => !which || r.type === which);
  if (!runs.length) fail(which ? `no runs of type ${which} in ${rel(ROOT)}` : `no runs yet in ${rel(ROOT)}`);
  return runs[0];
}

switch (cmd) {
  case 'tail': {
    const i = rest.indexOf('-n');
    const n = i >= 0 ? Number(rest[i + 1]) || 40 : 40;
    const lines = readLines(HISTORY);
    if (!lines.length) fail(`no history yet (${rel(HISTORY)}); every logged run adds to it`);
    console.log(lines.slice(-n).join('\n'));
    break;
  }
  case 'orch': {
    const lines = readLines(ORCH_LOG);
    if (!lines.length) fail(`no orchestration log yet (${ORCH_LOG}); every logged run, Claude session, prompt and agent adds a line`);
    if (rest[0] === 'grep') {
      const needle = rest.slice(1).join(' ').toLowerCase();
      for (const line of lines) if (line.toLowerCase().includes(needle)) console.log(line);
      break;
    }
    const i = rest.indexOf('-n');
    console.log(lines.slice(-(i >= 0 ? Number(rest[i + 1]) || 40 : 40)).join('\n'));
    break;
  }
  case 'grep': {
    const needle = rest.join(' ').toLowerCase();
    if (!needle) fail('grep what?');
    for (const line of readLines(HISTORY)) if (line.toLowerCase().includes(needle)) console.log(line);
    break;
  }
  case 'runs': {
    const runs = listRuns().filter((r) => !rest[0] || r.type === rest[0]).slice(0, 25);
    if (!runs.length) fail('no runs yet');
    for (const r of runs) {
      const s = readSummary(r.dir);
      const result = (s['result'] ?? '?').replace(/ \(pid \d+\)$/, '');
      const took = /after (.+)$/.exec(s['finished'] ?? '')?.[1] ?? '';
      const when = `${r.name.slice(0, 10)} ${r.name.slice(11, 19).replace(/-/g, ':')}`;
      console.log(`${when}  ${r.type.padEnd(22)} ${result.padEnd(16)} ${took.padStart(7)}  ${rel(r.dir)}`);
    }
    break;
  }
  case 'show': {
    const r = pick(rest[0]);
    console.log(readFileSync(join(r.dir, 'summary.txt'), 'utf8').trimEnd());
    console.log('\nevents:');
    const events = readLines(join(r.dir, 'events.log'));
    console.log((events.length > 60 ? ['  …', ...events.slice(-60)] : events).join('\n'));
    break;
  }
  case 'follow': {
    const r = pick(rest[0]);
    const file = join(r.dir, 'events.log');
    console.log(`following ${rel(file)} (Ctrl-C to stop)`);
    let pos = 0;
    const flush = () => {
      if (!existsSync(file)) return;
      const size = statSync(file).size;
      if (size <= pos) return;
      const fd = openSync(file, 'r');
      const buf = Buffer.alloc(size - pos);
      readSync(fd, buf, 0, buf.length, pos);
      closeSync(fd);
      pos = size;
      process.stdout.write(buf.toString('utf8'));
    };
    flush();
    watch(r.dir, flush);
    setInterval(flush, 1000);
    break;
  }
  case 'open': {
    const dir = rest[0] ? pick(rest[0]).dir : ROOT;
    spawnSync('open', [dir], { stdio: 'inherit' });
    break;
  }
  case 'path': {
    console.log(rest[0] ? pick(rest[0]).dir : ROOT);
    break;
  }
  default:
    fail(`unknown command ${cmd}; use tail, -n, grep, orch, runs, show, follow, open or path (see the top of ${relative(process.cwd(), join(REPO, 'tools', 'logs.mjs'))})`);
}
