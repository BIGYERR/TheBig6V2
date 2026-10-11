// tools/run.mjs as a real process: what a caller sees is exactly what an unwrapped command shows (stdout, stderr,
// exit code), and the run folder holds the output, the events and the summary. Runs go to a temp IA_RUNS_DIR.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const WRAPPER = resolve(fileURLToPath(import.meta.url), '../../../../tools/run.mjs');

function fresh() {
  const root = mkdtempSync(join(tmpdir(), 'ia-run-'));
  const env: NodeJS.ProcessEnv = { ...process.env, IA_RUNS_DIR: root, IA_ORCH_LOG: join(root, 'orchestration.log') };
  delete env['IA_RUN_DIR'];
  delete env['npm_lifecycle_event'];
  delete env['npm_lifecycle_script'];
  delete env['IA_RUN_ID'];
  delete env['FORCE_COLOR'];
  return { root, env };
}
const runsOf = (root: string) => (existsSync(join(root, 'runs')) ? readdirSync(join(root, 'runs')) : []);
const read = (...p: string[]) => readFileSync(join(...p), 'utf8');

const SCRIPT = `
console.log('first line');
console.error('to stderr');
console.log('  FAIL #07 race-10k/race-day  the race day sheet did not open');
console.error('Error: something broke');
console.log('ℹ tests 4');
console.log('ℹ pass 3');
console.log('ℹ fail 1');
process.exit(3);`;

describe('tools/run.mjs', () => {
  it('passes stdout, stderr and the exit code through byte for byte', () => {
    const { root, env } = fresh();
    const bare = spawnSync(process.execPath, ['-e', SCRIPT], { encoding: 'utf8', env });
    const wrapped = spawnSync(process.execPath, [WRAPPER, 'unit', '--', process.execPath, '-e', SCRIPT], { encoding: 'utf8', env });
    assert.equal(wrapped.status, 3);
    assert.equal(wrapped.stdout, bare.stdout);
    assert.equal(wrapped.stderr, bare.stderr, 'nothing added to stderr when no terminal is watching');
    assert.equal(runsOf(root).length, 1);
  });

  it('keeps every line, the notable ones as events, and the counts in the summary', () => {
    const { root, env } = fresh();
    spawnSync(process.execPath, [WRAPPER, 'unit', '--', process.execPath, '-e', SCRIPT], { encoding: 'utf8', env });
    const dir = join(root, 'runs', runsOf(root)[0]!);
    const output = read(dir, 'output.log');
    assert.match(output, / {2}stdout {2}first line\n/);
    assert.match(output, / {2}stderr {2}to stderr\n/);
    const events = read(dir, 'events.log');
    assert.match(events, / {2}step {6}FAIL #07 race-10k\/race-day/);
    assert.match(events, / {2}error {5}Error: something broke/);
    assert.match(events, / {2}run {7}FAIL after .* \(exit 3\): tests 4, pass 3, fail 1 · /);
    const history = read(root, 'events.log');
    assert.match(history, /started: \S+ -e /);
    assert.match(history, /Error: something broke/);
    assert.match(read(dir, 'summary.txt'), /^result\s+FAIL \(exit 3\)$/m);
  });

  it('adds a step to the run it is already inside instead of opening another', () => {
    const { root, env } = fresh();
    const outer = spawnSync(
      process.execPath,
      [WRAPPER, 'outer', '--', process.execPath, WRAPPER, 'inner', '--', process.execPath, '-e', 'console.log("hi")'],
      { encoding: 'utf8', env },
    );
    assert.equal(outer.status, 0);
    assert.equal(outer.stdout, 'hi\n');
    const runs = runsOf(root);
    assert.equal(runs.length, 1);
    assert.match(runs[0]!, /-outer$/);
    assert.match(read(root, 'runs', runs[0]!, 'events.log'), / {2}step {6}inner: /);
  });

  it('puts one line in the machine log for the top-level run, as the npm script that asked for it, and none for nested steps', () => {
    const { root, env } = fresh();
    spawnSync(process.execPath, [WRAPPER, 'outer', '--', process.execPath, WRAPPER, 'inner', '--', process.execPath, '-e', '0'], {
      encoding: 'utf8',
      env: { ...env, npm_lifecycle_event: 'e2e', npm_lifecycle_script: 'node ../tools/run.mjs e2e -- node e2e/launch.ts' },
    });
    const orch = read(root, 'orchestration.log').split('\n').filter(Boolean);
    assert.equal(orch.length, 1);
    assert.match(orch[0]!, / outer {15}npm run e2e \(/);
    assert.ok(orch[0]!.endsWith(join(root, 'runs', runsOf(root)[0]!)));
  });

  it('collects a file the command wrote, and hands the command a folder in its artifacts', () => {
    const { root, env } = fresh();
    const made = join(root, 'made.txt');
    const script = `require('fs').writeFileSync(${JSON.stringify(made)}, 'blast radius'); require('fs').mkdirSync(process.env.OUT_DIR, {recursive: true}); require('fs').writeFileSync(require('path').join(process.env.OUT_DIR, 'shard.json'), '{}')`;
    const r = spawnSync(process.execPath, [WRAPPER, 'fuzz', '--collect', made, '--artifact-env', 'OUT_DIR=shards', '--', process.execPath, '-e', script], {
      encoding: 'utf8',
      env,
    });
    assert.equal(r.status, 0);
    const dir = join(root, 'runs', runsOf(root)[0]!);
    assert.equal(read(dir, 'artifacts', 'made.txt'), 'blast radius');
    assert.ok(existsSync(join(dir, 'artifacts', 'shards', 'shard.json')));
  });

  it('names a subcommand run after its subcommand with --sub', () => {
    const { root, env } = fresh();
    spawnSync(process.execPath, [WRAPPER, 'heroku', '--sub', '--', process.execPath, '-e', '0', 'deploy'], { encoding: 'utf8', env });
    assert.match(runsOf(root)[0]!, /-heroku-deploy$/);
  });

  it('records a server stopped by a signal as STOPPED, after the command has stopped', async () => {
    const { root, env } = fresh();
    const server = `console.log('listening'); process.on('SIGINT', () => { console.log('closing'); process.exit(0); }); setInterval(() => {}, 1000);`;
    const child = spawn(process.execPath, [WRAPPER, 'server-test', '--', process.execPath, '-e', server], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    await new Promise<void>((done) => child.stdout.on('data', () => out.includes('listening') && done()));
    child.kill('SIGINT');
    const code = await new Promise<number | null>((done) => child.on('close', done));
    assert.equal(code, 0);
    assert.match(out, /closing/);
    const dir = join(root, 'runs', runsOf(root)[0]!);
    assert.match(read(dir, 'summary.txt'), /^result\s+STOPPED \(SIGINT\)$/m);
  });

  it('still runs the command, unchanged, when the run folder cannot be made', () => {
    const { root, env } = fresh();
    const blocker = join(root, 'not-a-folder');
    writeFileSync(blocker, '');
    const r = spawnSync(process.execPath, [WRAPPER, 'unit', '--', process.execPath, '-e', 'console.log("ran"); process.exit(4)'], {
      encoding: 'utf8',
      env: { ...env, IA_RUNS_DIR: blocker },
    });
    assert.equal(r.status, 4);
    assert.equal(r.stdout, 'ran\n');
    assert.equal(r.stderr, '');
  });
});
