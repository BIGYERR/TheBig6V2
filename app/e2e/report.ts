// The e2e result as one self-contained HTML page. Every screenshot is embedded as a data: URI and the styles and
// the one script are inline, so the file opens anywhere on its own: mailed, attached, or moved out of report/.
import type { PageStepResult, Parity, RunReport, Status, StepResult, TargetResult } from './types.ts';
import { pageLabel, stepLabel } from './types.ts';
import { tag } from '../scripts/version.mjs';

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

export const dataUri = (png: Uint8Array): string => `data:image/png;base64,${Buffer.from(png).toString('base64')}`;

const STATUS_LABEL: Record<Status, string> = { pass: 'Pass', fail: 'Fail', skipped: 'Not run' };

const badge = (status: Status): string => `<span class="badge ${status}">${STATUS_LABEL[status]}</span>`;

function parityCell(p: Parity | null, maxPct: number): string {
  if (!p) return '<span class="muted">n/a</span>';
  if ('error' in p) return `<span class="badge fail">${esc(p.error)}</span>`;
  return `<span class="badge ${p.pct <= maxPct ? 'pass' : 'fail'}">${p.pct.toFixed(3)}%${p.pixels ? ` (${p.pixels} px)` : ''}</span>`;
}

function figure(png: Uint8Array | undefined, caption: string, missing = 'No screenshot'): string {
  if (!png) return `<figure class="empty"><div>${esc(missing)}</div><figcaption>${esc(caption)}</figcaption></figure>`;
  return `<figure><img src="${dataUri(png)}" alt="${esc(caption)}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`;
}

function stepStatus(s: StepResult): Status {
  if (s.ok) return 'pass';
  return s.angular.status === 'skipped' && s.reference.status === 'skipped' ? 'skipped' : 'fail';
}

function notes(s: StepResult): string {
  const out: string[] = [];
  const targets: [string, TargetResult][] = [
    ['Angular', s.angular],
    ['Reference', s.reference],
  ];
  for (const [label, t] of targets) {
    if (t.error) out.push(`<li class="err"><b>${label}:</b> ${esc(t.error)}</li>`);
    for (const p of t.problems) out.push(`<li class="err"><b>${label}:</b> ${esc(p)}</li>`);
    for (const w of t.warnings) out.push(`<li class="warn"><b>${label}:</b> ${esc(w)}</li>`);
  }
  if (s.parity && 'error' in s.parity) out.push(`<li class="err"><b>Parity:</b> ${esc(s.parity.error)}</li>`);
  return out.length ? `<ul class="notes">${out.join('')}</ul>` : '';
}

function card(s: StepResult, r: RunReport): string {
  const diff = s.parity && 'diffPng' in s.parity ? s.parity.diffPng : undefined;
  return `<section class="card" id="${esc(s.id)}">
  <header>
    <div><span class="step">#${stepLabel(s.n)}</span> <span class="muted">${esc(s.journey)}</span><h2>${esc(s.page)}</h2><div class="muted mono">${esc(s.journeyId)}/${esc(s.id)}</div></div>
    <div class="right">${badge(stepStatus(s))}<div class="muted">Parity ${parityCell(s.parity, r.parityMaxPct)}</div></div>
  </header>
  ${notes(s)}
  <div class="shots">
    ${figure(s.angular.png, 'Angular build')}
    ${figure(s.reference.png, 'Original index.html')}
    ${figure(diff, 'Pixel difference (red)', 'Not compared')}
  </div>
</section>`;
}

/** A website or admin step's card: its checks' notes and its one full-page screenshot. */
function pageCard(s: PageStepResult): string {
  const r = s.result;
  const out: string[] = [];
  if (r.error) out.push(`<li class="err">${esc(r.error)}</li>`);
  for (const p of r.problems) out.push(`<li class="err">${esc(p)}</li>`);
  for (const w of r.warnings) out.push(`<li class="warn">${esc(w)}</li>`);
  return `<section class="card" id="${esc(s.id)}">
  <header>
    <div><span class="step">#${pageLabel(s)}</span> <span class="muted">${esc(s.journey)}</span><h2>${esc(s.page)}</h2><div class="muted mono">${esc(s.journeyId)}/${esc(s.id)}</div></div>
    <div class="right">${badge(s.ok ? 'pass' : r.status === 'skipped' ? 'skipped' : 'fail')}<div class="muted">${esc(s.viewport)}</div></div>
  </header>
  ${out.length ? `<ul class="notes">${out.join('')}</ul>` : ''}
  <div class="shots one">
    ${figure(r.png, `Full page${s.url ? `, ${s.url}` : ''}`)}
  </div>
</section>`;
}

