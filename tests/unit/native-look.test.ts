// The Expo app's look against today's (D263, the Track look: frontends/app/src/legacy/src/css/look.css over the
// component sheets). Found on Mario's phone on IA Next 0.263.0 (123): the Programs tab drew its name in a condensed
// face, square buttons and no glow. Two causes, each held here.
//
// 1. Helvetica Neue has no 600 and no 800. WebKit draws both with its Bold; iOS, asked for 800, answers with Condensed
//    Black, and asked for 600 with Medium. So no style of the beta asks that face for a weight it does not have.
// 2. look.css rounds what the component sheets draw square (pills, the card, the field, the tile) and paints the glow
//    behind each tab's top bar in place of its rule. The beta's screens carry those values.
//
// Expected values are typed by hand from look.css and base.css; the second group reads the same values out of
// today's sheets, so a change to today's look turns this file red until the beta follows.
//
// Five tests here guard what must not change, and so pass on the release before this one too: the three on today's
// sheets, the two styles on the system face naming no face, and no weight written in a form the scan cannot read.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { REPO } from '../support/app.ts';

const NATIVE = join(REPO, 'frontends', 'native', 'src');
const CSS = join(REPO, 'frontends', 'app', 'src', 'legacy', 'src', 'css');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []);
}
const read = (file: string): string => readFileSync(join(NATIVE, file), 'utf8');
/** One style of a file's StyleSheet, as written: the text between its braces. */
function style(file: string, name: string): string {
  const m = new RegExp('^\\s*' + name + ': \\{([^}]*)\\},?$', 'm').exec(read(file));
  assert.ok(m, file + ' has no style named ' + name);
  return m[1]!;
}
const has = (file: string, name: string, part: string): void => {
  const s = style(file, name);
  assert.ok(s.split(',').map((x) => x.trim()).includes(part), file + ' ' + name + ' should hold ' + part + ', holds: ' + s.trim());
};
const lacks = (file: string, name: string, key: string): void => {
  assert.ok(!new RegExp('\\b' + key + ':').test(style(file, name)), file + ' ' + name + ' should not set ' + key);
};

/** Every declaration today's sheets make for a class, in file order (comments stripped first). */
function declared(cls: string): string {
  const out: string[] = [];
  for (const f of readdirSync(CSS).filter((x) => x.endsWith('.css')).sort()) {
    const css = readFileSync(join(CSS, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (m[1]!.split(',').some((s) => new RegExp('(^|[^\\w-])\\.' + cls + '$').test(s.trim()))) out.push(m[2]!.trim());
    }
  }
  return out.join(' ');
}
const rootVar = (name: string): string => {
  const m = new RegExp('--' + name + ':([^;]+);').exec(readFileSync(join(CSS, 'base.css'), 'utf8'));
  assert.ok(m, 'base.css has no --' + name);
  return m[1]!.trim();
};

describe('native look: no weight Helvetica Neue does not have', () => {
  // The two that ask the system face, which has both weights: the backup screen's key name and the Bugs placeholder.
  const SYSTEM_FACE = new Set(['BackupLoad.tsx|600', 'App.tsx|800']);
  // Helvetica Neue has a Light, and today's sheet asks it for the colon between a minutes field and a seconds field (font-weight:300, the wizard's cardio goals): two styles.
  const LIGHT = ['wizard/Wizard.tsx|300', 'wizard/Wizard.tsx|300'];

  test('every font weight in the app is 400, 500 or 700, but for two styles on the system face', () => {
    const files = sources(NATIVE);
    assert.ok(files.length > 40, 'the walk found the app\'s files: ' + files.length);
    const odd: string[] = [];
    let seen = 0;
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/fontWeight: '(\d+)'/g)) {
        seen++;
        if (!['400', '500', '700'].includes(m[1]!)) odd.push(f.slice(NATIVE.length + 1) + '|' + m[1]);
      }
    }
    assert.ok(seen > 200, 'the scan read the app\'s weights: ' + seen);
    assert.deepEqual(odd.filter((x) => !SYSTEM_FACE.has(x)), LIGHT);
    assert.deepEqual(odd.sort(), [...SYSTEM_FACE, ...LIGHT].sort());
    const colons = readFileSync(NATIVE + '/wizard/Wizard.tsx', 'utf8');
    assert.ok(colons.includes("  colonBig: { fontFamily: TEXT, fontSize: 24, lineHeight: 31, fontWeight: '300', paddingBottom: 14 },") && colons.includes("  colon: { fontFamily: TEXT, fontSize: 20, lineHeight: 26, fontWeight: '300' },"), 'the two are the colons');
  });

  test('the two on the system face name no face', () => {
    lacks('BackupLoad.tsx', 'keyName', 'fontFamily');
    lacks('App.tsx', 'title', 'fontFamily');
  });

  test('no weight is written as a number or a word, which the scan would not read', () => {
    for (const f of sources(NATIVE)) {
      const text = readFileSync(f, 'utf8');
      assert.ok(!/fontWeight: (\d|'bold'|'normal'|"|`)/.test(text), f.slice(NATIVE.length + 1));
    }
  });
});

