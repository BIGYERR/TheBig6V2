#!/usr/bin/env node
// Iron Asylum e2e: builds and serves the app in Docker, clicks through every major page with Puppeteer, and writes
// one static HTML report with a screenshot of each page.
//
//   npm run e2e                  build the image, run, tear down; report at e2e/report/index.html
//   E2E_KEEP=1 npm run e2e       leave the container running afterwards
//   E2E_BASE_URL=http://host:port npm run e2e    skip Docker and test a server that is already up
//   E2E_PORT=4280                host port for the container (default 4280)
//   E2E_PARITY_MAX=0             largest pixel difference allowed against the original, in percent (default 0:
//                                clean runs match exactly, and a planted 0.3% title change must fail)
//
// Two targets run the same steps in separate browser contexts (separate storage): the Angular build at / and the
// original index.html at /reference/. A step passes when both targets pass its assertions with no console error or
// uncaught exception, and their screenshots differ by no more than E2E_PARITY_MAX percent of pixels.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import puppeteer from 'puppeteer';
import { FROZEN_NOW, TIMEZONE, VIEWPORT, openPage } from './browser.mjs';
import { STEPS, helpers } from './flow.mjs';
import { writeReport } from './report.mjs';

const E2E = dirname(fileURLToPath(import.meta.url));
const REPORT = join(E2E, 'report');
const SHOTS = join(REPORT, 'screenshots');
const COMPOSE = ['compose', '-f', join(E2E, 'docker-compose.yml')];
const PORT = process.env.E2E_PORT || '4280';
const EXTERNAL = process.env.E2E_BASE_URL?.replace(/\/$/, '');
const KEEP = process.env.E2E_KEEP === '1';
const PARITY_MAX = Number(process.env.E2E_PARITY_MAX ?? '0');

const TARGETS = [
  { id: 'angular', path: '/' },
  { id: 'reference', path: '/reference/' },
];

function docker(args, logName) {
  const res = spawnSync('docker', [...COMPOSE, ...args], {
    env: { ...process.env, E2E_PORT: PORT },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  writeFileSync(join(REPORT, logName), `$ docker ${[...COMPOSE, ...args].join(' ')}\n${res.stdout}${res.stderr}`);
  if (res.status !== 0) {
    process.stderr.write(`${res.stdout}${res.stderr}`.split('\n').slice(-30).join('\n') + '\n');
    throw new Error(`docker ${args[0]} failed (exit ${res.status}); log: ${relative(process.cwd(), join(REPORT, logName))}`);
  }
}

/**
 * Waits until the page is safe to photograph: web fonts loaded (a late font swap moves every glyph) and the layout
 * still across two consecutive frames (a scroll or reflow in flight would make two identical screens differ).
 */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const snap = () => `${scrollY}|${[...document.querySelectorAll('.overlay.open, .rand-overlay.open')].map((e) => e.scrollTop).join(',')}|${document.body.scrollHeight}`;
        const before = snap();
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(snap() === before)));
      }),
    { timeout: 5000 },
  );
}

async function runTarget(browser, base, target, stepResults) {
  const { context, page, problems, warnings, blocked } = await openPage(browser);
  const t = helpers(page);
  const state = {};
  mkdirSync(join(SHOTS, target.id), { recursive: true });
  let broken = null;
  try {
    await page.goto(base + target.path, { waitUntil: 'networkidle0' });
    await t.screen('screenHome');
  } catch (err) {
    broken = `the app did not boot: ${err.message}`;
  }
  for (const [i, step] of STEPS.entries()) {
    const r = (stepResults[i][target.id] = { status: 'skipped' });
    if (broken) {
      r.error = i === 0 ? broken : undefined;
      if (i === 0) r.status = 'fail';
      continue;
    }
    const seenProblems = problems.length;
    const seenWarnings = warnings.length;
    const started = performance.now();
    try {
      await step.run(t, page, state);
      if (step.shot) await page.$eval(step.shot, (e) => e.scrollIntoView({ block: 'center' }));
      await settle(page);
    } catch (err) {
      r.error = err.message;
    }
    const file = join(SHOTS, target.id, `${String(i + 1).padStart(2, '0')}-${step.id}.png`);
    await page.screenshot({ path: file }).catch(() => {});
    r.shot = relative(REPORT, file);
    if (!r.error && step.after) {
      try {
        await step.after(t, page, state);
      } catch (err) {
        r.error = `after the screenshot: ${err.message}`;
      }
    }
    r.ms = Math.round(performance.now() - started);
    r.problems = problems.slice(seenProblems);
    r.warnings = warnings.slice(seenWarnings);
    r.status = r.error || r.problems.length ? 'fail' : 'pass';
    if (r.status === 'fail') broken = `stopped after step ${i + 1} failed`;
  }
  await context.close();
  return blocked;
}