/** The website and admin steps: a table and a card each, under one heading per band. */
function pageSections(r: RunReport): string {
  const bands: [string, string, PageStepResult[]][] = [
    ['Website', 'The public site the backend serves at /, full height, and the pages it links to on the same host.', r.pages.filter((s) => s.band === 'website')],
    ['Admin', 'The staff admin at /admin/: the login, every section after signing in, and the signed out screen.', r.pages.filter((s) => s.band === 'admin')],
  ];
  return bands
    .filter(([, , steps]) => steps.length)
    .map(
      ([name, about, steps]) => `<h2 class="band">${name} <span class="muted">${steps.filter((s) => s.ok).length} / ${steps.length} passed</span></h2>
<div class="muted">${esc(about)} One target each, so no parity: a step passes when its page answered 200, shows what it should, and logged no error.</div>
<div class="table-wrap"><table>
  <thead><tr><th class="num">#</th><th>Page</th><th>Result</th><th>Viewport</th><th class="num">ms</th></tr></thead>
  <tbody>${steps
    .map(
      (s) => `<tr>
    <td class="num">#${pageLabel(s)}</td>
    <td><a href="#${esc(s.id)}">${esc(s.page)}</a><div class="muted mono">${esc(s.journeyId)}/${esc(s.id)}</div></td>
    <td>${badge(s.ok ? 'pass' : s.result.status === 'skipped' ? 'skipped' : 'fail')}</td>
    <td>${esc(s.viewport)}</td>
    <td class="num">${s.result.ms ?? ''}</td>
  </tr>`,
    )
    .join('')}</tbody>
</table></div>
${steps.map(pageCard).join('\n')}`,
    )
    .join('\n');
}

/** A table row naming the journey, before the first step of each one. */
function journeyRow(s: StepResult, prev: StepResult | undefined): string {
  if (prev && prev.journeyId === s.journeyId) return '';
  return `<tr class="journey"><td colspan="6">${esc(s.journey)} <span class="muted mono">${esc(s.journeyId)}</span></td></tr>`;
}

function row(s: StepResult, r: RunReport): string {
  return `<tr>
    <td class="num">#${stepLabel(s.n)}</td>
    <td><a href="#${esc(s.id)}">${esc(s.page)}</a><div class="muted mono">${esc(s.id)}</div></td>
    <td>${badge(s.angular.status)}</td>
    <td>${badge(s.reference.status)}</td>
    <td>${parityCell(s.parity, r.parityMaxPct)}</td>
    <td class="num">${s.angular.ms ?? ''}</td>
  </tr>`;
}