describe('native look: today\'s sheets still say what the beta copies', () => {
  test('the four radii', () => {
    assert.equal(rootVar('r-card'), '24px');
    assert.equal(rootVar('r-pill'), '999px');
    assert.equal(rootVar('r-field'), '12px');
    assert.equal(rootVar('r-tile'), '16px');
  });

  test('which shapes are pills, which the card, the field and the tile', () => {
    for (const cls of ['prog-action-btn', 'new-prog-btn', 'prog-card-badge', 'lift-chip', 'copy-icon-btn', 'back-btn']) {
      assert.match(declared(cls), /border-radius:var\(--r-pill\)/, cls);
    }
    assert.match(declared('prog-card'), /border-radius:var\(--r-card\)/);
    assert.match(declared('input-field'), /border-radius:var\(--r-field\)/);
    assert.match(declared('goal-option'), /border-radius:var\(--r-tile\)/);
  });

  test('the top bar: a 15 overline at 600, a 40 name at 800 set 0.04em tight, the glow and no rule', () => {
    const look = readFileSync(join(CSS, 'look.css'), 'utf8');
    assert.ok(look.includes('.top-bar .app-title{font-size:15px;font-weight:600;color:var(--muted);}'));
    assert.ok(look.includes('.top-bar .app-subtitle{font-size:40px;font-weight:800;letter-spacing:-0.04em;line-height:1.05;color:var(--text);margin-top:2px;}'));
    assert.ok(look.includes('#screenHome .top-bar,#screenProgress .top-bar,#screenBugs .top-bar,.wk-topbar{background:var(--glow-light) no-repeat,var(--bg);border-bottom:none;}'));
    assert.ok(look.includes('.prog-card-badge,.det-label,'), 'the badge and the detail\'s labels are in the 12px list');
  });
});

