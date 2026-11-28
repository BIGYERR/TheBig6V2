// The Expo app's Run recorder (MIGRATION.md phase 4; frontends/native/src/run-recorder and modules/ia-gps), by rule.
// Expected values are typed by hand from the rulings (D267 P-GPSTEST, D272 item 6 and its open item, D293, D296:
// docs/decisions/gps-recording.md), from today's screen (frontends/app/src/app/screens/run-recorder/run-recorder.ts),
// today's plugin (frontends/app/plugins-src/ia-gps) and plain arithmetic: north along a meridian at 4 m/s, one fix a
// second, a run covers 4 m a second (one degree of latitude is 111,195.0797 m), so 600 s is 2,400 m, 1.4913 miles
// ("1.49"), and every mile takes 1,609.344 / 4 = 402.336 s, so the average pace and the first split read 6:42.
//
// The plugin the rules are walked on is a stand-in typed here from IAGps.swift's own rules (what finish, status, list,
// read and remove answer), never the screen's code.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { type NativeGps, gpsOver } from '../../frontends/native/src/run-recorder/gps-bridge.ts';
import {
  type RecorderDeps, type RecorderState, drawnLabel, newRecorderState, offersHandLog, recorderBack, recorderDrawn, recorderEvent, recorderGone, recorderOpenRun, recorderOpened,
  recorderOver, recorderPress, recorderResync, recorderTitle,
} from '../../frontends/native/src/run-recorder/recorder-screen.ts';
import type { GpsBridge, GpsEvent, GpsLine } from '../../frontends/native/src/run-recorder/run-recorder-model.ts';
import { REPO } from '../support/app.ts';

process.env['TZ'] = 'America/New_York';
const require = createRequire(import.meta.url);
const NATIVE = join(REPO, 'frontends', 'native');
const TODAY = join(REPO, 'frontends', 'app');
const read = (...p: string[]): string => readFileSync(join(NATIVE, ...p), 'utf8');
const today = (...p: string[]): string => readFileSync(join(TODAY, ...p), 'utf8');
/** A Swift file's code: each line trimmed, the blank ones and the comments out. */
const code = (text: string): string[] => text.split('\n').map((l) => l.trim()).filter((l) => l !== '' && !l.startsWith('//'));

const DEG_LAT_M = 111195.0797;
/** 2026-10-26 11:30 UTC, which is 7:30 in the morning in New York. */
const T0 = Date.UTC(2026, 9, 26, 11, 30, 0);
const RUN = 'run-' + T0;
const OLD = 'run-' + (T0 - 86400000);
function meridian(seconds: number, t0 = T0): GpsLine[] {
  const lines: GpsLine[] = [{ t: t0, mark: 'start' }];
  for (let s = 0; s <= seconds; s++) lines.push({ t: t0 + s * 1000, lat: (4 * s) / DEG_LAT_M, lon: 0, ha: 5 });
  return lines;
}
const file = (lines: GpsLine[]): string => lines.map((l) => JSON.stringify(l)).join('\n') + '\n';

/** The plugin, by IAGps.swift's rules: what each call answers, and every call made, in order. */
function plugin(files: Record<string, string> = {}, live: string | null = null) {
  const calls: string[] = [];
  const st = { recording: live !== null, paused: false, id: live };
  let on: ((e: GpsEvent) => void) | null = null;
  const gps: GpsBridge = {
    listen(f) { calls.push('listen'); on = f; },
    warm() { calls.push('warm'); },
    cool() { calls.push('cool'); },
    start() { calls.push('start'); },
    pause() { calls.push('pause'); },
    resume() { calls.push('resume'); },
    finish(done, fail) {
      calls.push('finish');
      if (!st.id) { if (fail) fail('no run is recording'); return; }
      const id = st.id;
      // The finish mark is written into the run's file before the answer (IAGps.swift finish: writeMark, then the id).
      const last = (files[id] || '').trim().split('\n').map((l) => (JSON.parse(l) as { t: number }).t).pop() || 0;
      files[id] = (files[id] || '') + JSON.stringify({ t: last, mark: 'finish' }) + '\n';
      st.id = null; st.recording = false; st.paused = false;
      done(id);
    },
    status(done) { calls.push('status'); done({ ...st }); },
    list(done) { calls.push('list'); done(Object.keys(files).sort().reverse().map((id) => ({ id, bytes: files[id]!.length }))); },
    read(id, done, fail) { calls.push('read ' + id); if (id in files) done(files[id]!); else if (fail) fail('no such run'); },
    remove(id, done, fail) {
      calls.push('remove ' + id);
      if (!(id in files) || id === st.id) { if (fail) fail('that run cannot be deleted'); return; }
      delete files[id];
      done();
    },
  };
  return { gps, calls, st, files, send: (e: GpsEvent): void => { assert.ok(on, 'the screen listens before an event comes'); on(e); } };
}

/** A screen over a plugin: its state, what it was asked, what it shared, how often it drew and closed. */
function screen(p: ReturnType<typeof plugin> | null, opts: { share?: 'ok' | 'fail' | 'none'; agree?: boolean } = {}) {
  const st: RecorderState = newRecorderState();
  const seen = { draws: 0, closed: 0, asked: [] as string[], shared: [] as [string, string][] };
  const d: RecorderDeps = {
    gps: p ? p.gps : null,
    share: opts.share === 'none' ? null : (name, text, done, fail) => { seen.shared.push([name, text]); if (opts.share === 'fail') fail(); else done(); },
    ask: (text, yes) => { seen.asked.push(text); if (opts.agree !== false) yes(); },
    draw: () => { seen.draws++; },
    closed: () => { seen.closed++; },
  };
  return { st, d, seen };
}

describe('native run recorder: the model is today\'s file', () => {
  test('run-recorder-model.ts in frontends/native is frontends/app\'s but for the one line that names core', () => {
    const mine = read('src', 'run-recorder', 'run-recorder-model.ts');
    const theirs = today('src', 'app', 'screens', 'run-recorder', 'run-recorder-model.ts');
    assert.ok(theirs.length > 5000);
    const from = "} from '../../../../../../core/src/gps/index.ts';";
    assert.equal(theirs.split(from).length, 2, 'today\'s names core once');
    assert.equal(mine, theirs.replace(from, "} from '@ia/core';"), 'the copy differs from today\'s: copy it again (cp) and change that one line, never edit the copy');
  });
});

