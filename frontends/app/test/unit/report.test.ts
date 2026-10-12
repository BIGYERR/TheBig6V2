import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { externalRefs, renderReport } from '../../e2e/report.ts';
import { embeddedPngs, fakePage, fakeRun, fakeStep, solidPng } from '../helpers.ts';

describe('renderReport', () => {
  it('embeds every screenshot and diff as a data: URI, byte for byte', () => {
    const steps = [fakeStep(1), fakeStep(2), fakeStep(3)];
    const html = renderReport(fakeRun(steps));
    const pngs = embeddedPngs(html);
    assert.equal(pngs.length, 9, 'three images per step: Angular, original, diff');
    assert.ok(pngs[0]!.equals(steps[0]!.angular.png!), 'the first image is the first Angular screenshot');
  });

  it('references no other file and nothing on the network', () => {
    const html = renderReport(fakeRun([fakeStep(1), fakeStep(2)]));
    assert.deepEqual(externalRefs(html), []);
  });

  it('labels steps with the zero-padded numbers the collage uses', () => {
    const html = renderReport(fakeRun([fakeStep(1), fakeStep(9)]));
    assert.match(html, /<span class="step">#01<\/span>/);
    assert.match(html, /<span class="step">#09<\/span>/);
  });

  it('escapes page names and errors instead of rendering them as markup', () => {
    const step = fakeStep(1, {
      page: '<script>alert(1)</script>',
      ok: false,
      angular: { status: 'fail', error: 'expected "x" in <div>', problems: [], warnings: [] },
    });
    const html = renderReport(fakeRun([step]));
    assert.ok(!html.includes('<script>alert(1)</script>'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(html.includes('expected &quot;x&quot; in &lt;div&gt;'));
  });

  it('shows the verdict, the failing step and the missing screenshots', () => {
    const failing = fakeStep(2, {
      ok: false,
      angular: { status: 'fail', error: 'nothing visible to tap at #wizardNext', problems: ['console.error: boom'], warnings: [] },
      reference: { status: 'skipped', problems: [], warnings: [] },
      parity: null,
    });
    const html = renderReport(fakeRun([fakeStep(1), failing]));
    assert.match(html, /class="verdict fail">Failed</);
    assert.match(html, /<b>Angular:<\/b> nothing visible to tap at #wizardNext/);
    assert.match(html, /<b>Angular:<\/b> console\.error: boom/);
    assert.match(html, /No screenshot/);
    assert.match(html, /Not compared/);
    assert.match(html, /<div class="v">1 \/ 2<\/div>/);
  });

  it('says where the collage is and how big it is', () => {
    const html = renderReport(fakeRun([fakeStep(1)], { collage: { file: 'collage.png', width: 6000, height: 5000, screens: 19 } }));
    assert.match(html, /collage\.png beside this file: 6000×5000 px \(30\.0 MP\), 19 screens/);
    assert.match(renderReport(fakeRun([fakeStep(1)], { collage: null })), /<dt>Collage<\/dt><dd>not written<\/dd>/);
  });

  it('prints the app version as a label: V239 for a legacy build, v0.239.1 for a dotted one', () => {
    assert.match(renderReport(fakeRun([fakeStep(1)])), /<div class="v">V239<\/div>/);
    assert.match(renderReport(fakeRun([fakeStep(1)], { version: '0.239.1' })), /<div class="v">v0\.239\.1<\/div>/);
  });

  it('shows the website and admin before the app, each step numbered in its band, with its full-page screenshot', () => {
    const pages = [fakePage('website', 1), fakePage('website', 2), fakePage('admin', 1)];
    const html = renderReport(fakeRun([fakeStep(1)], { pages }));
    const at = (text: string) => html.indexOf(text);
    assert.ok(at('<h2 class="band">Website') > 0 && at('<h2 class="band">Website') < at('<h2 class="band">Admin'));
    assert.ok(at('<h2 class="band">Admin') < at('<h2 class="band">App'));
    for (const label of ['#W01', '#W02', '#A01']) assert.match(html, new RegExp(`<span class="step">${label}</span>`));
    const pngs = embeddedPngs(html);
    assert.equal(pngs.length, 3 + 3, 'one image per page, then the app step\'s three');
    assert.ok(pngs[0]!.equals(pages[0]!.result.png!), 'the first image is the first website page');
    assert.deepEqual(externalRefs(html), []);
  });

  it('counts every band in the totals, and fails the run on a failed page', () => {
    const failed = fakePage('admin', 2, { ok: false, result: { status: 'fail', error: 'expected .sec-head h1 on screen', problems: ['HTTP 500 for GET http://127.0.0.1:3000/admin/api/stats'], warnings: [] } });
    const html = renderReport(fakeRun([fakeStep(1), fakeStep(2)], { pages: [fakePage('website', 1), fakePage('admin', 1), failed] }));
    assert.match(html, /<div class="v">4 \/ 5<\/div><div class="muted">website 1\/1 · admin 1\/2 · app 2\/2<\/div>/);
    assert.match(html, /class="verdict fail">Failed</);
    assert.match(html, /expected \.sec-head h1 on screen/);
    assert.match(html, /HTTP 500 for GET http:\/\/127\.0\.0\.1:3000\/admin\/api\/stats/);
  });

  it('names the collage\'s bands', () => {
    const collage = { file: 'collage.png', width: 9350, height: 25000, screens: 56, bands: [{ title: 'WEBSITE', screens: 4 }, { title: 'ADMIN', screens: 6 }, { title: 'APP', screens: 46 }] };
    assert.match(renderReport(fakeRun([fakeStep(1)], { collage })), /56 screens, in bands top to bottom: WEBSITE \(4\), ADMIN \(6\), APP \(46\)/);
  });

  it('shows a parity error in place of a percentage', () => {
    const step = fakeStep(1, { ok: false, parity: { error: 'sizes differ 786×1704 vs 786×1700' } });
    const html = renderReport(fakeRun([step]));
    assert.match(html, /<b>Parity:<\/b> sizes differ 786×1704 vs 786×1700/);
  });
});

describe('externalRefs', () => {
  const png = `data:image/png;base64,${Buffer.from(solidPng(1, 1, [0, 0, 0])).toString('base64')}`;

  it('accepts data: URIs, same-page anchors, data-* attributes and escaped text', () => {
    const html = `<img src="${png}"><a href="#step-1">x</a><div data-step="1" style="color:red">&lt;img src=&quot;x.png&quot;&gt;</div>`;
    assert.deepEqual(externalRefs(html), []);
  });

  for (const [what, html] of [
    ['an image file', '<img src="shot.png">'],
    ['an unquoted image file', '<img src=shot.png>'],
    ['a stylesheet link', '<link rel="stylesheet" href="report.css">'],
    ['a remote script', '<script src="https://cdn.example/x.js"></script>'],
    ['a link to another page', `<a href='other.html'>x</a>`],
    ['a CSS url() in a style attribute', '<div style="background:url(bg.png)"></div>'],
    ['a CSS url() in a style block', '<style>body{background:url("bg.png")}</style>'],
    ['a CSS @import', '<style>@import "fonts.css";</style>'],
  ] as const) {
    it(`flags ${what}`, () => {
      assert.equal(externalRefs(html).length, 1, html);
    });
  }
});
