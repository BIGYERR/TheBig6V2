// The run log. Every test, e2e, build, deploy and server session is a "run": one folder under temp/runs/, named by
// when it started and what it is (2026-10-11_15-58-03-e2e), plus lines in one shared history, temp/events.log.
//
//   temp/events.log                     the history: every run's start and finish, every failure, every deploy, every
//                                       Claude session and agent, one line each, oldest first
//   temp/runs/<stamp>-<type>/
//     events.log                        this run's events, as they happen (a live server appends to it while it runs)
//     output.log                        everything the run printed, stdout and stderr, each line timestamped
//     summary.txt                       what ran, where, on which commit and ia-version, how long, and the result
//     artifacts/                        files the run made: the e2e report and collage, docker and xcodebuild logs, ...
//   temp/latest/<type>                  a link to the newest run of each type
//   temp/orchestration.log              a link to the machine's orchestration log (below)
//
// One level up, for the whole machine: ~/Library/Logs/IronAsylum/orchestration.log (IA_ORCH_LOG moves it) has one
// line per top-level start, from every checkout and worktree, whoever started it: each logged run, each Claude
// session, each prompt given to Claude and each agent it dispatched, with the folder (or transcript) to open:
//   2026-10-11 16:16:27  you     e2e                 npm run e2e (TheBig6V2/app; main 618605d; ia-version 239)
//                                                    -> /Users/.../TheBig6V2/temp/runs/2026-10-11_16-16-27-e2e
// (on one line). "you" is a terminal; "claude" is a command Claude ran.
//
// Every event line reads the same, so one grep works across all of them:
//   2026-10-11 15:58:03.412  e2e@155803                run       started: node e2e/launch.ts (main 618605d, ...)
//   <local time, ms>         <type>@<HHMMSS of start>  <subject> <description>
//
// temp/ sits in the repo (gitignored) and is excluded from iCloud with the File Provider ignore attribute, applied
// every time a run starts, so deleting and recreating the folder cannot make it sync. IA_RUNS_DIR moves it.
// Logging never changes what a run does: every write here swallows its own errors.
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, hostname } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ROOT = process.env.IA_RUNS_DIR ? resolve(process.env.IA_RUNS_DIR) : join(REPO, 'temp');
export const RUNS = join(ROOT, 'runs');
export const LATEST = join(ROOT, 'latest');
export const HISTORY = join(ROOT, 'events.log');
/** The machine-level orchestration log: one line per top-level start, across every checkout. */
export const ORCH_LOG = process.env.IA_ORCH_LOG
  ? resolve(process.env.IA_ORCH_LOG)
  : join(homedir(), ...(process.platform === 'darwin' ? ['Library', 'Logs', 'IronAsylum'] : ['.local', 'state', 'iron-asylum']), 'orchestration.log');

/** Runs kept per type: the newest KEEP of each type, and every run younger than KEEP_DAYS, whichever keeps more. */
const KEEP = positive(process.env.IA_RUNS_KEEP, 30);
const KEEP_DAYS = positive(process.env.IA_RUNS_KEEP_DAYS, 30);
/** The history rolls over to events-<stamp>.log past this size. */
const HISTORY_MAX = 20 * 1024 * 1024;

const ID_WIDTH = 25;
const SUBJECT_WIDTH = 8;
const TYPE = /^[a-z0-9][a-z0-9-]*$/;
const FOLDER = /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-([a-z0-9][a-z0-9-]*?)(?:-(\d+))?$/;
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07]*\x07/g;

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && value !== undefined && value !== '' ? n : fallback;
}

const two = (n) => String(n).padStart(2, '0');

