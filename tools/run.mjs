#!/usr/bin/env node
// Runs a command as a logged run (see tools/runlog.mjs): a folder under temp/runs/, its output timestamped in
// output.log, its notable lines as events, a summary, and a start and finish line in temp/events.log.
//
//   node tools/run.mjs <type> [--sub] [--collect <file>]... -- <command> [args...]
//
//   <type>             what the run is, lower-case words joined by dashes: unit, e2e, gate, server-pwa-local, ...
//   --sub              add the command's last argument to the type when it is a plain word (heroku + deploy ->
//                      heroku-deploy), so a script with subcommands gets one type per subcommand
//   --collect <file>   copy this file into the run's artifacts/ at the end if the run wrote it (gate.sh's
//                      temp/last_diff.txt)
//   --artifact-env NAME=sub   give the command NAME=<this run's artifacts>/sub unless NAME is already set
//                      (fuzz.sh keeps its shard results in FUZZ_OUT)
//
// The command's stdout and stderr pass through unchanged, byte for byte, and its exit code is this process's exit
// code, so wrapping changes nothing a caller parses. This script adds nothing to either stream unless a person is
// watching (stderr is a terminal): then one line says where the run is logged, and one how it ended. The command sees IA_RUN_DIR and IA_RUN_ID, so a script that knows
// about runs can add its own events and artifacts, and a wrapped command run inside another run (a nested
// `node tools/run.mjs`) adds a step to that run instead of opening its own. If the run folder cannot be made, the
// command runs exactly as it would unwrapped, and one warning goes to stderr.
import { spawn, spawnSync } from 'node:child_process';
import { constants } from 'node:os';
import { existsSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { REPO, ROOT, attachRun, oneLine, startRun } from './runlog.mjs';

/** Lines worth an event. Each rule returns [subject, text, global?] or a detail for the summary. */
const RULES = [
  // e2e steps (the runner prints "  PASS #09 strength/rest-sheet  parity 0.000% (0 px)", and "  PASS #W02 ..." for a
  // website or admin page: the band's letter, then the number)
  { re: /^\s*(PASS|FAIL) #[A-Z]?\d+\s.*/, event: (m) => ['step', m[0].trim(), m[1] === 'FAIL'] },
  // gate.sh's verdict
  { re: /^(ALL GATES PASS|GATES RED .*)$/, event: (m) => ['verdict', m[0], true], detail: (m) => m[0] },
  // e2e's verdict
  { re: /^e2e: (\d+\/\d+ steps passed.*)$/, event: (m) => ['verdict', m[1], true], detail: (m) => m[1] },
  // fuzz, sabotage and single-gate summaries
  { re: /^(FUZZTOTAL .*|ANCHORS \d+ checked.*|PASS \d+ FAIL \d+)$/, detail: (m) => m[1] },
  { re: /^SABOTAGE (tripped=.*)$/, event: (m) => ['verdict', m[0], true], detail: (m) => m[1] },
  { re: /^\s*(?:SURVIVED|CRASH)\b.*/, event: (m) => ['fail', m[0].trim(), true] },
  // node --test's closing counts
  { re: /^ℹ (tests|pass|fail|cancelled|skipped|todo) (\d+)$/, count: true },
  // a request served by pwa-local or the backend ("request GET /index.html 200 3 ms ...")
  { re: /^\s*request (GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS) .*/, event: (m) => ['request', m[0].trim().slice(8), false] },
  // failures and errors, in the forms the suites print them
  { re: /^\s*(?:FAIL\b.*|✖ .*|not ok \d+.*|RED\b.*)$/, event: (m) => ['fail', m[0].trim(), true] },
  { re: /^\s*(?:Uncaught )?(?:(?:[A-Z][A-Za-z]*)?Error|npm (?:ERR!|error))(?: \[[A-Z_]+\])?:? .*/, event: (m) => ['error', m[0].trim(), true] },
];
/** At most this many failure lines per run go to the shared history; the rest stay in the run's own events. */
const GLOBAL_CAP = 20;

/** Says something to the person at the terminal; silent when stderr is a pipe, so no caller's capture changes. */
const tell = (text) => process.stderr.isTTY && process.stderr.write(`${text}\n`);

function usage(msg) {
  process.stderr.write(`run: ${msg}\nusage: node tools/run.mjs <type> [--sub] [--collect <file>]... -- <command> [args...]\n`);
  process.exit(2);
}

const argv = process.argv.slice(2);
const sep = argv.indexOf('--');
if (sep < 1) usage('give a type, then --, then the command');
const opts = argv.slice(0, sep);
const cmd = argv.slice(sep + 1);
if (!cmd.length) usage('no command after --');
let type = opts[0];
const collect = [];
const artifactEnv = [];
for (let i = 1; i < opts.length; i++) {
  if (opts[i] === '--sub') {
    const last = cmd.at(-1);
    if (cmd.length > 2 && /^[a-z][a-z0-9-]*$/.test(last)) type = `${type}-${last}`;
  } else if (opts[i] === '--collect' && opts[i + 1]) collect.push(resolve(opts[++i]));
  else if (opts[i] === '--artifact-env' && /^[A-Z_][A-Z0-9_]*=[\w.-]+$/.test(opts[i + 1] ?? '')) artifactEnv.push(opts[++i].split('='));
  else usage(`unknown option ${opts[i]}`);
}
const commandText = cmd.map((a) => (/[\s'"*?$]/.test(a) ? `'${a.replace(/'/g, `'\\''`)}'` : a)).join(' ');

/** Runs the command with nothing captured, as if unwrapped, and exits with its code. */
function passthrough() {
  const r = spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit' });
  if (r.error) {
    process.stderr.write(`run: ${r.error.message}\n`);
    process.exit(127);
  }
  process.exit(r.status ?? 128 + (constants.signals[r.signal] ?? 1));
}

// Inside another run: this command is one step of it.
if (process.env.IA_RUN_DIR) {
  attachRun()?.event('step', `${type}: ${commandText}`);
  passthrough();
}

let run;
try {
  run = startRun(type, { command: commandText, cwd: process.cwd() });
} catch (err) {
  tell(`run: not logged (${err.message}); running ${type} anyway`);
  passthrough();
}

const where = relative(process.cwd(), run.dir) || run.dir;
tell(`[run] ${run.id} logging to ${where}/`);

const env = { ...process.env, IA_RUN_DIR: run.dir, IA_RUN_ID: run.id, IA_RUNS_DIR: ROOT };
// Colour the terminal as an unwrapped run would; the logs strip colour codes either way.
if (process.stdout.isTTY && !process.env.NO_COLOR && process.env.FORCE_COLOR === undefined) env.FORCE_COLOR = '1';
for (const [name, sub] of artifactEnv) env[name] ??= run.artifact(sub);

const child = spawn(cmd[0], cmd.slice(1), { stdio: ['inherit', 'pipe', 'pipe'], env });
const counts = {};
const details = [];
let globalFails = 0;
let extraFails = 0;

function onLine(stream, raw) {
  // A progress bar rewrites its line with \r; the log keeps what was left on screen.
  const line = oneLine(raw.split('\r').at(-1) ?? '');
  run.output(stream, line);
  for (const rule of RULES) {
    const m = rule.re.exec(line);
    if (!m) continue;
    if (rule.count) counts[m[1]] = Number(m[2]);
    if (rule.detail) {
      const d = rule.detail(m);
      if (!details.includes(d) && details.length < 4) details.push(d);
    }
    if (rule.event) {
      let [subject, text, global] = rule.event(m);
      if (global && (subject === 'fail' || subject === 'error')) {
        if (globalFails >= GLOBAL_CAP) {
          global = false;
          extraFails++;
        } else globalFails++;
      }
      run.event(subject, text, { global });
    }
    break;
  }
}

function pipe(src, dest, stream) {
  let buf = '';
  src.setEncoding('utf8');
  src.on('data', (chunk) => {
    dest.write(chunk);
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      onLine(stream, buf.slice(0, i));
      buf = buf.slice(i + 1);
    }
  });
  src.on('end', () => {
    if (buf) onLine(stream, buf);
  });
}
pipe(child.stdout, process.stdout, 'stdout');
pipe(child.stderr, process.stderr, 'stderr');

// Ctrl-C reaches the command too (same process group); a signal sent to this process alone is passed on.
let stoppedBy = null;
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    stoppedBy ??= sig;
    run.event('signal', `${sig} received; waiting for the command to stop`);
    setTimeout(() => child.exitCode === null && child.signalCode === null && child.kill(sig), sig === 'SIGINT' ? 500 : 0).unref();
  });
}

child.on('error', (err) => {
  run.event('error', `could not start ${cmd[0]}: ${err.message}`, { global: true });
  run.finish({ exitCode: 127 });
  process.exit(127);
});

child.on('close', (code, signal) => {
  for (const file of collect) {
    try {
      if (existsSync(file) && statSync(file).mtimeMs >= run.startedAt - 1000) run.saveArtifact(file);
    } catch {
      // Nothing to collect.
    }
  }
  if (Object.keys(counts).length) {
    // tests, pass and fail always; cancelled, skipped and todo only when there were some.
    const shown = ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].filter((k) => k in counts && (counts[k] > 0 || ['tests', 'pass', 'fail'].includes(k)));
    details.unshift(shown.map((k) => `${k} ${counts[k]}`).join(', '));
  }
  if (extraFails) run.event('fail', `${extraFails} more failure lines; see ${relative(REPO, run.dir)}/events.log`, { global: true });
  const exitCode = code ?? 128 + (constants.signals[signal] ?? 1);
  run.finish({ exitCode, signal: signal ?? stoppedBy, stopped: Boolean(stoppedBy), details });
  tell(`[run] ${run.id} ${stoppedBy || signal ? 'stopped' : exitCode === 0 ? 'passed' : `failed (exit ${exitCode})`}: ${where}/`);
  process.exitCode = exitCode;
});