const CSS = `
:root{color-scheme:light dark;--bone:#F4F1E8;--ink:#181712;--muted:#6b675c;--line:#d9d4c5;--card:#fffdf7;--signal:#CF4E1A;--pass:#2f6b3a;--pass-bg:#e3efdf;--fail:#a3261b;--fail-bg:#f6dedb;--skip-bg:#ebe7dc;--warn:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bone:#15140f;--ink:#efeadc;--muted:#a39e8f;--line:#34322a;--card:#1d1c16;--pass:#9fd3a4;--pass-bg:#1f3322;--fail:#f2a59c;--fail-bg:#3b1d19;--skip-bg:#2a2821;--warn:#e7c27a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bone);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:28px;margin:0 0 4px;letter-spacing:.01em}
h1 span{color:var(--signal)}
h2{font-size:18px;margin:2px 0 0}
a{color:inherit}
.muted{color:var(--muted);font-size:13px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:20px 0}
.tile{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px}
.tile .v{font-size:22px;font-weight:700}
.verdict{display:inline-block;margin-top:10px;padding:6px 12px;border-radius:6px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.verdict.pass{background:var(--pass-bg);color:var(--pass)}.verdict.fail{background:var(--fail-bg);color:var(--fail)}
.table-wrap{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:8px}
table{border-collapse:collapse;width:100%;min-width:620px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
tr:last-child td{border-bottom:none}
tr.journey td{background:var(--bone);font-weight:700;padding-top:14px}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.badge.pass{background:var(--pass-bg);color:var(--pass)}.badge.fail{background:var(--fail-bg);color:var(--fail)}.badge.skipped{background:var(--skip-bg);color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin-top:18px}
.card header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.card .right{text-align:right}
.step{font-size:13px;letter-spacing:.06em;color:var(--signal);font-weight:700;font-variant-numeric:tabular-nums}
.notes{margin:12px 0 0;padding-left:18px}.notes .err{color:var(--fail)}.notes .warn{color:var(--warn)}
.shots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
.shots.one{grid-template-columns:minmax(0,420px)}
h2.band{font-size:22px;margin:34px 0 4px}h2.band .muted{font-size:15px;font-weight:400}
figure{margin:0}
figure img{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:6px;background:#fff;cursor:zoom-in}
figure.empty div{aspect-ratio:393/852;border:1px dashed var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--muted)}
figcaption{font-size:12px;color:var(--muted);margin-top:4px;text-align:center}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0}
dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
dialog{border:none;padding:0;background:transparent;max-width:96vw;max-height:96vh}
dialog::backdrop{background:rgba(10,10,8,.82)}
dialog img{display:block;max-width:96vw;max-height:90vh;width:auto;height:auto;border-radius:6px;cursor:zoom-out}
dialog p{margin:6px 0 0;text-align:center;color:#efeadc;font-size:13px}
@media (max-width:640px){.shots{grid-template-columns:repeat(2,minmax(0,1fr))}.card header{flex-direction:column}.card .right{text-align:left}}
`;

/** Click a screenshot to see it full size; click again or press Escape to close. Reuses the embedded image. */
const ZOOM_SCRIPT = `
const zoom = document.getElementById('zoom');
document.addEventListener('click', (e) => {
  const shot = e.target.closest('figure img');
  if (shot) {
    zoom.querySelector('img').src = shot.src;
    zoom.querySelector('p').textContent = shot.closest('.card').querySelector('.step').textContent + ' ' + shot.alt;
    zoom.showModal();
  } else if (zoom.open && e.target.closest('dialog')) {
    zoom.close();
  }
});
zoom.addEventListener('close', () => zoom.querySelector('img').removeAttribute('src'));
`;