describe('native run recorder: the Swift is today\'s, its Cordova plumbing replaced', () => {
  const theirs = code(today('plugins-src', 'ia-gps', 'src', 'ios', 'IAGps.swift'));
  const mine = code(read('modules', 'ia-gps', 'ios', 'IAGps.swift'));
  /** Cordova's own: its types, its command and its callback, and the braces and bare returns a count cannot tell apart. */
  const plumbing = /CDV|Cordova|command|@objc|listener|setKeepCallbackAs|^#(if|endif)|^return$|^\}$/;

  test('every line of today\'s recorder that is not Cordova\'s stands in the module, in today\'s order', () => {
    const kept = theirs.filter((l) => !plumbing.test(l));
    // 299 lines of code in today's file; 118 name Cordova's plumbing or are a brace or a bare return.
    assert.equal(theirs.length, 299);
    assert.equal(kept.length, 181);
    let at = -1;
    for (const line of kept) {
      const next = mine.indexOf(line, at + 1);
      assert.ok(next > at, 'the module lacks, or holds out of order: ' + line);
      at = next;
    }
  });

  test('what the module adds is the plumbing that replaces Cordova\'s, line for line', () => {
    const had = new Map<string, number>();
    for (const l of theirs) had.set(l, (had.get(l) || 0) + 1);
    const added = mine.filter((l) => {
      if (l === '}' || l === 'return') return false;
      const n = had.get(l) || 0;
      if (n > 0) { had.set(l, n - 1); return false; }
      return true;
    });
    assert.deepStrictEqual(added, [
      'final class IAGps: NSObject, CLLocationManagerDelegate {',
      'private let emit: ([String: Any]) -> Void',
      'init(emit: @escaping ([String: Any]) -> Void) {',
      'self.emit = emit',
      'super.init()',
      'func listen() {',
      'func warm() {',
      'func cool() {',
      'func start() {',
      'func pause() {',
      'func resume() {',
      'func finish() -> [String: Any] {',
      'return fail("no run is recording")',
      'return ["ok": true, "id": id]',
      'func status() -> [String: Any] {',
      'return state',
      'func list() -> [[String: Any]] {',
      'return runs',
      'func read(_ id: String) -> [String: Any] {',
      'guard let url = runFile(id), let text = try? String(contentsOf: url, encoding: .utf8) else {',
      'return fail("no such run")',
      'return ["ok": true, "text": text]',
      'func remove(_ id: String) -> [String: Any] {',
      'guard let url = runFile(id), url.deletingPathExtension().lastPathComponent != runId else {',
      'return fail("that run cannot be deleted")',
      'return ["ok": true]',
      'return fail(error.localizedDescription)',
      'private func runFile(_ id: String) -> URL? {',
      'guard id.hasPrefix("run-"),',
      'emit(event)',
      'private func fail(_ message: String) -> [String: Any] {',
      '["ok": false, "why": message]',
    ]);
  });

  test('the module names today\'s eleven calls, each on the main queue, and the one event', () => {
    const mod = read('modules', 'ia-gps', 'ios', 'IAGpsModule.swift');
    assert.match(mod, /public class IAGpsModule: Module \{/);
    assert.match(mod, /Name\("IAGps"\)/);
    assert.match(mod, /Events\("onGps"\)/);
    assert.match(mod, /self\?\.sendEvent\("onGps", event\)/);
    const named = [...mod.matchAll(/AsyncFunction\("(\w+)"\) \{ \(([^)]*)\) -> (.+?) in\n\s+self\.gps\.(\w+)\((\w*)\)\n\s+\}\.runOnQueue\(\.main\)/g)]
      .map((m) => [m[1], m[4], m[2] === 'id: String' && m[5] === 'id' ? 'id' : m[2] === '' && m[5] === '' ? '' : '?', m[3]]);
    assert.deepStrictEqual(named, [
      ['listen', 'listen', '', 'Void'], ['warm', 'warm', '', 'Void'], ['cool', 'cool', '', 'Void'], ['start', 'start', '', 'Void'], ['pause', 'pause', '', 'Void'],
      ['resume', 'resume', '', 'Void'], ['finish', 'finish', '', '[String: Any]'], ['status', 'status', '', '[String: Any]'], ['list', 'list', '', '[[String: Any]]'],
      ['read', 'read', 'id', '[String: Any]'], ['remove', 'remove', 'id', '[String: Any]'],
    ]);
    assert.equal(mod.match(/AsyncFunction\(/g)?.length, 11);
    assert.equal(mod.match(/\.runOnQueue\(\.main\)/g)?.length, 11);
    assert.equal(mod.replace(/AsyncFunction\(/g, '').includes('Function('), false, 'no call runs off the main queue');
    // The eleven of today's plugin (www/gps.js), by name.
    const theirsJs = today('plugins-src', 'ia-gps', 'www', 'gps.js');
    assert.deepStrictEqual([...theirsJs.matchAll(/^    (\w+): function/gm)].map((m) => m[1]), named.map((n) => n[0]));
  });

  test('Expo finds the module, and it links Core Location and Core Motion', () => {
    assert.deepStrictEqual(JSON.parse(read('modules', 'ia-gps', 'expo-module.config.json')), { platforms: ['apple'], apple: { modules: ['IAGpsModule'] } });
    const pod = read('modules', 'ia-gps', 'ios', 'IAGps.podspec');
    assert.match(pod, /s\.name\s+= 'IAGps'/);
    assert.match(pod, /s\.dependency 'ExpoModulesCore'/);
    assert.match(pod, /s\.frameworks = 'CoreLocation', 'CoreMotion'/);
    assert.match(pod, /s\.platforms\s+= \{ :ios => '16\.4' \}/);
  });

  test('the app asks iOS in today\'s words, with the location background mode and nothing that signing holds', () => {
    const config = (require(join(NATIVE, 'app.config.js')) as () => { ios: { infoPlist: Record<string, unknown>; entitlements?: unknown } })();
    assert.deepStrictEqual(config.ios.infoPlist, {
      NSLocationWhenInUseUsageDescription: 'The Asylum records your route while you run. It stays on this phone.',
      NSMotionUsageDescription: 'The Asylum counts your steps and your climb while you record a run. It stays on this phone.',
      UIBackgroundModes: ['location'],
    });
    assert.equal(config.ios.entitlements, undefined, 'no entitlement: the signing profiles do not change');
    assert.doesNotMatch(read('app.config.js'), /entitlements|associatedDomains|usesAppleSignIn|NSLocationAlways/);
    // Today's plugin still says the same (a guard: this passes on the release before too).
    const xml = today('plugins-src', 'ia-gps', 'plugin.xml');
    assert.ok(xml.includes('<string>The Asylum records your route while you run. It stays on this phone.</string>'));
    assert.ok(xml.includes('<string>The Asylum counts your steps and your climb while you record a run. It stays on this phone.</string>'));
    assert.ok(xml.includes('parent="UIBackgroundModes">\n      <array>\n        <string>location</string>\n      </array>'));
  });
});

describe('native run recorder: today\'s calls over the Swift module', () => {
  /** The Swift module, answering what it is told to. */
  function native(answers: Partial<Record<'finish' | 'read' | 'remove' | 'status' | 'list', unknown>> = {}, broken = false) {
    const calls: string[] = [];
    const subs: { on: (e: GpsEvent) => void; removed: boolean }[] = [];
    const run = <T,>(name: string, value: T): Promise<T> => { calls.push(name); return broken ? Promise.reject(new Error('gone')) : Promise.resolve(value); };
    const n: NativeGps = {
      addListener(name, on) { calls.push('addListener ' + name); const sub = { on, removed: false }; subs.push(sub); return { remove: () => { sub.removed = true; calls.push('removeListener'); } }; },
      listen: () => run('listen', undefined), warm: () => run('warm', undefined), cool: () => run('cool', undefined),
      start: () => run('start', undefined), pause: () => run('pause', undefined), resume: () => run('resume', undefined),
      finish: () => run('finish', (answers.finish ?? { ok: true, id: RUN }) as never),
      status: () => run('status', (answers.status ?? { recording: false, paused: false, id: null }) as never),
      list: () => run('list', (answers.list ?? []) as never),
      read: (id) => run('read ' + id, (answers.read ?? { ok: true, text: 'x\n' }) as never),
      remove: (id) => run('remove ' + id, (answers.remove ?? { ok: true }) as never),
    };
    return { n, calls, subs };
  }
  const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  test('listen opens the one channel and then asks for the permission as it stands; a second listen takes the first\'s place; quiet closes it', () => {
    const { n, calls, subs } = native();
    const gps = gpsOver(n);
    const got: string[] = [];
    gps.listen((e) => got.push('first ' + e.type));
    assert.deepStrictEqual(calls, ['addListener onGps', 'listen']);
    subs[0]!.on({ type: 'auth', status: 'granted' });
    gps.listen((e) => got.push('second ' + e.type));
    assert.deepStrictEqual(calls, ['addListener onGps', 'listen', 'removeListener', 'addListener onGps', 'listen']);
    assert.deepStrictEqual(subs.map((s) => s.removed), [true, false]);
    subs[1]!.on({ type: 'error', message: 'x' });
    assert.deepStrictEqual(got, ['first auth', 'second error']);
    gps.quiet();
    assert.deepStrictEqual(subs.map((s) => s.removed), [true, true]);
    gps.quiet();
    assert.equal(calls.filter((c) => c === 'removeListener').length, 2, 'a channel is closed once');
  });

  test('the six calls with nothing to hand back each make their own call, and a refusal is silent', async () => {
    const { n, calls } = native({}, true);
    const gps = gpsOver(n);
    gps.warm(); gps.cool(); gps.start(); gps.pause(); gps.resume();
    gps.listen(() => undefined);
    await settle();
    assert.deepStrictEqual(calls, ['warm', 'cool', 'start', 'pause', 'resume', 'addListener onGps', 'listen']);
  });

  test('finish, read and remove hand back the answer, or why not in the module\'s own words', async () => {
    const got: string[] = [];
    const asked = native();
    const ok = gpsOver(asked.n);
    ok.finish((id) => got.push('finished ' + id), (why) => got.push('no: ' + why));
    ok.read(RUN, (text) => got.push('read ' + JSON.stringify(text)), (why) => got.push('no: ' + why));
    ok.remove(OLD, () => got.push('removed'), (why) => got.push('no: ' + why));
    await settle();
    assert.deepStrictEqual(got, ['finished ' + RUN, 'read "x\\n"', 'removed']);
    // The module is asked for the run the screen named, each time.
    assert.deepStrictEqual(asked.calls, ['finish', 'read ' + RUN, 'remove ' + OLD]);
    got.length = 0;
    const no = gpsOver(native({ finish: { ok: false, id: RUN, why: 'no run is recording' }, read: { ok: false, text: 'x', why: 'no such run' }, remove: { ok: false, why: 'that run cannot be deleted' } }).n);
    no.finish((id) => got.push('finished ' + id), (why) => got.push('no: ' + why));
    no.read(RUN, (text) => got.push('read ' + text), (why) => got.push('no: ' + why));
    no.remove(RUN, () => got.push('removed'), (why) => got.push('no: ' + why));
    // With no one to tell, a refusal is dropped.
    no.finish(() => got.push('finished'));
    no.read(RUN, () => got.push('read'));
    no.remove(RUN, () => got.push('removed'));
    await settle();
    assert.deepStrictEqual(got, ['no: no run is recording', 'no: no such run', 'no: that run cannot be deleted']);
  });

  test('an answer that is not whole is a refusal, and a call the module throws on says so', async () => {
    const got: string[] = [];
    const odd = gpsOver(native({ finish: { ok: true }, read: { ok: true } }).n);
    odd.finish((id) => got.push('finished ' + id), (why) => got.push('no: [' + why + ']'));
    odd.read(RUN, (text) => got.push('read ' + text), (why) => got.push('no: [' + why + ']'));
    await settle();
    assert.deepStrictEqual(got, ['no: []', 'no: []']);
    got.length = 0;
    const gone = gpsOver(native({}, true).n);
    gone.finish(() => got.push('finished'), (why) => got.push('finish: ' + why));
    gone.read(RUN, () => got.push('read'), (why) => got.push('read: ' + why));
    gone.remove(RUN, () => got.push('removed'), (why) => got.push('remove: ' + why));
    gone.status(() => got.push('status'));
    gone.list(() => got.push('list'));
    gone.finish(() => got.push('finished'));
    await settle();
    assert.deepStrictEqual(got, ['finish: Error: gone', 'read: Error: gone', 'remove: Error: gone']);
  });

  test('status and list hand back today\'s shapes: an id or null, and the runs as the module lists them', async () => {
    const got: unknown[] = [];
    const idle = gpsOver(native({ status: { recording: 0, paused: 0 } }).n);
    idle.status((s) => got.push(s));
    const live = gpsOver(native({ status: { recording: true, paused: true, id: RUN }, list: [{ id: RUN, bytes: 9 }, { id: OLD, bytes: 4 }] }).n);
    live.status((s) => got.push(s));
    live.list((runs) => got.push(runs));
    await settle();
    assert.deepStrictEqual(got, [{ recording: false, paused: false, id: null }, { recording: true, paused: true, id: RUN }, [{ id: RUN, bytes: 9 }, { id: OLD, bytes: 4 }]]);
  });

  test('the app asks for the module once, by its name, and a build without it has no recorder', () => {
    const gps = read('src', 'run-recorder', 'gps.ts');
    assert.match(gps, /const native = requireOptionalNativeModule<NativeGps>\('IAGps'\);\n    return native \? gpsOver\(native\) : null;\n  \} catch \{\n    return null;/);
    assert.match(gps, /export const GPS: AppGps \| null = find\(\);/);
  });
});

describe('native run recorder: the screen\'s rules, as today\'s', () => {
  test('as it opens: the channel, location on, then what the module holds; with no run it is empty and lists the past runs', () => {
    const p = plugin({ [RUN]: file([...meridian(600), { t: T0 + 600000, mark: 'finish' }]), [OLD]: file(meridian(10, T0 - 86400000)) });
    const { st, d, seen } = screen(p);
    recorderOpened(st, d);
    assert.deepStrictEqual(p.calls, ['listen', 'warm', 'status', 'list', 'read ' + RUN, 'read ' + OLD]);
    assert.deepStrictEqual([st.live, st.runId, st.lines], [false, null, []]);
    assert.deepStrictEqual(st.past.map((r) => [r.id, r.line]), [[RUN, '1.49 mi · 10:00'], [OLD, '0.02 mi · 0:10']]);
    assert.match(st.past[0]!.label, /^Oct 26.{1,5}7:30 AM$/);
    assert.match(st.past[1]!.label, /^Oct 25.{1,5}7:30 AM$/);
    assert.ok(seen.draws > 0);
    const v = recorderDrawn(st, T0);
    assert.deepStrictEqual([v.state, v.buttons, v.gps, v.time, v.distance, v.splits], ['empty', ['start'], 'Waiting for GPS.', '0:00', '0.00', []]);
  });

  test('as it opens on a run still recording: the run read back from its file, and left off the past runs', () => {
    const p = plugin({ [RUN]: file(meridian(600)), [OLD]: file(meridian(10, T0 - 86400000)) }, RUN);
    const { st, d } = screen(p);
    recorderOpened(st, d);
    assert.deepStrictEqual(p.calls, ['listen', 'warm', 'status', 'read ' + RUN, 'list', 'read ' + OLD]);
    assert.deepStrictEqual([st.live, st.runId, st.lines.length], [true, RUN, 602]);
    assert.deepStrictEqual(st.past.map((r) => r.id), [OLD]);
    const v = recorderDrawn(st, T0 + 600000);
    assert.deepStrictEqual([v.state, v.buttons, v.time, v.distance, v.avgPace, v.splits], ['recording', ['pause', 'finish'], '10:00', '1.49', '6:42', [{ mile: 1, time: '6:42', climb: '' }]]);
  });

  test('a status is a live run only when it says it is recording and names the run', () => {
    for (const odd of [{ recording: false, paused: false, id: RUN }, { recording: true, paused: false, id: null }]) {
      const p = plugin({ [RUN]: file(meridian(5)) });
      Object.assign(p.st, odd);
      const { st, d } = screen(p);
      recorderResync(st, d);
      assert.deepStrictEqual([st.live, st.runId, st.lines], [false, null, []], JSON.stringify(odd));
      // The past runs are listed all the same, without the run the status names.
      assert.deepStrictEqual(st.past.map((r) => r.id), odd.id === RUN ? [] : [RUN], JSON.stringify(odd));
    }
  });

  test('the live clock runs on the wall clock, past the run\'s last line', () => {
    const p = plugin({ [RUN]: file(meridian(600)) }, RUN);
    const { st, d } = screen(p);
    recorderOpened(st, d);
    assert.equal(recorderDrawn(st, T0 + 660000).time, '11:00');
    st.live = false;
    assert.equal(recorderDrawn(st, T0 + 660000).time, '10:00');
  });

  test('every answer the module gives is drawn, once for each thing it changes', () => {
    const runs = (): Record<string, string> => ({ [RUN]: file(meridian(5)), [OLD]: file(meridian(10, T0 - 86400000)) });
    const count = (s: ReturnType<typeof screen>, act: () => void): [number, number] => { const a = s.seen.draws, c = s.seen.closed; act(); return [s.seen.draws - a, s.seen.closed - c]; };
    // Opening on a live run: its lines, the past runs, the status itself.
    const p = plugin(runs(), RUN);
    const s = screen(p);
    assert.deepStrictEqual(count(s, () => recorderOpened(s.st, s.d)), [3, 0]);
    // The start mark: the mark, then the id its status hands back. Every other event: one.
    assert.deepStrictEqual(count(s, () => p.send({ type: 'mark', line: { t: T0, mark: 'start' } })), [2, 0]);
    assert.deepStrictEqual(count(s, () => p.send({ type: 'auth', status: 'granted' })), [1, 0]);
    assert.deepStrictEqual(count(s, () => p.send({ type: 'motion', line: { t: T0, steps: 1 } })), [1, 0]);
    assert.deepStrictEqual(count(s, () => recorderPress(s.st, s.d, 'pause')), [1, 0]);
    // Finish: the run read back, the past runs, the answer, the tap.
    assert.deepStrictEqual(count(s, () => recorderPress(s.st, s.d, 'finish')), [4, 0]);
    // Finish again, with no run recording: the reason, the tap.
    assert.deepStrictEqual(count(s, () => recorderPress(s.st, s.d, 'finish')), [2, 0]);
    assert.deepStrictEqual(count(s, () => recorderPress(s.st, s.d, 'share')), [2, 0]);
    assert.deepStrictEqual(count(s, () => recorderOpenRun(s.st, s.d, OLD)), [1, 0]);
    // Back from a finished run draws the start; Back from the start closes and draws nothing.
    assert.deepStrictEqual(count(s, () => recorderBack(s.st, s.d)), [1, 0]);
    assert.deepStrictEqual(count(s, () => recorderBack(s.st, s.d)), [0, 1]);
    // Delete with a yes: the past runs, the delete, the tap. With a no: the tap alone. Refused: the reason, the tap.
    recorderOpenRun(s.st, s.d, OLD);
    assert.deepStrictEqual(count(s, () => recorderPress(s.st, s.d, 'delete')), [3, 0]);
    const no = screen(plugin(runs()), { agree: false });
    recorderOpenRun(no.st, no.d, OLD);
    assert.deepStrictEqual(count(no, () => recorderPress(no.st, no.d, 'delete')), [1, 0]);
    const gone = plugin(runs());
    const g = screen(gone, { share: 'fail' });
    recorderOpenRun(g.st, g.d, OLD);
    delete gone.files[OLD];
    assert.deepStrictEqual(count(g, () => recorderPress(g.st, g.d, 'delete')), [2, 0]);
    g.st.runId = RUN;
    assert.deepStrictEqual(count(g, () => recorderPress(g.st, g.d, 'share')), [2, 0]);
    // The last past run deleted: the empty list is drawn too.
    const one = plugin({ [OLD]: file(meridian(10, T0 - 86400000)) });
    const o = screen(one);
    recorderOpenRun(o.st, o.d, OLD);
    assert.deepStrictEqual(count(o, () => recorderPress(o.st, o.d, 'delete')), [3, 0]);
    assert.deepStrictEqual(o.st.past, []);
  });

  test('with no past run the list is empty, and it is drawn', () => {
    const p = plugin();
    const { st, d, seen } = screen(p);
    st.past = [{ id: OLD, label: 'x', line: 'y' }];
    recorderOpened(st, d);
    assert.deepStrictEqual(st.past, []);
    assert.ok(seen.draws >= 2);
  });

  test('the app back at the front reads the same again, and nothing else', () => {
    const p = plugin({ [RUN]: file(meridian(5)) }, RUN);
    const { st, d } = screen(p);
    recorderResync(st, d);
    assert.deepStrictEqual(p.calls, ['status', 'read ' + RUN, 'list']);
    assert.deepStrictEqual([st.live, st.runId, st.lines.length, st.past], [true, RUN, 7, []]);
  });

  test('events: the permission, a fix before Start, the start mark, then fixes, readings and marks only while the run is live', () => {
    const p = plugin();
    const { st, d, seen } = screen(p);
    recorderOpened(st, d);
    p.send({ type: 'auth', status: 'denied' });
    assert.equal(recorderDrawn(st, T0).gps, 'Location is off for The Asylum. Turn it on in Settings.');
    p.send({ type: 'auth', status: 'granted' });
    const fix = (s: number): GpsLine => ({ t: T0 + s * 1000, lat: (4 * s) / DEG_LAT_M, lon: 0, ha: 7.6 });
    // Before Start a fix is the GPS line's and no more, recorded or not.
    p.send({ type: 'fix', fix: fix(0) as never, recorded: false });
    p.send({ type: 'fix', fix: fix(0) as never, recorded: true });
    p.send({ type: 'motion', line: { t: T0, steps: 4 } });
    p.send({ type: 'mark', line: { t: T0, mark: 'pause' } });
    assert.deepStrictEqual([st.lines, st.live, recorderDrawn(st, T0).gps], [[], false, 'GPS ±8 m']);
    // The start mark: live, the lines begun afresh, and the run's id asked for.
    st.lines = [fix(9)];
    p.st.id = RUN; p.st.recording = true;
    const before = p.calls.length;
    p.send({ type: 'mark', line: { t: T0, mark: 'start' } });
    assert.deepStrictEqual([st.live, st.runId, st.lines], [true, RUN, [{ t: T0, mark: 'start' }]]);
    assert.deepStrictEqual(p.calls.slice(before), ['status']);
    p.send({ type: 'fix', fix: fix(1) as never, recorded: true });
    p.send({ type: 'fix', fix: fix(2) as never, recorded: false });
    p.send({ type: 'motion', line: { t: T0 + 2000, steps: 6 } });
    p.send({ type: 'mark', line: { t: T0 + 3000, mark: 'pause' } });
    assert.deepStrictEqual(st.lines, [{ t: T0, mark: 'start' }, fix(1), { t: T0 + 2000, steps: 6 }, { t: T0 + 3000, mark: 'pause' }]);
    assert.deepStrictEqual(st.lastFix, fix(2), 'the GPS line follows every fix');
    assert.deepStrictEqual(recorderDrawn(st, T0 + 9000).buttons, ['resume', 'finish']);
    const draws = seen.draws;
    p.send({ type: 'error', message: 'the run could not be saved on this phone' });
    assert.equal(st.message, 'the run could not be saved on this phone');
    assert.equal(seen.draws, draws + 1, 'every event is drawn');
  });

  test('Start clears what the screen held and starts; Pause and Resume make their marks\' calls; each clears the message', () => {
    const p = plugin({ [OLD]: file(meridian(10, T0 - 86400000)) });
    const { st, d } = screen(p);
    recorderOpened(st, d);
    recorderOpenRun(st, d, OLD);
    st.message = 'old';
    const before = p.calls.length;
    recorderPress(st, d, 'start');
    assert.deepStrictEqual([st.runId, st.lines, st.message], [null, [], '']);
    st.message = 'old';
    recorderPress(st, d, 'pause');
    assert.equal(st.message, '');
    recorderPress(st, d, 'resume');
    assert.deepStrictEqual(p.calls.slice(before), ['start', 'pause', 'resume']);
  });

  test('Finish: the run is over, read back from its file, and the past runs listed again with it', () => {
    const files = { [RUN]: file(meridian(600)), [OLD]: file(meridian(10, T0 - 86400000)) };
    const p = plugin(files, RUN);
    const { st, d } = screen(p);
    recorderOpened(st, d);
    assert.deepStrictEqual([st.live, st.lines.length, st.past.map((r) => r.id)], [true, 602, [OLD]]);
    // A start mark whose status has not answered yet: the screen holds no id until Finish hands it one.
    st.runId = null;
    const before = p.calls.length;
    recorderPress(st, d, 'finish');
    assert.deepStrictEqual(p.calls.slice(before), ['finish', 'read ' + RUN, 'list', 'read ' + RUN, 'read ' + OLD]);
    assert.deepStrictEqual([st.live, st.runId, st.lines.length], [false, RUN, 603]);
    assert.deepStrictEqual(st.past.map((r) => r.id), [RUN, OLD]);
    const v = recorderDrawn(st, T0 + 999000);
    assert.deepStrictEqual([v.state, v.buttons, v.time], ['finished', ['share', 'delete'], '10:00']);
    assert.match(recorderOver(st, null), /^Oct 26.{1,5}7:30 AM$/);
  });

  test('Finish with no run recording says why, in the module\'s words', () => {
    const p = plugin();
    const { st, d } = screen(p);
    recorderPress(st, d, 'finish');
    assert.deepStrictEqual([st.message, st.live, st.runId], ['no run is recording', false, null]);
  });

  test('Share hands the share sheet the run\'s GPX under its local start; a failure, or no sheet, says so', () => {
    const p = plugin({ [RUN]: file([...meridian(3), { t: T0 + 3000, mark: 'finish' }]) });
    const ok = screen(p);
    recorderOpenRun(ok.st, ok.d, RUN);
    ok.st.message = 'old';
    recorderPress(ok.st, ok.d, 'share');
    assert.equal(ok.seen.shared.length, 1);
    const [name, text] = ok.seen.shared[0]!;
    assert.equal(name, 'asylum-run-2026-10-26-0730.gpx');
    assert.ok(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="The Asylum"'));
    assert.equal(text.match(/<trkpt /g)?.length, 4, 'one point a fix');
    assert.ok(text.includes('<time>2026-10-26T11:30:03.000Z</time>'));
    assert.equal(ok.st.message, '');
    for (const how of ['fail', 'none'] as const) {
      const no = screen(p, { share: how });
      recorderOpenRun(no.st, no.d, RUN);
      recorderPress(no.st, no.d, 'share');
      assert.equal(no.st.message, 'That run could not be shared.');
    }
    // With no run in hand there is nothing to share or delete.
    const none = screen(p);
    recorderPress(none.st, none.d, 'share');
    recorderPress(none.st, none.d, 'delete');
    assert.deepStrictEqual([none.seen.shared, none.seen.asked], [[], []]);
  });

  test('Delete asks first, in today\'s words; a no leaves the run, a yes deletes it and goes back to the start', () => {
    const p = plugin({ [RUN]: file(meridian(3)), [OLD]: file(meridian(10, T0 - 86400000)) });
    const no = screen(p, { agree: false });
    recorderOpened(no.st, no.d);
    recorderOpenRun(no.st, no.d, RUN);
    recorderPress(no.st, no.d, 'delete');
    assert.deepStrictEqual(no.seen.asked, ['Delete this run? It cannot come back.']);
    assert.ok(RUN in p.files);
    assert.equal(no.st.runId, RUN);
    const yes = screen(p);
    recorderOpened(yes.st, yes.d);
    recorderOpenRun(yes.st, yes.d, RUN);
    yes.st.message = 'old';
    const before = p.calls.length;
    recorderPress(yes.st, yes.d, 'delete');
    assert.deepStrictEqual(p.calls.slice(before), ['remove ' + RUN, 'list', 'read ' + OLD]);
    assert.deepStrictEqual(Object.keys(p.files), [OLD]);
    assert.deepStrictEqual([yes.st.runId, yes.st.lines, yes.st.message, yes.st.past.map((r) => r.id)], [null, [], '', [OLD]]);
  });

  test('a run that cannot be deleted says why and stays on the screen', () => {
    const p = plugin({ [RUN]: file(meridian(3)) });
    const { st, d } = screen(p);
    recorderOpenRun(st, d, RUN);
    delete p.files[RUN];
    recorderPress(st, d, 'delete');
    assert.deepStrictEqual([st.message, st.runId], ['that run cannot be deleted', RUN]);
  });

  test('a past run opens on the screen, its message cleared, but never while a run is recording', () => {
    const p = plugin({ [RUN]: file(meridian(600)), [OLD]: file(meridian(10, T0 - 86400000)) });
    const { st, d } = screen(p);
    recorderOpened(st, d);
    st.message = 'old';
    recorderOpenRun(st, d, OLD);
    assert.deepStrictEqual([st.runId, st.lines.length, st.message], [OLD, 12, '']);
    // A run with no finish mark that is not the live one reads as finished at its last line.
    const v = recorderDrawn(st, T0 + 999000);
    assert.deepStrictEqual([v.state, v.buttons, v.time], ['finished', ['share', 'delete'], '0:10']);
    st.live = true;
    const before = p.calls.length;
    recorderOpenRun(st, d, RUN);
    assert.deepStrictEqual([st.runId, p.calls.length], [OLD, before]);
  });

  test('Back from a finished run goes to the start; Back from the start, or from a live run, closes the screen', () => {
    const p = plugin({ [OLD]: file(meridian(10, T0 - 86400000)) });
    const { st, d, seen } = screen(p);
    recorderOpenRun(st, d, OLD);
    st.message = 'old';
    recorderBack(st, d);
    assert.deepStrictEqual([st.runId, st.lines, st.message, seen.closed], [null, [], '', 0]);
    recorderBack(st, d);
    assert.equal(seen.closed, 1);
    st.live = true; st.runId = RUN;
    recorderBack(st, d);
    assert.deepStrictEqual([seen.closed, st.runId], [2, RUN]);
  });

  test('as it goes: location off, which the module keeps on for a run still recording', () => {
    const p = plugin();
    const { d } = screen(p);
    recorderGone(d);
    assert.deepStrictEqual(p.calls, ['cool']);
  });

  test('the words over the screen: the test bench\'s, a run card\'s, and a finished run\'s start', () => {
    const st = newRecorderState();
    const card = { over: 'Tomorrow · Friday', title: 'Recovery Run' };
    assert.deepStrictEqual([recorderOver(st, null), recorderTitle(null)], ['Test GPS against your watch. Runs stay on this phone.', 'Run recorder']);
    assert.deepStrictEqual([recorderOver(st, card), recorderTitle(card)], ['Tomorrow · Friday', 'Recovery Run']);
    assert.equal(recorderTitle({ over: 'x', title: '' }), 'Run recorder');
    st.runId = RUN; st.live = true;
    assert.equal(recorderOver(st, card), 'Tomorrow · Friday', 'a live run keeps the day\'s line');
    st.live = false;
    assert.match(recorderOver(st, card), /^Oct 26.{1,5}7:30 AM$/);
  });

  test('a run\'s start is drawn with a plain space where iOS writes a narrow one that React Native does not draw', () => {
    const narrow = String.fromCharCode(0x202f);
    assert.equal(drawnLabel('Nov 28 at 12:35' + narrow + 'PM'), 'Nov 28 at 12:35 PM');
    assert.equal(drawnLabel(narrow + 'a' + narrow + narrow), ' a  ');
    assert.equal(drawnLabel('Nov 28 at 12:35 PM'), 'Nov 28 at 12:35 PM');
    // Both places a start is drawn go through it: the line over a finished run, and each row of Past runs.
    const rules = read('src', 'run-recorder', 'recorder-screen.ts');
    assert.ok(rules.includes('return st.runId && !st.live ? drawnLabel(runLabel(st.runId)) : heading ? heading.over : RECORDER_COPY.rowNote;'));
    assert.ok(rules.includes("st.past = ids.map((i) => ({ id: i, label: drawnLabel(runLabel(i)), line: rows.get(i) ?? '' }));"));
    // The GPX keeps the label as iOS wrote it: the model's own, untouched.
    assert.ok(rules.includes('if (d.share) d.share(gpxFileName(id), runGpx(id, st.lines),'));
  });

  test('Ran without the phone? is offered from a run card only, before Start', () => {
    const st = newRecorderState();
    const card = { over: 'Today', title: 'Long Run' };
    assert.deepStrictEqual([offersHandLog(st, card), offersHandLog(st, null)], [true, false]);
    st.live = true;
    assert.equal(offersHandLog(st, card), false);
    st.live = false; st.runId = OLD;
    assert.equal(offersHandLog(st, card), false);
  });

  test('a build without the module does nothing and breaks nothing', () => {
    const { st, d, seen } = screen(null);
    recorderOpened(st, d);
    recorderResync(st, d);
    recorderPress(st, d, 'start');
    recorderOpenRun(st, d, RUN);
    recorderGone(d);
    recorderEvent(st, d, { type: 'mark', line: { t: T0, mark: 'start' } });
    assert.deepStrictEqual([st.live, st.runId, seen.asked, seen.shared], [true, null, [], []]);
  });
});

describe('native run recorder: the screen, top to bottom, as today\'s', () => {
  const rec = read('src', 'run-recorder', 'RunRecorder.tsx');
  test('the parts stand in today\'s order', () => {
    const order = ['testID="rec-header"', 'testID="rec-back"', '‹ Back', 'testID="rec-over"', 'testID="rec-title"', 'testID="rec-scroll"', 'testID="rec-workout"', '<Note id="rec-gps"', 'testID="rec-time"',
      'big.map(', 'small.map(', '<Seg id="rec-buttons">', 'testID="rec-nophone"', '<Note id="rec-message"', '<Row id="rec-splits" label={W.splits}', '<Row id="rec-past" label={W.past}'];
    const at = order.map((o) => rec.indexOf(o));
    at.forEach((i, n) => assert.ok(i > 0, 'the screen draws ' + order[n]));
    assert.deepStrictEqual([...at].sort((a, b) => a - b), at, 'in today\'s order');
    // Today's template, part for part (a guard: this passes on the release before too).
    const theirs = today('src', 'app', 'screens', 'run-recorder', 'run-recorder.ts');
    const theirOrder = ['class="back-btn"', 'class="detail-day-name"', 'class="detail-day-title"', 'class="rec-workout"', '{{ view().gps }}', '{{ view().time }}', '>Miles<', '>Avg pace<', '>This mile<', '>Climb<', '>Cadence<', '>Steps<',
      '@for (b of view().buttons; track b)', 'class="rec-nophone"', '@if (message())', '>Splits<', '>Past runs<'];
    const theirAt = theirOrder.map((o) => theirs.indexOf(o));
    theirAt.forEach((i, n) => assert.ok(i > 0, 'today\'s screen draws ' + theirOrder[n]));
    assert.deepStrictEqual([...theirAt].sort((a, b) => a - b), theirAt);
  });

  test('the figures are today\'s six, in two rows of three, and each list carries today\'s label', () => {
    assert.ok(rec.includes("export const W = { miles: 'Miles', avg: 'Avg pace', mile: 'This mile', climb: 'Climb', cadence: 'Cadence', steps: 'Steps', splits: 'Splits', past: 'Past runs' } as const;"));
    assert.ok(rec.includes('const big = [[W.miles, view.distance], [W.avg, view.avgPace], [W.mile, view.milePace]] as const;'));
    assert.ok(rec.includes('const small = [[W.climb, view.climb], [W.cadence, view.cadence], [W.steps, view.steps]] as const;'));
    assert.ok(rec.includes("{'Mile ' + sp.mile}") && rec.includes("{sp.time + (sp.climb ? GAP + sp.climb : '')}"), 'a split: its mile, its time, then its climb');
    assert.ok(rec.includes('const GAP = String.fromCharCode(160, 160);'), 'two spaces that do not break, as today\'s template types them');
    assert.ok(rec.includes("{r.label + ' · ' + r.line}"), 'a past run: its start, then its miles and time');
    assert.ok(rec.includes('{BUTTON_LABEL[b]}') && rec.includes('{view.buttons.map((b) => ('));
  });

  test('each tap goes to its rule, and the parts that come and go follow the rules', () => {
    for (const part of [
      'onPress={() => recorderBack(st, d)}', 'onPress={() => recorderPress(st, d, b)}', 'onPress={() => recorderOpenRun(st, d, r.id)}', 'onPress={onHandLog}',
      '{offersHandLog(st, heading) && (', "{st.message !== '' && <Note id=\"rec-message\"", '{view.splits.length > 0 && (', '{st.past.length > 0 && (', '{workout && <View testID="rec-workout"><Cardio c={workout} p={p} /></View>}',
      '<Text testID="rec-over" style={[s.over, { color: on(0.6) }]}>{recorderOver(st, heading)}</Text>',
      '<Text testID="rec-title" accessibilityRole="header" style={[s.title, { color: p.onBand }]}>{recorderTitle(heading)}</Text>',
      'accessibilityLabel={recorderTitle(heading)}', '{RECORDER_COPY.noPhone}', 'const view = recorderDrawn(st, now);',
    ]) assert.ok(rec.includes(part), part);
  });

  test('it opens the channel as it comes, keeps the second, reads the run back when the app returns, and closes all three as it goes', () => {
    assert.ok(rec.includes("    recorderOpened(st, d);\n    const tick = setInterval(() => setNow(Date.now()), 1000);"));
    assert.ok(rec.includes("const front = AppState.addEventListener('change', (s) => { if (s === 'active') recorderResync(st, d); });"));
    assert.ok(rec.includes('      shown.current = false;\n      clearInterval(tick);\n      front.remove();\n      gps.quiet();\n      recorderGone(d);'));
    assert.ok(rec.includes('draw: () => { if (shown.current) setDraws((n) => n + 1); },'), 'an answer after the screen has gone draws nothing');
  });

  test('Delete\'s question is the system\'s own, under the app\'s name, Cancel then OK', () => {
    assert.ok(rec.includes("export const ASK_TITLE = 'IA Next';"));
    assert.ok(rec.includes("ask: (text, yes) => Alert.alert(ASK_TITLE, text, [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: yes }]),"));
  });

  test('a shared run is written into the app\'s own cache under its name and handed to the share sheet', () => {
    assert.ok(rec.includes('const file = new File(Paths.cache, fileName);\n          file.create({ overwrite: true });\n          await file.write(text);\n          await SystemShare.share({ url: file.uri });\n          done();\n        } catch {\n          fail();'));
  });

  test('the sizes are today\'s: the clock at 56, the first row at 24, the second at 18, the buttons at 15 in 14 of room', () => {
    // Typed from today's template (its inline styles) and its sheets (session-sheet.css, look.css, week-view.css).
    assert.ok(rec.includes("  time: { fontFamily: DISPLAY, fontSize: 56, fontWeight: '700', lineHeight: 56, paddingTop: 5, marginBottom: -5.6, fontVariant: ['tabular-nums'] },"));
    assert.match(rec, /  big: \{ fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', [^}]*fontVariant: \['tabular-nums'\] \},/);
    assert.match(rec, /  small: \{ fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', [^}]*fontVariant: \['tabular-nums'\] \},/);
    assert.match(rec, /  press: \{ flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, padding: 14[^}]*\},/);
    assert.match(rec, /  pressText: \{ fontFamily: DISPLAY, fontSize: 15, fontWeight: '700'[^}]*\},/);
    assert.match(rec, /  body: \{ paddingTop: 16, paddingHorizontal: 16, gap: 14 \},/);
    assert.match(rec, /  figures: \{ flexDirection: 'row', gap: 8 \},/);
    assert.match(rec, /  nophone: \{ alignSelf: 'center', minHeight: 44, /);
    assert.match(rec, /  nophoneText: \{ [^}]*fontSize: 14, [^}]*textDecorationLine: 'underline'[^}]*\},/);
    assert.match(rec, /  splitText: \{ [^}]*fontSize: 14, [^}]*\},/);
  });

  test('each line stands where WebKit lays today\'s, as measured beside it (tests/measure/native-run-recorder_look.md)', () => {
    // Typed from the measure: Back's pill 37 tall, the title 1.7 under its line and 14.7 over the band's edge, the
    // clock 5 lower in its line, 2 under the first row's figures, the buttons 50 tall, a split's line 18, a past run 41.
    for (const part of [
      "  header: { paddingHorizontal: 20, paddingBottom: 14.7, borderBottomWidth: 1, alignItems: 'flex-start' },",
      "  back: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },",
      "  backText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', lineHeight: 19 },",
      "  over: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },",
      "  title: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '700', marginTop: 1.7 },",
      "  figure: { flex: 1, gap: 8 },",
      "  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },",
      "  big: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', paddingBottom: 2, fontVariant: ['tabular-nums'] },",
      "  small: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', paddingBottom: 0.7, fontVariant: ['tabular-nums'] },",
      "  pressText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', lineHeight: 20 },",
      "  nophone: { alignSelf: 'center', minHeight: 44, paddingVertical: 10, paddingHorizontal: 4, justifyContent: 'center' },",
      "  nophoneText: { fontFamily: TEXT, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },",
      "  split: { flexDirection: 'row', justifyContent: 'space-between' },",
      "  splitText: { fontFamily: TEXT, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },",
      "  run: { borderWidth: 1, borderRadius: 999, paddingVertical: 11 },",
      "  runText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', textAlign: 'left', paddingBottom: 1.5 },",
    ]) assert.ok(rec.includes(part), part);
    // The colours are today's tokens: the band and its type, the pill's ground (white by day, as today's), the muted words.
    for (const part of [
      "style={[s.header, { backgroundColor: p.bandHeader, borderBottomColor: p.border, paddingTop: insets.top }]}",
      "style={[s.back, { backgroundColor: p.surface, borderColor: p.border2 }]}", "<Text style={[s.backText, { color: p.onBand }]}>‹ Back</Text>",
      "style={[s.over, { color: on(0.6) }]}", "style={[s.title, { color: p.onBand }]}", "style={[s.time, { color: p.text }]}", "style={[s.label, { color: p.muted }]}",
      "style={[s.press, { borderColor: p.border2 }]}", "style={[s.pressText, { color: p.muted }]}", "style={[s.nophoneText, { color: p.muted, textDecorationColor: p.border2 }]}",
      "style={[s.run, { borderColor: p.border2 }]}", "style={[s.runText, { color: p.muted }]}", "style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}",
      "contentContainerStyle={[s.body, { paddingBottom: 20 + insets.bottom }]}", "const on = (a: number): string => 'rgba(255,255,255,' + a + ')';",
    ]) assert.ok(rec.includes(part), part);
  });
});

describe('native run recorder: Record run opens it out of the run card (D272 item 6, Amendment 2; D294 ends)', () => {
  const week = read('src', 'this-week', 'ThisWeek.tsx'), app = read('src', 'App.tsx'), opening = read('src', 'run-recorder', 'RecordOpening.tsx');

  test('Record run is offered only where the build holds the recorder, as today\'s page offers it only with its plugin', () => {
    assert.ok(app.includes('onRecord={GPS ? (rec, from) => setRecord({ rec, from }) : null}'));
    assert.ok(week.includes('const screen = prog ? drawWeek(store, prog, now, { shown: shownNow, picked: picks.current.get(shownNow) ?? null }, !!onRecord) : null;'));
    assert.ok(week.includes('  onRecord: ((rec: RecordFrom, from: DeckFrom | null) => void) | null;'));
    // Today's: the model is handed whether window.iaGps is there (a guard: this passes on the release before too).
    const theirs = today('src', 'app', 'screens', 'week-view', 'week-view.ts');
    assert.ok(theirs.includes('private readonly gps = recorderAvailable(window as { iaGps?: unknown });') && theirs.includes('      gps: this.gps,'));
  });

  test('the card\'s tap goes to the recorder with the card\'s place, under the day\'s when line and the run\'s name', () => {
    assert.ok(week.includes("    else if (r.to === 'record') record();\n    else if (onCardio) onCardio(k.week, k.key, r.sheet);"));
    assert.ok(week.includes("  const record = (): void => {\n    if (!onRecord) return;\n    const head = { over: when || '', title: k.title };\n    const el = box.current;\n    if (!el) { onRecord(k.week, k.key, head, null); return; }\n"
      + "    el.measureInWindow((x, y, w, h) => onRecord(k.week, k.key, head, w > 0 && h > 0 ? { box: { t: y, l: x, w, h }, card: k } : null));\n  };"));
    assert.ok(week.includes('onCardio={openSheet} onRecord={record} onRest={') && week.includes('onCardio={onCardio} onRecord={onRecord} />'));
  });

  test('the run it records carries its day, its words, its workout as the session sheet draws it, and the way to its own hand log', () => {
    assert.ok(week.includes("  const record = (week: number, key: string, head: CardioOnly, from: DeckFrom | null): void => {\n    if (!prog || !onRecord) return;\n"));
    assert.ok(week.includes('    const day = weeks && weeks[week] ? weeks[week]![key] : null;\n'
      + '    onRecord({ week, key, over: head.over, title: head.title, workout: recordWorkout(day), handLog: () => openSheet(week, key, head) }, from);'));
    const rules = read('src', 'run-recorder', 'recorder-screen.ts');
    assert.ok(rules.includes('export interface RecordFrom { week: number; key: string; over: string; title: string; workout: CardioCardView | null; handLog: () => void }'));
    // Today's record() and its openDay (a guard: this passes on the release before too).
    const theirs = today('src', 'app', 'screens', 'week-view', 'week-view.ts');
    assert.ok(theirs.includes('const from: RecordFrom = { week: k.week, key: k.key, over: when, title: k.title, workout: recordWorkout(day) };'));
    assert.ok(theirs.includes('this.recorder.openDay = (r) => this.openCardio(r.week, r.key, { over: r.over, title: r.title });'));
  });

  test('the app draws it over This Week and the tab bar, under a sheet, and takes it away once it has closed', () => {
    assert.ok(app.includes('const [record, setRecord] = useState<{ rec: RecordFrom; from: DeckFrom | null } | null>(null);'));
    const line = '{record && GPS && <RecordOpening palette={p} gps={GPS} rec={record.rec} from={record.from} calm={calm} under={under} onClose={() => setRecord(null)} />}';
    assert.ok(app.includes(line));
    assert.ok(app.indexOf('testID="tab-bar"') < app.indexOf(line) && app.indexOf(line) < app.indexOf('{sheet && ('), 'the hand log it opens is drawn over where it stood');
  });

  test('the recorder is drawn once inside the frame, with the card\'s words and workout, and both ways out close into the card first', () => {
    assert.ok(opening.includes("  const heading = useMemo(() => ({ over: rec.over, title: rec.title }), [rec.over, rec.title]);"));
    assert.ok(opening.includes("    <RunRecorder palette={p} gps={gps} heading={heading} workout={rec.workout}\n      onClose={() => way.current.close()}\n      onHandLog={() => way.current.close(way.current.rec.handLog)} />\n  ), [p, gps, heading, rec.workout]);"));
    // The close: only once it is open; the app takes it away, then the hand log opens; at once where nothing moves.
    assert.ok(opening.includes("  const close = (then?: () => void): void => {\n    if (stageNow.current !== 'open') return;\n    const done = (): void => { onClose(); if (then) then(); };\n    if (!moves) { done(); return; }\n    setStage('out');\n    run(growPlan().close, done);\n  };"));
    assert.ok(opening.includes('  const [moves] = useState(!calm && !!from);'), 'at once under Reduce Motion, or when the card\'s place is not known');
    assert.ok(opening.includes("    return <View testID=\"record-opening\" style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>{body}</View>;"));
    assert.ok(opening.includes("<Animated.View pointerEvents={stage === 'open' ? 'auto' : 'none'}"), 'no tap lands while it moves');
  });

  test('its motion is the deck\'s own, line for line (P-DECK call 16: 168 ms lift, 420 ms open, 357 ms close)', () => {
    const deck = read('src', 'deck', 'DeckOpening.tsx');
    const shared = [
      "const PARTS: readonly GrowPart[] = ['frame', 'shut', 'scrim', 'week', 'copyFade', 'copyScale', 'copyFill', 'deckFade', 'deckScale'];",
      "  const [stage, setStage] = useState<Stage>(moves ? 'opening' : 'open');",
      "  const v = useRef(Object.fromEntries(PARTS.filter((k) => k !== 'week').map((k) => [k, new Animated.Value((moves ? GROW_START : GROW_STILL)[k])])) as Record<GrowPart, Animated.Value>).current;",
      '  v.week = under;',
      "      toValue: s.to, duration: s.ms, delay: s.delay, easing: Easing.bezier(...growCurve(s.ease)), useNativeDriver: !GROW_LAYOUT.includes(s.part),",
      '    if (!moves || waits.current) return;',
      '    const plan = growPlan();',
      "      run(plan.lift, () => run(plan.open, () => setStage('open')));",
      '    waits.current = { frame: requestAnimationFrame(() => requestAnimationFrame(lift)), held: setTimeout(lift, 64) };',
      '  const f = growFrames(from.box, vw, vh);',
      "  const shut = stage === 'out';",
      '    ? v.shut.interpolate({ inputRange: [0, 1], outputRange: [full, card] })',
      '    : v.frame.interpolate({ inputRange: [0, 1, 2], outputRange: [card, lifted, full] }));',
      '    ? v.shut.interpolate({ inputRange: [0, 1], outputRange: [p.bg, p.surface] })',
      '    : v.frame.interpolate({ inputRange: [0, 1, 2], outputRange: [p.surface, p.surface2, p.bg] });',
      "onLayout={drawn} style={{ position: 'absolute', overflow: 'hidden', top: at(f.card.t, f.lifted.t, 0), left: at(f.card.l, f.lifted.l, 0), width: at(f.card.w, f.lifted.w, vw), height: at(f.card.h, f.lifted.h, vh), borderRadius: at(f.card.r, f.lifted.r, 0), backgroundColor: fill }}>",
      "        <Animated.View style={{ position: 'absolute', top: at(-f.card.t, -f.lifted.t, 0), left: at(-f.card.l, -f.lifted.l, 0), width: vw, height: vh }}>",
      "style={[StyleSheet.absoluteFill, { opacity: v.deckFade, transform: [{ scale: v.deckScale }] }]}>",
      "pointerEvents=\"none\" style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: v.scrim }]} />",
      "style={{ position: 'absolute', top: from.box.t, left: from.box.l, width: from.box.w, height: from.box.h, borderRadius: 24, overflow: 'hidden', opacity: v.copyFade, transform: [{ scale: v.copyScale }] }}>",
      "          <Animated.View style={{ flex: 1, backgroundColor: v.copyFill.interpolate({ inputRange: [0, 1, 2], outputRange: [clear(p.surface2), p.surface2, p.surface] }) }}>",
      '            <Card k={from.card} p={p} copy />',
      "      {stage !== 'open' && (",
    ];
    for (const line of shared) {
      assert.ok(deck.includes(line), 'the deck\'s opening holds: ' + line);
      assert.ok(opening.includes(line), 'the recorder\'s opening holds: ' + line);
    }
  });
});

describe('native run recorder: the Bugs tab\'s row', () => {
  const bugs = read('src', 'bugs', 'Bugs.tsx'), rec = read('src', 'run-recorder', 'RunRecorder.tsx'), app = read('src', 'App.tsx');
  test('the row is today\'s: its name, its note and Open, after Engine and before the build\'s label', () => {
    assert.ok(rec.includes('    <Row id="recorder-row" label={RECORDER_COPY.row} palette={p}>\n      <Note palette={p}>{RECORDER_COPY.rowNote}</Note>\n      <Seg>\n        <Opt id="recorder-open" label="Open" palette={p} onPress={onOpen} />'));
    const at = ['<EngineCheck palette={p} state={engine} />', '{onRecorder && <RecorderRow palette={p} onOpen={onRecorder} />}', '<Text testID="bug-version"'].map((o) => bugs.indexOf(o));
    assert.ok(at[0]! > 0 && at[0]! < at[1]! && at[1]! < at[2]!);
    // Today's row (a guard: this passes on the release before too).
    const theirs = today('src', 'app', 'screens', 'bug-report', 'bug-report.ts');
    assert.ok(theirs.includes('<button class="look-opt" id="runRecorderOpen" (click)="recorderOpen.set(true)">Open</button>'));
    assert.ok(theirs.indexOf('id="engineCheckMsg"') < theirs.indexOf('@if (recorder) {') && theirs.indexOf('@if (recorder) {') < theirs.indexOf('id="bugVersion"'));
  });

  test('the row is drawn only where the build holds the module, and Open draws the recorder over the tab bar with the test bench\'s words', () => {
    assert.ok(app.includes('onRecorder={GPS ? () => setBench(true) : null}'));
    assert.ok(app.includes('{bench && GPS && <RunRecorder palette={p} gps={GPS} heading={null} workout={null} onClose={() => setBench(false)}'));
    assert.ok(app.indexOf('testID="tab-bar"') < app.indexOf('{bench && GPS && <RunRecorder'), 'drawn after the tab bar, so over it');
    assert.ok(existsSync(join(NATIVE, 'src', 'run-recorder', 'gps.ts')));
  });
});
