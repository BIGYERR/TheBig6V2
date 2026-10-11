// tools/runlog.mjs: the event format, the run folder and summary, the shared history, latest links, attaching, pruning
// the iCloud exclusion and the machine's orchestration log. Every test writes into its own temp folder (IA_RUNS_DIR,
// IA_ORCH_LOG), never into the repo's temp/ or the real orchestration log.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const root = mkdtempSync(join(tmpdir(), 'ia-runlog-'));
process.env['IA_RUNS_DIR'] = root;
process.env['IA_RUNS_KEEP'] = '3';
process.env['IA_RUNS_KEEP_DAYS'] = '10';
process.env['IA_ORCH_LOG'] = join(root, 'machine', 'orchestration.log');
delete process.env['IA_RUN_DIR'];
// The "who" column reads these; each test below sets the case it checks.
delete process.env['GITHUB_ACTIONS'];
delete process.env['CLAUDECODE'];
delete process.env['npm_lifecycle_event'];
delete process.env['npm_lifecycle_script'];
// Imported after the environment is set: the module reads IA_RUNS_DIR and the limits once, when it loads.
const R = await import('../../../tools/runlog.mjs');

const lines = (file: string) => readFileSync(file, 'utf8').split('\n').filter(Boolean);
const EVENT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} {2}\S.{24} {2}\S.{7} {2}\S/;

describe('event lines', () => {
  it('read time, run id, subject, description in fixed columns', () => {
    const line = R.eventLine(new Date(2026, 9, 11, 15, 58, 3, 412), 'e2e@155803', 'step', 'PASS #01 strength/home-empty');
    assert.equal(line, '2026-10-11 15:58:03.412  e2e@155803                 step      PASS #01 strength/home-empty\n');
    assert.match(line, EVENT);
  });

  it('keep every event on one line, without colour codes', () => {
    const line = R.eventLine(new Date(), 'x@000000', 'fail', '\x1b[31mred\x1b[0m\nsecond line  ');
    assert.ok(line.endsWith('red ⏎ second line\n'));
    assert.equal(line.split('\n').length, 2);
  });

  it('say durations the way a person reads them', () => {
    assert.equal(R.duration(840), '840 ms');
    assert.equal(R.duration(3100), '3.1 s');
    assert.equal(R.duration(142_000), '2m22s');
    assert.equal(R.duration(3_720_000), '1h02m');
  });
});