export function renderReport(r: RunReport): string {
  const passed = r.steps.filter((s) => s.ok).length + r.pages.filter((s) => s.ok).length;
  const total = r.steps.length + r.pages.length;
  const tally = (steps: { ok: boolean }[]) => `${steps.filter((s) => s.ok).length}/${steps.length}`;
  const website = r.pages.filter((s) => s.band === 'website');
  const admin = r.pages.filter((s) => s.band === 'admin');
  const bands = r.collage?.bands?.length ? `, in bands top to bottom: ${r.collage.bands.map((b) => `${esc(b.title)} (${b.screens})`).join(', ')}` : '';
  const collage = r.collage
    ? `${esc(r.collage.file)} beside this file: ${r.collage.width}×${r.collage.height} px (${((r.collage.width * r.collage.height) / 1e6).toFixed(1)} MP), ${r.collage.screens} screens${bands}, labelled with the step numbers used here`
    : 'not written';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Iron Asylum e2e report</title>
<style>${CSS}</style>
</head>
<body>
<main>
<h1>Iron Asylum <span>e2e</span></h1>
<div class="muted">The website and the admin, served by the backend, photographed full height; then the Angular build, driven by Puppeteer through every journey and compared screen by screen with the original index.html. All of it runs in Docker. This file is self-contained: every screenshot is embedded.</div>
<div class="verdict ${r.ok ? 'pass' : 'fail'}">${r.ok ? 'All checks passed' : 'Failed'}</div>
<div class="summary">
  <div class="tile"><div class="muted">Steps passed</div><div class="v">${passed} / ${total}</div>${r.pages.length ? `<div class="muted">website ${tally(website)} · admin ${tally(admin)} · app ${tally(r.steps)}</div>` : ''}</div>
  <div class="tile"><div class="muted">App version</div><div class="v">${esc(tag(r.version))}</div></div>
  <div class="tile"><div class="muted">Worst parity</div><div class="v">${r.worstParityPct == null ? 'n/a' : r.worstParityPct.toFixed(3) + '%'}</div><div class="muted">limit ${r.parityMaxPct}%</div></div>
  <div class="tile"><div class="muted">Run time</div><div class="v">${(r.durationMs / 1000).toFixed(1)} s</div></div>
</div>
<div class="tile" style="margin-bottom:20px"><dl>
  <dt>Ran</dt><dd>${esc(r.ranAt)}</dd>
  <dt>Served from</dt><dd class="mono">app ${esc(r.baseUrl)} (nginx container); website and admin ${esc(r.backendUrl)} (backend container); app/e2e/docker-compose.yml</dd>
  <dt>Source</dt><dd class="mono">index.html sha256 ${esc(r.sourceSha256 ?? 'unknown')}</dd>
  <dt>Browser</dt><dd>${esc(r.browserVersion)} in the runner container, ${r.viewport.width}×${r.viewport.height} @${r.viewport.deviceScaleFactor}x, touch</dd>
  <dt>Clock</dt><dd>Frozen at ${esc(r.frozenNow)} (${esc(r.timezone)}); Math.random seeded; animations off</dd>
  <dt>Blocked</dt><dd>${r.blocked.length ? esc(r.blocked.join(', ')) : 'No requests needed blocking (the bug form was never sent)'}</dd>
  <dt>Journeys</dt><dd>${[...new Set([...r.pages, ...r.steps].map((s) => s.journey))].map(esc).join('; ')}, each from empty storage</dd>
  <dt>Collage</dt><dd>${collage}</dd>
</dl></div>
${pageSections(r)}
${r.pages.length ? `<h2 class="band">App <span class="muted">${tally(r.steps).replace('/', ' / ')} passed</span></h2>` : ''}
<div class="table-wrap"><table>
  <thead><tr><th class="num">#</th><th>Page</th><th>Angular</th><th>Reference</th><th>Parity</th><th class="num">ms</th></tr></thead>
  <tbody>${r.steps.map((s, i) => journeyRow(s, r.steps[i - 1]) + row(s, r)).join('')}</tbody>
</table></div>
${r.steps.map((s) => card(s, r)).join('\n')}
</main>
<dialog id="zoom"><img alt=""><p></p></dialog>
<script>${ZOOM_SCRIPT}</script>
</body>
</html>
`;
}

const TAG = /<[a-zA-Z][^>]*>/g;
const URL_ATTR = /\s(src|href|srcset|poster|action|formaction|data|xlink:href|background)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTR = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const CSS_REF = /url\(\s*(['"]?)([^'")]*)\1\s*\)|@import\b[^;]*/gi;

const isLocal = (ref: string) => ref === '' || ref.startsWith('data:') || ref.startsWith('#');

/**
 * Every reference in an HTML page that would need another file or the network: URL attributes on any tag, and
 * url() or @import in styles. data: URIs and same-page #anchors are local. An empty list means the page stands alone.
 */
export function externalRefs(html: string): string[] {
  const found: string[] = [];
  for (const [tag] of html.matchAll(TAG)) {
    for (const m of tag.matchAll(URL_ATTR)) {
      const ref = (m[2] ?? m[3] ?? m[4] ?? '').trim();
      if (!isLocal(ref)) found.push(`${m[1]}="${ref.slice(0, 80)}"`);
    }
    for (const m of tag.matchAll(STYLE_ATTR)) found.push(...cssRefs(m[1] ?? m[2] ?? ''));
  }
  for (const m of html.matchAll(STYLE_BLOCK)) found.push(...cssRefs(m[1] ?? ''));
  return found;
}

function cssRefs(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(CSS_REF)) {
    const ref = (m[2] ?? '').trim();
    if (m[0].startsWith('@import') || !isLocal(ref)) out.push(m[0].slice(0, 80));
  }
  return out;
}
