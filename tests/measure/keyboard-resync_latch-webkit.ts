// keyboard-resync on WebKit: the latch measure (keyboard-resync_latch.ts) in the iOS simulator's Safari, where the resync
// is meant to work. Read-only (measure). D280 was found in the e2e's Chrome; this asks whether WebKit latches the same
// way, and whether the build that skips a resync while one is in flight rests where the page was.
// Usage: node tests/measure/keyboard-resync_latch-webkit.ts <before page> <after page>, with a simulator booted. It
// serves one page on localhost that runs one trial per load (the top-level window, so the page scrolls as Safari
// scrolls it), posts scrollY back, and loads the next; Safari is opened on it by `xcrun simctl openurl booted`.
// Prints each case's five results for each page, then exits.
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename } from 'node:path';

const pages = process.argv.slice(2);
if (pages.length !== 2) throw new Error('usage: keyboard-resync_latch-webkit.ts <before page> <after page>');
const lift = (file: string) => {
  const js = readFileSync(file, 'utf8');
  const from = js.search(/\nfunction installKeyboardResync\(/);
  if (from < 0) throw new Error(`no installKeyboardResync in ${file}`);
  const end = js.indexOf('\n}', from);
  return { name: basename(file), version: /name="ia-version" content="([^"]+)"/.exec(js)?.[1] ?? '?', src: js.slice(from + 1, end + 2) };
};
const bodies = pages.map(lift);
const CASES: [string, number, number, number][] = [
  ['two focus changes 200 ms apart', 200, 0, 0],
  ['the same, both timers held behind one 300 ms task', 200, 300, 600],
  ['two focus changes 5 ms apart', 5, 0, 0],
  ['two focus changes in one task', 0, 0, 0],
];
const TRIALS = 5;
const total = bodies.length * CASES.length * TRIALS;
const results: number[][][] = bodies.map(() => CASES.map(() => []));

const page = (t: number) => {
  const b = Math.floor(t / (CASES.length * TRIALS)), c = Math.floor(t / TRIALS) % CASES.length;
  const [, gap, from, to] = CASES[c]!;
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;height:4000px">
<button id="a">A</button><button id="b">B</button><button id="c">C</button>
<script>${bodies[b]!.src}
(async () => {
  scrollTo(0, 0);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  await pause(300);
  installKeyboardResync(window);
  const el = (id) => document.getElementById(id);
  el('a').focus(); await pause(20);
  const t0 = performance.now();
  el('b').focus();
  if (${gap}) await pause(${gap});
  el('c').focus();
  if (${to} > ${from}) { await pause(${from} - (performance.now() - t0)); while (performance.now() < t0 + ${to}) {} }
  await pause(1200);
  await fetch('/result?t=${t}&y=' + scrollY, { method: 'POST' });
  if (${t + 1} < ${total}) location.replace('/?t=${t + 1}');
})();
</script>`;
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/result') {
    const t = Number(url.searchParams.get('t')), y = Number(url.searchParams.get('y'));
    const b = Math.floor(t / (CASES.length * TRIALS)), c = Math.floor(t / TRIALS) % CASES.length;
    results[b]![c]!.push(y);
    res.end('ok');
    if (t + 1 === total) {
      for (const [i, body] of bodies.entries()) {
        console.log(`${i ? '\n' : ''}installKeyboardResync from ${body.name}, ia-version ${body.version}, iOS simulator Safari`);
        CASES.forEach(([label], c) => console.log(`${label}: scrollY after = ${results[i]![c]!.join(', ')}`));
      }
      server.close();
      process.exit(0);
    }
    return;
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(page(Number(url.searchParams.get('t') ?? 0)));
});
server.listen(8791, '127.0.0.1', () => {
  execFileSync('xcrun', ['simctl', 'openurl', 'booted', 'http://localhost:8791/?t=0']);
});
setTimeout(() => {
  console.error(`timed out with ${results.flat().flat().length} of ${total} trials`);
  process.exit(1);
}, 180000);
