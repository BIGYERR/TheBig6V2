// Writes the e2e result as one static HTML page. Screenshots stay beside it as PNG artifacts under screenshots/.
import { writeFileSync } from 'node:fs';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const STATUS_LABEL = { pass: 'Pass', fail: 'Fail', skipped: 'Not run' };

function badge(status) {
  return `<span class="badge ${esc(status)}">${esc(STATUS_LABEL[status] ?? status)}</span>`;
}

function parityCell(p, maxPct) {
  if (!p) return '<span class="muted">n/a</span>';
  if (p.error) return `<span class="badge fail">${esc(p.error)}</span>`;
  const cls = p.pct <= maxPct ? 'pass' : 'fail';
  return `<span class="badge ${cls}">${p.pct.toFixed(3)}%</span>`;
}

function figure(src, caption) {
  if (!src) return `<figure class="empty"><div>No screenshot</div><figcaption>${esc(caption)}</figcaption></figure>`;
  return `<figure><a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(caption)}" loading="lazy"></a><figcaption>${esc(caption)}</figcaption></figure>`;
}

export function writeReport(file, r) {
  const steps = r.steps;
  const passed = steps.filter((s) => s.ok).length;
  const verdict = r.ok ? 'pass' : 'fail';
  const rows = steps
    .map(
      (s, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td><a href="#${esc(s.id)}">${esc(s.page)}</a><div class="muted mono">${esc(s.id)}</div></td>
        <td>${badge(s.angular.status)}</td>
        <td>${badge(s.reference.status)}</td>
        <td>${parityCell(s.parity, r.parityMaxPct)}</td>
        <td class="num">${s.angular.ms ?? ''}</td>
      </tr>`,
    )
    .join('');

  const cards = steps
    .map((s, i) => {
      const notes = [];
      for (const [label, t] of [['Angular', s.angular], ['Reference', s.reference]]) {
        if (t.error) notes.push(`<li class="err"><b>${label}:</b> ${esc(t.error)}</li>`);
        for (const p of t.problems ?? []) notes.push(`<li class="err"><b>${label}:</b> ${esc(p)}</li>`);
        for (const w of t.warnings ?? []) notes.push(`<li class="warn"><b>${label}:</b> ${esc(w)}</li>`);
      }
      return `<section class="card" id="${esc(s.id)}">
        <header>
          <div><span class="step">Step ${i + 1}</span><h2>${esc(s.page)}</h2><div class="muted mono">${esc(s.id)}</div></div>
          <div class="right">${badge(s.ok ? 'pass' : s.angular.status === 'skipped' ? 'skipped' : 'fail')}
            <div class="muted">Parity ${parityCell(s.parity, r.parityMaxPct)}</div></div>
        </header>
        ${notes.length ? `<ul class="notes">${notes.join('')}</ul>` : ''}
        <div class="shots">
          ${figure(s.angular.shot, 'Angular build')}
          ${figure(s.reference.shot, 'Original index.html')}
          ${figure(s.parity?.diff, 'Pixel difference (red)')}
        </div>
      </section>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Iron Asylum e2e report</title>
<style>
:root{--bone:#F4F1E8;--ink:#181712;--muted:#6b675c;--line:#d9d4c5;--card:#fffdf7;--signal:#CF4E1A;--pass:#2f6b3a;--pass-bg:#e3efdf;--fail:#a3261b;--fail-bg:#f6dedb;--skip-bg:#ebe7dc;--warn:#8a5a00}
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
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}
.badge.pass{background:var(--pass-bg);color:var(--pass)}.badge.fail{background:var(--fail-bg);color:var(--fail)}.badge.skipped{background:var(--skip-bg);color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin-top:18px}
.card header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.card .right{text-align:right}
.step{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--signal);font-weight:700}
.notes{margin:12px 0 0;padding-left:18px}.notes .err{color:var(--fail)}.notes .warn{color:var(--warn)}
.shots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
figure{margin:0}
figure img{width:100%;height:auto;display:block;border:1px solid var(--line);border-radius:6px;background:#fff}
figure.empty div{aspect-ratio:393/852;border:1px dashed var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--muted)}
figcaption{font-size:12px;color:var(--muted);margin-top:4px;text-align:center}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0}
dt{color:var(--muted)}dd{margin:0;overflow-wrap:anywhere}
@media (max-width:640px){.shots{grid-template-columns:repeat(2,minmax(0,1fr))}.card header{flex-direction:column}.card .right{text-align:left}}
</style>
</head>
<body>
<main>
<h1>Iron Asylum <span>e2e</span></h1>
<div class="muted">The Angular build, served from Docker, driven by Puppeteer through every major page and compared screen by screen with the original index.html.</div>
<div class="verdict ${verdict}">${r.ok ? 'All checks passed' : 'Failed'}</div>
<div class="summary">
  <div class="tile"><div class="muted">Steps passed</div><div class="v">${passed} / ${steps.length}</div></div>
  <div class="tile"><div class="muted">App version</div><div class="v">ia-version ${esc(r.version)}</div></div>
  <div class="tile"><div class="muted">Worst parity</div><div class="v">${r.worstParityPct == null ? 'n/a' : r.worstParityPct.toFixed(3) + '%'}</div><div class="muted">limit ${r.parityMaxPct}%</div></div>
  <div class="tile"><div class="muted">Run time</div><div class="v">${(r.durationMs / 1000).toFixed(1)} s</div></div>
</div>
<div class="tile" style="margin-bottom:20px"><dl>
  <dt>Ran</dt><dd>${esc(r.ranAt)}</dd>
  <dt>Served from</dt><dd class="mono">${esc(r.baseUrl)}${r.docker ? ' (Docker: ' + esc(r.docker) + ')' : ''}</dd>
  <dt>Source</dt><dd class="mono">index.html sha256 ${esc(r.sourceSha256 ?? 'unknown')}</dd>
  <dt>Browser</dt><dd>${esc(r.browserVersion)}, ${r.viewport.width}×${r.viewport.height} @${r.viewport.deviceScaleFactor}x, touch</dd>
  <dt>Clock</dt><dd>Frozen at ${esc(r.frozenNow)} (${esc(r.timezone)}); Math.random seeded; animations off</dd>
  <dt>Blocked</dt><dd>${r.blocked.length ? esc(r.blocked.join(', ')) : 'No requests needed blocking (the bug form was never sent)'}</dd>
</dl></div>
<div class="table-wrap"><table>
  <thead><tr><th class="num">#</th><th>Page</th><th>Angular</th><th>Reference</th><th>Parity</th><th class="num">ms</th></tr></thead>
  <tbody>${rows}</tbody>
</table></div>
${cards}
</main>
</body>
</html>
`;
  writeFileSync(file, html);
}
