import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOURNEYS } from '../../e2e/flow.ts';
import { DESKTOP, EXPECTED_STATUS, PAGE_JOURNEYS, PHONE } from '../../e2e/pages.ts';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('e2e JOURNEYS', () => {
  it('gives every journey a unique kebab-case id, a name and at least one step', () => {
    const ids = JOURNEYS.map((j) => j.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate journey id in ${ids.join(', ')}`);
    for (const j of JOURNEYS) {
      assert.match(j.id, KEBAB);
      assert.ok(j.name.trim().length > 0, `${j.id} has a name`);
      assert.ok(j.steps.length > 0, `${j.id} has steps`);
    }
  });

  it('gives every step a unique kebab-case id across all journeys (ids anchor the report and label the collage)', () => {
    const ids = JOURNEYS.flatMap((j) => j.steps.map((s) => s.id));
    assert.equal(new Set(ids).size, ids.length, `duplicate step id in ${ids.join(', ')}`);
    for (const id of ids) assert.match(id, KEBAB);
  });

  it('gives every step a distinct page label', () => {
    const pages = JOURNEYS.flatMap((j) => j.steps.map((s) => s.page.trim()));
    assert.ok(pages.every((p) => p.length > 0));
    assert.equal(new Set(pages).size, pages.length);
  });

  it('starts the first journey on the empty Programs screen, as a first launch does', () => {
    assert.equal(JOURNEYS[0]?.steps[0]?.id, 'home-empty');
  });
});

describe('e2e PAGE_JOURNEYS (the website and the admin)', () => {
  const every = [...PAGE_JOURNEYS, ...JOURNEYS];

  it('gives every journey and every step an id unique across the whole suite, app included (ids anchor the report)', () => {
    const journeys = every.map((j) => j.id);
    assert.equal(new Set(journeys).size, journeys.length, `duplicate journey id in ${journeys.join(', ')}`);
    const steps = every.flatMap((j) => j.steps.map((s) => s.id));
    assert.equal(new Set(steps).size, steps.length, `duplicate step id in ${steps.join(', ')}`);
    for (const id of [...journeys, ...steps]) assert.match(id, KEBAB);
    const pages = every.flatMap((j) => j.steps.map((s) => s.page.trim()));
    assert.equal(new Set(pages).size, pages.length);
  });

  it('runs the website before the admin, so the bands number and read in collage order', () => {
    const bands = PAGE_JOURNEYS.map((j) => j.band);
    assert.deepEqual([...new Set(bands)], ['website', 'admin']);
    assert.ok(bands.lastIndexOf('website') < bands.indexOf('admin'));
  });

  it('takes the website home at a desktop and at the app journeys\' phone width, then each same-host page it links to', () => {
    const site = PAGE_JOURNEYS.filter((j) => j.band === 'website');
    assert.ok(site.some((j) => j.viewport === DESKTOP && j.steps.some((s) => s.id === 'site-home-desktop')));
    const phone = site.find((j) => j.viewport === PHONE);
    assert.deepEqual(phone?.steps.map((s) => s.id), ['site-home-phone', 'site-staff-login', 'site-open-app']);
    assert.equal(DESKTOP.width, 1440);
    assert.deepEqual([PHONE.width, PHONE.height], [393, 852]);
    // Every same-host link on the site is covered: /admin/ (Staff Login) and /app/ (the app buttons).
    const html = readFileSync(join(REPO, 'frontends', 'website', 'site.html'), 'utf8');
    const ts = readFileSync(join(REPO, 'frontends', 'website', 'site.ts'), 'utf8');
    const hosts = new Set([...html.matchAll(/\shref="(\/[^"#]*)"/g)].map((m) => m[1]!));
    if (/\[href\]="appUrl"/.test(html)) hosts.add(/const APP_URL = '([^']+)'/.exec(ts)?.[1] ?? 'APP_URL not found');
    assert.deepEqual([...hosts].sort(), ['/admin/', '/app/']);
  });

  it('opens every admin section the admin defines, after the login and before signing out', () => {
    const src = readFileSync(join(REPO, 'frontends', 'admin', 'admin.ts'), 'utf8');
    const sections = [...src.matchAll(/\{ id: '([a-z]+)', label: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(sections.length >= 4, `found the sections in admin.ts: ${sections.join(', ')}`);
    const admin = PAGE_JOURNEYS.find((j) => j.band === 'admin');
    assert.equal(admin?.viewport, DESKTOP);
    assert.deepEqual(admin?.steps.map((s) => s.id), ['admin-login', ...sections.map((id) => `admin-${id}`), 'admin-logged-out']);
  });

  it('expects one error status only: the admin asking who is signed in before anyone is', () => {
    assert.equal(EXPECTED_STATUS('http://127.0.0.1:3000/admin/api/me', 401), true);
    assert.equal(EXPECTED_STATUS('http://127.0.0.1:3000/admin/api/stats', 401), false);
    assert.equal(EXPECTED_STATUS('http://127.0.0.1:3000/admin/api/me', 500), false);
    assert.equal(EXPECTED_STATUS('http://127.0.0.1:3000/favicon.ico', 404), false);
  });
});