function compare(step, i) {
  const a = step.angular;
  const b = step.reference;
  if (a.status !== 'pass' || b.status !== 'pass') return null;
  const imgA = PNG.sync.read(readFileSync(join(REPORT, a.shot)));
  const imgB = PNG.sync.read(readFileSync(join(REPORT, b.shot)));
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return { error: `sizes differ ${imgA.width}×${imgA.height} vs ${imgB.width}×${imgB.height}` };
  }
  const diff = new PNG({ width: imgA.width, height: imgA.height });
  const changed = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, { threshold: 0.1 });
  mkdirSync(join(SHOTS, 'diff'), { recursive: true });
  const file = join(SHOTS, 'diff', `${String(i + 1).padStart(2, '0')}-${STEPS[i].id}.png`);
  writeFileSync(file, PNG.sync.write(diff));
  return { pct: (changed / (imgA.width * imgA.height)) * 100, pixels: changed, diff: relative(REPORT, file) };
}

async function main() {
  const t0 = performance.now();
  rmSync(REPORT, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });

  const base = EXTERNAL ?? `http://127.0.0.1:${PORT}`;
  if (!EXTERNAL) {
    console.log(`e2e: building and starting the frontend container on port ${PORT}...`);
    docker(['up', '-d', '--build', '--wait'], 'docker-up.log');
  }

  let exitCode;
  try {
    const servedHtml = await (await fetch(base + '/')).text();
    const version = (servedHtml.match(/name="ia-version" content="(\d+)"/) || [])[1] ?? 'unknown';
    const sourceSha256 = (servedHtml.match(/sha256 ([0-9a-f]{64})/) || [])[1];

    const browser = await puppeteer.launch({ headless: true });
    const browserVersion = await browser.version();
    const steps = STEPS.map((s) => ({ id: s.id, page: s.page }));
    const blocked = [];
    try {
      for (const target of TARGETS) {
        console.log(`e2e: ${target.id} at ${base}${target.path}`);
        blocked.push(...(await runTarget(browser, base, target, steps)));
      }
    } finally {
      await browser.close();
    }

    let worst = null;
    for (const [i, s] of steps.entries()) {
      s.parity = compare(s, i);
      if (s.parity && !s.parity.error) worst = Math.max(worst ?? 0, s.parity.pct);
      const parityOk = !!s.parity && !s.parity.error && s.parity.pct <= PARITY_MAX;
      s.ok = s.angular.status === 'pass' && s.reference.status === 'pass' && parityOk;
      const mark = s.ok ? 'PASS' : 'FAIL';
      const why = s.angular.error || s.reference.error || s.parity?.error || '';
      console.log(`  ${mark} ${String(i + 1).padStart(2)} ${s.id}${s.parity?.pct != null ? `  parity ${s.parity.pct.toFixed(3)}%` : ''}${why ? `  ${why}` : ''}`);
    }
    const ok = steps.every((s) => s.ok);
    const reportFile = join(REPORT, 'index.html');
    writeReport(reportFile, {
      ok,
      steps,
      version,
      sourceSha256,
      baseUrl: base,
      docker: EXTERNAL ? null : 'app/e2e/docker-compose.yml',
      browserVersion,
      viewport: VIEWPORT,
      frozenNow: FROZEN_NOW,
      timezone: TIMEZONE,
      parityMaxPct: PARITY_MAX,
      worstParityPct: worst,
      blocked,
      ranAt: new Date().toISOString(),
      durationMs: performance.now() - t0,
    });
    console.log(`e2e: ${steps.filter((s) => s.ok).length}/${steps.length} steps passed; report ${relative(process.cwd(), reportFile)}`);
    exitCode = ok ? 0 : 1;
  } finally {
    if (!EXTERNAL && !KEEP) docker(['down', '--remove-orphans'], 'docker-down.log');
  }
  process.exitCode = exitCode;
}

main().catch((err) => {
  console.error(`e2e: ${err.message}`);
  process.exitCode = 1;
});