describe('native look: the Programs tab', () => {
  const F = 'program-list/Programs.tsx';

  test('its top bar: both lines at 700, the name 40 and 1.6 tight, the glow drawn and no rule', () => {
    has(F, 'app', "fontWeight: '700'");
    has(F, 'app', 'fontSize: 15');
    has(F, 'screen', "fontWeight: '700'");
    has(F, 'screen', 'fontSize: 40');
    has(F, 'screen', 'letterSpacing: -1.6');
    has(F, 'screen', 'lineHeight: 42');
    lacks(F, 'top', 'borderBottomWidth');
    const text = read(F);
    assert.equal(text.split('<Glow ').length - 1, 2, 'the glow behind the bar and behind the top of the list');
    assert.ok(!text.includes('borderBottomColor: p.border }]}>\n        <Text style={[s.app'), 'no rule under the bar');
  });

  test('the card is the card\'s radius; its buttons, badge, chips and copy button are pills; its rename box the field\'s', () => {
    has(F, 'card', 'borderRadius: 24');
    for (const name of ['action', 'badge', 'chip', 'copy', 'build']) has(F, name, 'borderRadius: 999');
    has(F, 'renameInput', 'borderRadius: 12');
  });

  test('the badge and the detail\'s labels are 12', () => {
    has(F, 'badgeText', 'fontSize: 12');
    has(F, 'groupLabel', 'fontSize: 12');
  });

  // Measured on Mario's phone, today's 0.263.0: the card 158 tall, its buttons 32, Build New Program 53, the top bar
  // 142. Those are WebKit's lines, 1.34 times the size where the CSS names no height: 20 at 15, 27 at 20, 16 at 12,
  // 12 at 9. iOS's own are 17.9, 23.9, 14.3 and 10.7, so each takes the rest under it.
  test('a line whose height the CSS leaves to the face is WebKit\'s height: iOS\'s own and the rest under it', () => {
    has(F, 'app', 'paddingBottom: 2.1');
    has(F, 'buildText', 'paddingBottom: 2.1');
    has(F, 'name', 'paddingBottom: 3.1');
    for (const name of ['badgeText', 'meta', 'actionText', 'groupLabel']) has(F, name, 'paddingBottom: 1.7');
    for (const name of ['chipK', 'chipU']) has(F, name, 'paddingBottom: 1.3');
    for (const name of ['app', 'buildText', 'name', 'badgeText', 'meta', 'actionText', 'groupLabel', 'chipK', 'chipU']) lacks(F, name, 'lineHeight');
    has('App.tsx', 'tabLabel', 'paddingBottom: 1.7');
    lacks('App.tsx', 'tabLabel', 'lineHeight');
  });

  test('the screen\'s name sits 2.9 lower in its line, and the bar keeps its 142', () => {
    has(F, 'screen', 'marginTop: 4.9');
    has(F, 'screen', 'marginBottom: -2.9');
    has(F, 'top', 'paddingBottom: 16');
  });

  test('Build New Program sits at the screen\'s foot: the list grows, the button keeps today\'s margins', () => {
    has(F, 'body', 'flexGrow: 1');
    has(F, 'list', 'flexGrow: 1');
    has(F, 'list', 'paddingVertical: 16');
    has(F, 'list', 'paddingHorizontal: 20');
    has(F, 'list', 'gap: 10');
    has(F, 'build', 'marginHorizontal: 20');
    has(F, 'build', 'marginBottom: 20');
    has(F, 'build', 'borderWidth: 1.5');
    has(F, 'build', 'padding: 15');
    const text = read(F);
    const list = text.indexOf('<View style={s.list}>'), cards = text.indexOf('{v.cards.map('), build = text.indexOf('testID="build-new"');
    assert.ok(list > 0 && list < cards && cards < build, 'the cards are inside the list and the button after it');
    assert.ok(text.includes('paddingBottom: 96 + insets.bottom'), 'the tab bar\'s room is today\'s 96');
  });
});