/** Local time with milliseconds: 2026-10-11 15:58:03.412. */
export function timestamp(d = new Date()) {
  return (
    `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ` +
    `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
  );
}

/** The folder name's time part: 2026-10-11_15-58-03 (sorts in time order, safe in every file system). */
export function folderStamp(d = new Date()) {
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}_${two(d.getHours())}-${two(d.getMinutes())}-${two(d.getSeconds())}`;
}

export const stripAnsi = (s) => String(s).replace(ANSI, '');

/** One line, whatever came in: colour codes out, line breaks shown as ⏎, trailing space trimmed. */
export function oneLine(s) {
  return stripAnsi(s).replace(/\r?\n/g, ' ⏎ ').replace(/\s+$/, '');
}

/** The one event format: time, run id, subject, description. */
export function eventLine(time, runId, subject, text) {
  return `${timestamp(time)}  ${String(runId).padEnd(ID_WIDTH)}  ${String(subject).padEnd(SUBJECT_WIDTH)}  ${oneLine(text)}\n`;
}

/** 840 ms, 3.1 s, 2m22s, 1h02m. */
export function duration(ms) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const s = Math.round(ms / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m${two(s % 60)}s`;
  return `${Math.floor(s / 3600)}h${two(Math.floor((s % 3600) / 60))}m`;
}

function append(path, text) {
  try {
    appendFileSync(path, text);
  } catch {
    // Logging never fails a run.
  }
}

let rootReady = false;

/** Creates temp/ (and runs/, latest/) and keeps it out of iCloud and out of git. Safe to call any number of times. */
export function ensureRoot() {
  if (rootReady) return;
  mkdirSync(RUNS, { recursive: true });
  mkdirSync(LATEST, { recursive: true });
  if (process.platform === 'darwin') {
    try {
      // iCloud Drive's File Provider skips an item with this attribute, and everything under it. Measured on this Mac:
      // the folder reads isExcludedFromSync = 1 and its files are unknown to iCloud. (".nosync" is not honoured.)
      execFileSync('xattr', ['-w', 'com.apple.fileprovider.ignore#P', '1', ROOT], { stdio: 'ignore', timeout: 3000 });
    } catch {
      // Not on iCloud, or xattr is missing: nothing to exclude.
    }
  }
  rotateHistory();
  // temp/orchestration.log opens the machine log from inside the checkout (only for the checkout's own temp/).
  if (!process.env.IA_RUNS_DIR) {
    try {
      symlinkSync(ORCH_LOG, join(ROOT, 'orchestration.log'));
    } catch {
      // Already linked.
    }
  }
  rootReady = true;
}

function rotateHistory() {
  try {
    if (statSync(HISTORY).size > HISTORY_MAX) renameSync(HISTORY, join(ROOT, `events-${folderStamp()}.log`));
  } catch {
    // No history yet.
  }
}

function git(args) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 }).trim();
  } catch {
    return '';
  }
}

/** Where the run happens: git branch, commit and uncommitted change count, the app's ia-version, the machine. */
export function context() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = git(['rev-parse', '--short', 'HEAD']);
  const changed = git(['status', '--porcelain']).split('\n').filter(Boolean).length;
  let version = '';
  try {
    const raw = readFileSync(join(REPO, 'index.html'), 'utf8').slice(0, 20000).match(/name="ia-version" content="([^"]*)"/)?.[1] ?? '';
    // Kept as written (239 stays "239", 0.239.1 stays "0.239.1"), and only when tests/semver.js parses it: parse throws.
    createRequire(import.meta.url)('../tests/semver.js').parse(raw);
    version = raw;
  } catch {
    // No index.html here (a container), no meta, or a meta that is not a version: leave it out.
  }
  return { branch, commit, changed, version, host: hostname().replace(/\.local$/, ''), node: process.version };
}

function gitText(c) {
  if (!c.commit) return 'no git';
  return `${c.branch} ${c.commit}${c.changed ? `, ${c.changed} uncommitted change${c.changed === 1 ? '' : 's'}` : ''}`;
}

function parseFolder(name) {
  const m = FOLDER.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, type] = m;
  return { type, time: new Date(+y, +mo - 1, +d, +h, +mi, +s).getTime() };
}

/** Deletes runs past the limits: per type, a run goes once it is older than KEEP_DAYS and not among the newest KEEP. */
export function prune(now = Date.now()) {
  let names;
  try {
    names = readdirSync(RUNS);
  } catch {
    return;
  }
  const byType = new Map();
  for (const name of names) {
    const info = parseFolder(name);
    if (!info) continue;
    if (!byType.has(info.type)) byType.set(info.type, []);
    byType.get(info.type).push({ name, ...info });
  }
  const cutoff = now - KEEP_DAYS * 86_400_000;
  for (const runs of byType.values()) {
    runs.sort((a, b) => b.name.localeCompare(a.name));
    for (const r of runs.slice(KEEP)) {
      if (r.time < cutoff) rmSync(join(RUNS, r.name), { recursive: true, force: true });
    }
  }
}

/** Who started it: GitHub Actions ("ci"), Claude's shells and hooks (CLAUDECODE=1), or a terminal ("you"). */
export const origin = () => (process.env.GITHUB_ACTIONS === 'true' ? 'ci' : process.env.CLAUDECODE === '1' ? 'claude' : 'you');

/** The checkout, as a person names it: "TheBig6V2", or "worktree e2e-typescript" for a Claude worktree. */
export function checkoutName() {
  const m = /\/\.claude\/worktrees\/([^/]+)$/.exec(REPO);
  return m ? `worktree ${m[1]}` : basename(REPO);
}

/**
 * The machine log's one line: time, who, what, then the description and the folder or file to open.
 * @param {Date} time
 * @param {string} who
 * @param {string} what
 * @param {string} text
 * @param {string} [link]
 */
export function orchestrationLine(time, who, what, text, link) {
  const t = timestamp(time).slice(0, 19);
  return `${t}  ${who.padEnd(6)}  ${what.padEnd(18)}  ${oneLine(text)}${link ? `  -> ${link}` : ''}\n`;
}

/**
 * Adds one line to the machine's orchestration log. Never throws.
 * @param {string} what
 * @param {string} text
 * @param {string} [link]
 * @param {string} [who]
 */
export function orchestrationEvent(what, text, link, who = origin()) {
  try {
    mkdirSync(dirname(ORCH_LOG), { recursive: true });
    appendFileSync(ORCH_LOG, orchestrationLine(new Date(), who, what, text, link));
  } catch {
    // Logging never fails a run.
  }
}

/** How a run was asked for: "npm run e2e" when an npm script wrapped it, else the command itself. */
function askedAs(command) {
  const script = process.env.npm_lifecycle_event;
  if (script && /tools\/run\.mjs/.test(process.env.npm_lifecycle_script ?? '')) return script === 'test' ? 'npm test' : `npm run ${script}`;
  return command;
}

function linkLatest(type, dir) {
  try {
    const link = join(LATEST, type);
    const tmp = join(LATEST, `.${type}.${process.pid}`);
    rmSync(tmp, { force: true });
    symlinkSync(join('..', 'runs', basename(dir)), tmp);
    renameSync(tmp, link);
  } catch {
    // A missing "latest" link loses nothing; the run folder is there.
  }
}

export class Run {
  /**
   * @param {{ id: string, type: string, dir: string, command: string, cwd: string, startedAt: number,
   *   ctx: ReturnType<typeof context>, owned: boolean }} init
   */
  constructor({ id, type, dir, command, cwd, startedAt, ctx, owned }) {
    /** `<type>@<HHMMSS>`, the id every event line of this run carries. */
    this.id = id;
    this.type = type;
    /** The run's folder under temp/runs/. */
    this.dir = dir;
    this.command = command;
    this.cwd = cwd;
    /** Epoch ms. */
    this.startedAt = startedAt;
    this.ctx = ctx;
    /** True when this process opened the run (and so finishes it); false when it joined a wrapper's run. */
    this.owned = owned;
    /** @type {number | null} */
    this.outFd = null;
    this.outLines = 0;
    this.events = 0;
    this.finished = false;
  }

  /**
   * Records an event in this run; `global` also puts it in the shared history (starts, finishes, failures).
   * @param {string} subject
   * @param {string} text
   * @param {{ global?: boolean }} [opts]
   */
  event(subject, text, { global = false } = {}) {
    const line = eventLine(new Date(), this.id, subject, text);
    append(join(this.dir, 'events.log'), line);
    if (global) append(HISTORY, line);
    this.events++;
  }

  /** Records one printed line, verbatim but for colour codes, in output.log. */
  output(stream, text) {
    try {
      this.outFd ??= openSync(join(this.dir, 'output.log'), 'a');
      writeSync(this.outFd, `${timestamp()}  ${stream.padEnd(6)}  ${stripAnsi(text)}\n`);
      this.outLines++;
    } catch {
      // Logging never fails a run.
    }
  }

  /** The run's artifacts folder (created on first use), or a path inside it. */
  artifact(...parts) {
    const dir = join(this.dir, 'artifacts');
    const path = join(dir, ...parts);
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      // Reported by whoever writes there.
    }
    return path;
  }

  /** Copies a file into artifacts/ (under `name`, default its own name). Returns the copy's path, or null. */
  saveArtifact(file, name = basename(file)) {
    try {
      const to = this.artifact(name);
      copyFileSync(file, to);
      return to;
    } catch {
      return null;
    }
  }

  /** Writes summary.txt: what ran, where, and (once finished) how it ended. */
  writeSummary({ result, ended, details = [] }) {
    const c = this.ctx;
    const rows = [
      ['run', this.id],
      ['type', this.type],
      ['folder', relative(REPO, this.dir) || this.dir],
      ['command', this.command],
      ['in', this.cwd],
      ['started', `${timestamp(new Date(this.startedAt))} (${new Date(this.startedAt).toISOString()})`],
      ['finished', ended ? `${timestamp(new Date(ended))}, after ${duration(ended - this.startedAt)}` : '-'],
      ['result', result],
      ['details', details.length ? details.join('; ') : '-'],
      ['git', gitText(c)],
      ['ia-version', c.version || '-'],
      ['machine', `${c.host}, node ${c.node}, pid ${process.pid}`],
      ['files', `events.log (${this.events} events), output.log (${this.outLines} lines)${existsSync(join(this.dir, 'artifacts')) ? ', artifacts/' : ''}`],
    ];
    try {
      writeFileSync(join(this.dir, 'summary.txt'), rows.map(([k, v]) => `${k.padEnd(11)} ${v}`).join('\n') + '\n');
    } catch {
      // Logging never fails a run.
    }
  }

  /**
   * Ends the run: PASS on exit 0, FAIL otherwise, STOPPED when it was interrupted (the normal end of a server).
   * Writes the finish line to both logs, the final summary.txt, and points latest/<type> here.
   */
  /** @param {{ exitCode?: number, signal?: string | null, stopped?: boolean, details?: string[] }} [end] */
  finish({ exitCode = 0, signal = null, stopped = false, details = [] } = {}) {
    if (this.finished || !this.owned) return;
    this.finished = true;
    const ended = Date.now();
    const result = stopped || signal ? `STOPPED (${signal ?? 'interrupted'})` : exitCode === 0 ? 'PASS' : `FAIL (exit ${exitCode})`;
    const word = result.split(' ')[0];
    const tail = details.length ? `: ${details.join('; ')}` : '';
    this.event('run', `${word} after ${duration(ended - this.startedAt)}${exitCode !== 0 && exitCode != null ? ` (exit ${exitCode})` : ''}${tail} · ${relative(REPO, this.dir)}`, {
      global: true,
    });
    this.writeSummary({ result, ended, details });
    if (this.outFd != null) {
      try {
        closeSync(this.outFd);
      } catch {
        // Already closed.
      }
      this.outFd = null;
    }
    linkLatest(this.type, this.dir);
  }
}

/**
 * Starts a run of `type`: makes its folder, writes the start line to both logs and a RUNNING summary. Throws only if
 * the folder cannot be made; callers fall back to running unlogged.
 * @param {string} type
 * @param {{ command?: string, cwd?: string }} [info]
 * @returns {Run}
 */
export function startRun(type, { command = '', cwd = process.cwd() } = {}) {
  if (!TYPE.test(type)) throw new Error(`run type must be lower-case words joined by dashes, got "${type}"`);
  ensureRoot();
  prune();
  const now = new Date();
  let dir;
  let suffix = '';
  for (let n = 1; ; n++) {
    suffix = n === 1 ? '' : `-${n}`;
    dir = join(RUNS, `${folderStamp(now)}-${type}${suffix}`);
    try {
      mkdirSync(dir);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
  const id = `${type}@${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}${suffix}`;
  const ctx = context();
  const run = new Run({ id, type, dir, command, cwd, startedAt: now.getTime(), ctx, owned: true });
  const where = relative(REPO, cwd) || '.';
  run.event('run', `started: ${command} (in ${where}; ${gitText(ctx)}${ctx.version ? `; ia-version ${ctx.version}` : ''})`, { global: true });
  const place = where === '.' ? checkoutName() : `${checkoutName()}/${where}`;
  orchestrationEvent(type, `${askedAs(command)} (${place}; ${ctx.commit ? `${ctx.branch} ${ctx.commit}` : 'no git'}${ctx.version ? `; ia-version ${ctx.version}` : ''})`, dir);
  run.writeSummary({ result: `RUNNING (pid ${process.pid})` });
  return run;
}

/**
 * The run this process belongs to, when a wrapper (tools/run.mjs) started it: IA_RUN_DIR names the folder. Events
 * written here land in that run; the wrapper owns its start and finish. Null when there is none.
 * @returns {Run | null}
 */
export function attachRun() {
  const dir = process.env.IA_RUN_DIR;
  if (!dir || !existsSync(dir)) return null;
  const id = process.env.IA_RUN_ID || basename(dir);
  const type = parseFolder(basename(dir))?.type ?? 'run';
  return new Run({ id, type, dir, command: '', cwd: process.cwd(), startedAt: Date.now(), ctx: context(), owned: false });
}

/** Adds one line to the shared history without a run (Claude sessions and agents, one-off notes). */
export function historyEvent(id, subject, text) {
  try {
    ensureRoot();
  } catch {
    return;
  }
  append(HISTORY, eventLine(new Date(), id, subject, text));
}

/** Every run folder, newest first, with its parsed type and start time. */
export function listRuns() {
  let names = [];
  try {
    names = readdirSync(RUNS);
  } catch {
    return [];
  }
  return names
    .map((name) => ({ name, dir: join(RUNS, name), ...parseFolder(name) }))
    .filter((r) => r.type)
    .sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * A summary.txt as a map: { result, details, ... }.
 * @param {string} dir
 * @returns {Record<string, string>}
 */
export function readSummary(dir) {
  /** @type {Record<string, string>} */
  const out = {};
  try {
    for (const line of readFileSync(join(dir, 'summary.txt'), 'utf8').split('\n')) {
      const m = /^(\S+)\s+(.*)$/.exec(line);
      if (m) out[m[1]] = m[2];
    }
  } catch {
    // No summary: the run died before writing one.
  }
  return out;
}