describe('a run', () => {
  it('gets a folder named for when it started and what it is, and a start line in both logs', () => {
    const run = R.startRun('unit', { command: 'node --test', cwd: root });
    assert.match(run.dir.slice(root.length + 1), /^runs\/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-unit$/);
    assert.match(run.id, /^unit@\d{6}$/);
    const own = lines(join(run.dir, 'events.log'));
    assert.match(own[0]!, / {2}run {7}started: node --test /);
    assert.ok(lines(R.HISTORY).some((l) => l.includes(run.id) && l.includes('started: node --test')));
    assert.match(readFileSync(join(run.dir, 'summary.txt'), 'utf8'), /^result\s+RUNNING \(pid \d+\)$/m);
    run.finish({ exitCode: 0, details: ['tests 3, pass 3, fail 0'] });
  });

  it('never shares a folder with another run of the same type started the same second', () => {
    const a = R.startRun('twin');
    const b = R.startRun('twin');
    assert.notEqual(a.dir, b.dir);
    assert.ok(existsSync(a.dir) && existsSync(b.dir));
    a.finish();
    b.finish();
  });

  it('ends PASS, FAIL or STOPPED, in its summary and in the history, and becomes latest/<type>', () => {
    const pass = R.startRun('ends');
    pass.finish({ exitCode: 0 });
    const fail = R.startRun('ends');
    fail.event('fail', 'FAIL: something', { global: true });
    fail.finish({ exitCode: 2 });
    const stop = R.startRun('server-x');
    stop.finish({ stopped: true, signal: 'SIGINT' });
    const summary = (r: { dir: string }) => R.readSummary(r.dir)['result'];
    assert.equal(summary(pass), 'PASS');
    assert.equal(summary(fail), 'FAIL (exit 2)');
    assert.equal(summary(stop), 'STOPPED (SIGINT)');
    const history = lines(R.HISTORY);
    assert.ok(history.some((l) => l.includes(fail.id) && / {2}run {7}FAIL after .* \(exit 2\)/.test(l)));
    assert.ok(history.some((l) => l.includes(fail.id) && l.includes('FAIL: something')));
    assert.ok(history.some((l) => l.includes(stop.id) && l.includes('STOPPED after')));
    assert.equal(readlinkSync(join(R.LATEST, 'ends')), join('..', 'runs', fail.dir.split('/').at(-1)!));
  });

  it('finishes once', () => {
    const run = R.startRun('once');
    run.finish({ exitCode: 0 });
    run.finish({ exitCode: 1 });
    assert.equal(lines(join(run.dir, 'events.log')).filter((l) => l.includes('  run       ')).length, 2);
  });

  it('keeps output lines and artifacts in its folder', () => {
    const run = R.startRun('files');
    run.output('stdout', '\x1b[32mhello\x1b[0m');
    run.output('stderr', 'oops');
    const out = lines(join(run.dir, 'output.log'));
    assert.match(out[0]!, /^\S+ \S+ {2}stdout {2}hello$/);
    assert.match(out[1]!, /^\S+ \S+ {2}stderr {2}oops$/);
    const saved = run.saveArtifact(join(run.dir, 'output.log'), 'copy.log');
    assert.equal(saved, join(run.dir, 'artifacts', 'copy.log'));
    run.finish();
    assert.match(readFileSync(join(run.dir, 'summary.txt'), 'utf8'), /output\.log \(2 lines\), artifacts\//);
  });
});

describe('joining a run', () => {
  it('adds events to the wrapper\'s run and never opens or finishes one of its own', () => {
    const parent = R.startRun('parent');
    process.env['IA_RUN_DIR'] = parent.dir;
    process.env['IA_RUN_ID'] = parent.id;
    try {
      const joined = R.attachRun();
      assert.ok(joined);
      assert.equal(joined.owned, false);
      joined.event('step', 'from the child');
      joined.finish({ exitCode: 9 });
      assert.ok(lines(join(parent.dir, 'events.log')).some((l) => l.includes(parent.id) && l.includes('from the child')));
      assert.match(readFileSync(join(parent.dir, 'summary.txt'), 'utf8'), /RUNNING/);
    } finally {
      delete process.env['IA_RUN_DIR'];
      delete process.env['IA_RUN_ID'];
    }
    parent.finish();
    assert.equal(R.attachRun(), null);
  });
});

describe('pruning', () => {
  it('drops a run only when it is past both limits: older than KEEP_DAYS and not among the newest KEEP of its type', () => {
    const old = (daysAgo: number, type: string) => {
      const d = new Date(Date.now() - daysAgo * 86_400_000);
      mkdirSync(join(R.RUNS, `${R.folderStamp(d)}-${type}`), { recursive: true });
    };
    for (const days of [40, 41, 42, 43, 44]) old(days, 'prunable');
    old(0, 'prunable');
    old(1, 'prunable');
    old(60, 'lonely');
    R.prune();
    const left = (type: string) => readdirSync(R.RUNS).filter((n) => n.endsWith(`-${type}`)).sort();
    assert.equal(left('prunable').length, 3, 'the newest 3 of the type');
    assert.ok(left('prunable').every((n) => n >= R.folderStamp(new Date(Date.now() - 41 * 86_400_000))));
    assert.equal(left('lonely').length, 1, 'an old run that is still among the newest 3 of its type stays');
  });
});

describe('the temp folder', { skip: process.platform !== 'darwin' && 'macOS only' }, () => {
  it('is excluded from iCloud by the File Provider ignore attribute', () => {
    R.ensureRoot();
    assert.equal(execFileSync('xattr', ['-p', 'com.apple.fileprovider.ignore#P', root], { encoding: 'utf8' }).trim(), '1');
  });
});

describe('the machine orchestration log', () => {
  const orch = () => lines(R.ORCH_LOG);

  it('gets exactly one line per run started, naming who, what and the folder to open', () => {
    const before = orch().length;
    process.env['CLAUDECODE'] = '1';
    const run = R.startRun('orch-test', { command: 'node --test x', cwd: root });
    delete process.env['CLAUDECODE'];
    run.event('step', 'a step');
    run.finish({ exitCode: 0 });
    const added = orch().slice(before);
    assert.equal(added.length, 1, 'a start, and nothing for its steps or its finish');
    assert.match(added[0]!, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} {2}claude {2}orch-test {11}node --test x \(/);
    assert.ok(added[0]!.endsWith(`  -> ${run.dir}`));
  });

  it('says "you" for a run started outside Claude', () => {
    delete process.env['CLAUDECODE'];
    const run = R.startRun('orch-you');
    run.finish();
    assert.match(orch().at(-1)!, /^\S+ \S+ {2}you {5}orch-you /);
  });

  it('says "ci" for a run in GitHub Actions', () => {
    process.env['GITHUB_ACTIONS'] = 'true';
    const run = R.startRun('orch-ci');
    delete process.env['GITHUB_ACTIONS'];
    run.finish();
    assert.match(orch().at(-1)!, /^\S+ \S+ {2}ci {6}orch-ci /);
  });

  it('writes the same columns for Claude\'s own starts', () => {
    assert.equal(
      R.orchestrationLine(new Date(2026, 9, 11, 16, 20, 1), 'you', 'prompt', '"run the e2e again"', '/x/session.jsonl'),
      '2026-10-11 16:20:01  you     prompt              "run the e2e again"  -> /x/session.jsonl\n',
    );
  });
});