describe('native look: the rest day sheet and the coach\'s mile nudge', () => {
  const F = 'rest-sheet/RestSheet.tsx', N = 'mile-nudge/MileNudge.tsx';

  test('today\'s sheets still say what the rest sheet copies: the frame\'s column, the 13s, the pills, the fields', () => {
    assert.match(declared('rand-body'), /padding:20px;display:flex;flex-direction:column;gap:16px;padding-bottom:60px;/);
    const look = readFileSync(join(CSS, 'look.css'), 'utf8');
    assert.match(look, /\.ov-kicker,\.ov-eq-lbl,[^{]*\{font-size:13px;font-weight:600;letter-spacing:0;\}/);
    for (const cls of ['ov-apply', 'ov-clear', 'rd-chip']) assert.match(declared(cls), /border-radius:var\(--r-pill\)/, cls);
    for (const cls of ['ov-eq', 'rd-input']) assert.match(declared(cls), /border-radius:var\(--r-field\)/, cls);
    assert.match(declared('ov-title'), /font-size:24px;font-weight:700;letter-spacing:-0\.01em;line-height:1\.1;margin-top:4px;/);
    assert.match(declared('ov-intro'), /font-size:13px;color:var\(--muted\);line-height:1\.5;margin-top:6px;margin-bottom:18px;/);
    assert.match(declared('ov-effect'), /border-top:1px solid var\(--border\);padding-top:14px;margin-top:12px;margin-bottom:16px;/);
    assert.match(declared('iaw-solo'), /max-width:178\.2px;/);
  });

  test('the rest sheet: 16 between its pieces, the head, the 13s at 700, the row, the note', () => {
    has(F, 'body', 'gap: 16');
    for (const name of ['kicker', 'label', 'effectTtl', 'clearText']) { has(F, name, 'fontSize: 13'); has(F, name, "fontWeight: '700'"); has(F, name, 'paddingBottom: 1.5'); lacks(F, name, 'lineHeight'); }
    // WebKit lays a line whose height the CSS sets at whole points (measured in the simulator's Safari): 26.4 is 26, 19.5 is 19.
    for (const part of ['fontSize: 24', "fontWeight: '700'", 'letterSpacing: -0.24', 'lineHeight: 26', 'marginTop: 4', 'marginBottom: -1.4']) has(F, 'title', part);
    for (const part of ['fontSize: 13', 'lineHeight: 19', 'marginTop: 6', 'marginBottom: 18']) has(F, 'intro', part);
    has(F, 'label', 'marginBottom: 7'); has(F, 'labelGap', 'marginTop: 14');
    for (const part of ['borderWidth: 1', 'borderRadius: 12', 'padding: 12', 'marginBottom: 6', 'gap: 10']) has(F, 'eq', part);
    for (const part of ['fontSize: 14', "fontWeight: '500'", 'paddingBottom: 2.3']) has(F, 'eqName', part);
    for (const part of ['fontSize: 12', 'marginTop: 2', 'paddingBottom: 1.7']) has(F, 'eqDesc', part);
    for (const part of ['borderTopWidth: 1', 'paddingTop: 14', 'marginTop: 12', 'marginBottom: 16']) has(F, 'effect', part);
    for (const part of ['fontSize: 12', 'lineHeight: 18']) has(F, 'effectSub', part);
    has(F, 'effectTtl', 'marginBottom: 2.3');
  });

  test('the rest sheet: its buttons and chips are pills, its box the field\'s, its wheels no wider than today\'s', () => {
    for (const name of ['apply', 'clear', 'chip', 'wide']) has(F, name, 'borderRadius: 999');
    has(F, 'apply', 'padding: 15'); has(F, 'applyText', 'fontSize: 14'); has(F, 'applyText', 'paddingBottom: 2.3');
    has(F, 'clear', 'padding: 13'); has(F, 'clear', 'marginTop: 10'); has(F, 'clear', 'borderWidth: 1');
    for (const part of ['flex: 1', 'paddingVertical: 11', 'paddingHorizontal: 4', 'borderWidth: 1']) has(F, 'chip', part);
    for (const part of ['fontSize: 12', "fontWeight: '700'", 'paddingBottom: 1.7']) has(F, 'chipText', part);
    for (const part of ['paddingVertical: 11', 'paddingHorizontal: 12', 'marginBottom: 6']) has(F, 'wide', part);
    for (const part of ['fontSize: 13', "fontWeight: '400'"]) has(F, 'wideText', part);
    has(F, 'wideHead', "fontWeight: '700'");
    for (const part of ['fontSize: 11', 'opacity: 0.7', 'marginTop: 2']) has(F, 'wideDesc', part);
    for (const part of ['fontSize: 16', "fontWeight: '700'", 'paddingVertical: 11', 'paddingHorizontal: 12', 'borderRadius: 12']) has(F, 'input', part);
    has(F, 'row', 'gap: 5');
    has(F, 'wheelWrap', 'maxWidth: 178.2'); has(F, 'wheelWrap', 'gap: 12');
    // A wheel's caption is look.css's 12, on the rest sheet and on the cardio card alike, and a sheet's Back keeps WebKit's line.
    assert.match(readFileSync(join(CSS, 'look.css'), 'utf8'), /\.core-header,\.iaw-cap,[^{]*\{font-size:12px;letter-spacing:0;\}/);
    for (const part of ['fontSize: 12', "fontWeight: '700'", 'paddingBottom: 1.7', 'marginBottom: 5']) has('day-detail/Wheel.tsx', 'cap', part);
    for (const part of ['fontSize: 14', 'paddingBottom: 2.3']) has('program-list/SheetFrame.tsx', 'backText', part);
  });

  test('today\'s nudge sheet still says what the beta copies', () => {
    const css = readFileSync(join(REPO, 'frontends/app/src/app/screens/mile-nudge/mile-nudge.css'), 'utf8');
    for (const rule of ['.mn-scrim{position:absolute;inset:0;background:rgba(0,0,0,0.42);animation:mnFade .24s ease both;}',
      'border-radius:var(--r-card) var(--r-card) 0 0;padding:24px 20px calc(18px + env(safe-area-inset-bottom,0px));',
      'animation:mnRise .36s cubic-bezier(.2,.8,.2,1) both;}',
      '.mn-lbl{font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--signal);}',
      '.mn-title{font-family:var(--font-display);font-size:28px;font-weight:800;letter-spacing:-0.02em;line-height:1.05;}',
      '.mn-body{margin:4px 0 6px;font-size:15px;line-height:1.45;color:var(--text);}',
      '.mn-sheet .tw-btn{width:100%;margin-top:4px;}']) assert.ok(css.includes(rule), rule);
    assert.match(css, /\.mn-sheet\{position:relative;display:flex;flex-direction:column;gap:8px;background:var\(--surface\);/);
  });

  test('the nudge: a sheet from the foot, the card\'s corners on top, its label, its name, its words, This Week\'s two buttons', () => {
    for (const part of ['gap: 8', 'borderTopLeftRadius: 24', 'borderTopRightRadius: 24', 'paddingTop: 24', 'paddingHorizontal: 20']) has(N, 'sheet', part);
    for (const part of ['fontSize: 13', "fontWeight: '700'", 'letterSpacing: 0.78', "textTransform: 'uppercase'"]) has(N, 'label', part);
    for (const part of ['fontSize: 28', "fontWeight: '700'", 'letterSpacing: -0.56', 'lineHeight: 29']) has(N, 'title', part);
    for (const part of ['fontSize: 15', 'lineHeight: 21', 'marginTop: 4', 'marginBottom: 6']) has(N, 'body', part);
    for (const part of ['marginTop: 4', 'height: 48', 'borderRadius: 24', 'borderWidth: 1.5']) has(N, 'btn', part);
    for (const part of ['height: 56', 'borderRadius: 28', 'borderWidth: 0']) has(N, 'glow', part);
    has(N, 'btnText', 'fontSize: 16'); has(N, 'glowText', 'fontSize: 19');
    assert.ok(read(N).includes('paddingBottom: 18 + insets.bottom'));
    assert.ok(read(N).includes("scrim: { backgroundColor: 'rgba(0,0,0,0.42)' }"));
  });
});

describe('native look: Progress and the two sheets', () => {
  test('Progress\'s top bar is the Programs tab\'s', () => {
    const F = 'progress/Progress.tsx';
    for (const name of ['app', 'screen']) assert.equal(style(F, name), style('program-list/Programs.tsx', name), name);
    lacks(F, 'top', 'borderBottomWidth');
    assert.equal(read(F).split('<Glow ').length - 1, 2);
  });

  test('Progress\'s buttons are pills and its box the field\'s', () => {
    has('progress/Progress.tsx', 'action', 'borderRadius: 999');
    has('progress/Progress.tsx', 'input', 'borderRadius: 12');
  });

  test('the goal sheet: tiles, the field, pills', () => {
    has('goal-sheet/GoalSheet.tsx', 'option', 'borderRadius: 16');
    has('goal-sheet/GoalSheet.tsx', 'input', 'borderRadius: 12');
    has('goal-sheet/GoalSheet.tsx', 'btn', 'borderRadius: 999');
  });

  test('the mile pencil: the field, pills', () => {
    has('mile-sheet/MileSheet.tsx', 'input', 'borderRadius: 12');
    has('mile-sheet/MileSheet.tsx', 'btn', 'borderRadius: 999');
  });

  test('a sheet\'s Back is a pill', () => {
    has('program-list/SheetFrame.tsx', 'back', 'borderRadius: 999');
  });
});
