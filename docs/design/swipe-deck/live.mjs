// Builds the deck as a component This Week can open (the "all together" board on the This Week canvas): the same
// template as the seven week 10 boards, with the day passed in, a back button, the progress handed back as it changes,
// and Mark the day done reported to This Week. Also writes every day of HALF_MANNY's 14 weeks as one data file, run
// cards dropped (D272 item 7), for This Week to load and pass in.
// Usage, from docs/design/swipe-deck (after: node deck-data.ts out/half-manny-decks-raw.json <all 98 days>):
//   node live.mjs [out/half-manny-decks-raw.json]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const OUT = (process.env.DECK_OUT || 'out') + '/';
mkdirSync(OUT + 'project', { recursive: true });
const T = readFileSync('deck.template.html', 'utf8');
const W10 = JSON.parse(readFileSync('week10.json', 'utf8'));

// A day's deck without its run card, as build.mjs builds the boards.
const noRun = (d) => { const x = JSON.parse(JSON.stringify(d)); if (x.runIdx >= 0) { x.cards = x.cards.filter((c) => c.kind !== 'run'); x.runIdx = -1; x.runWord = ''; x.week = []; } return x; };

const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('patch point found ' + n + ' times: ' + a.slice(0, 60)); return s.replace(a, () => b); };
let h = T.replace('__TITLE__', 'The deck, opened from This Week').replace('__DATA__', JSON.stringify(noRun(W10.F)));
// The day comes in as a value; the deck's own week 10 Friday stays the default so the board renders alone.
h = once(h, '    return ' + JSON.stringify(noRun(W10.F)) + ';', '    return this.props.day || ' + JSON.stringify(noRun(W10.F)) + ';');
// Progress handed back in comes back as the starting state, so leaving and reopening a deck keeps its place.
h = once(h, '    this.state = {\n      i: 0,', '    this.state = props.saved ? props.saved : {\n      i: 0,');
h = once(h, '  fresh(log) {', '  componentDidUpdate(pp, ps) { if (ps !== this.state && this.props.onState) this.props.onState(this.state); }\n  fresh(log) {');
// Mark the day done closes the deck and tells This Week.
h = once(h, "if (!st.dayDone) { this.setState({ dayDone: true }); this.say(H.title + ' is done. Streak holds.'); } return;",
  "if (!st.dayDone) { this.setState({ dayDone: true }); this.say(H.title + ' is done. Streak holds.'); } if (this.props.onDone) this.props.onDone(); return;");
// A back button to This Week, and This Week's own orange.
h = once(h, '    <div style="min-width: 0;">\n      <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; padding-top: 6px;">{{dayTitle}}</div>',
  '    <div style="min-width: 0; display: flex; align-items: center; gap: 4px;">\n      <sc-if value="{{hasBack}}" hint-placeholder-val="{{false}}"><button type="button" onClick="{{goBack}}" aria-label="Back to This Week" style="width: 40px; height: 44px; margin-left: -10px; border: 0; background: transparent; color: var(--text); display: flex; align-items: center; justify-content: center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></button></sc-if>\n      <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; padding-top: 6px;">{{dayTitle}}</div>');
h = once(h, '<div class="ia" data-look="{{look}}" style="position: relative;', '<div class="ia" data-look="{{look}}" style="{{sigVar}}position: relative;');
h = once(h, '      ctaText: c.kind', "      hasBack: !!this.props.onBack, goBack: () => { if (this.props.onBack) this.props.onBack(); },\n      sigVar: /^#[0-9a-f]{6}$/i.test(String(this.props.signal || '')) ? '--signal:' + this.props.signal + ';--signal-rgb:' + [1, 3, 5].map((k) => parseInt(this.props.signal.slice(k, k + 2), 16)).join(',') + ';' : '',\n      ctaText: c.kind");
h = once(h, "data-props='{\"look\"", "data-props='{\"day\":{\"editor\":null},\"saved\":{\"editor\":null},\"onState\":{\"editor\":null},\"onDone\":{\"editor\":null},\"onBack\":{\"editor\":null},\"signal\":{\"editor\":null},\"look\"");
writeFileSync(OUT + 'project/DeckLive.dc.html', h);

// Every day of the 14 weeks, keyed as This Week keys them: '<week>-<day>', day 0 Monday to 6 Sunday.
const DK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const raw = JSON.parse(readFileSync(process.argv[2] || OUT + 'half-manny-decks-raw.json', 'utf8'));
const decks = {};
for (let w = 1; w <= 14; w++) DK.forEach((d, i) => { const b = raw['w' + w + d]; if (!b) throw new Error('missing w' + w + d); decks[w + '-' + i] = noRun(b); });
writeFileSync(OUT + 'half-manny-decks.json', JSON.stringify(decks));

// Smoke: the component renders every card of every day, Mark the day done reports, the back button shows only with a
// handler, and the orange comes through.
const js = h.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
const WIN = { matchMedia: () => ({ matches: true }) };
const Cls = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', js + '\nreturn Component;')(
  class { constructor(p) { this.props = p; } setState(s) { this.state = Object.assign({}, this.state, typeof s === 'function' ? s(this.state) : s); } },
  WIN, (f) => { f(); return 0; }, () => {});
let renders = 0, days = 0;
for (const [k, d] of Object.entries(decks)) {
  if (d.cards.some((c) => c.kind === 'run')) throw new Error(k + ' still has a run card');
  let doneCalls = 0, backCalls = 0;
  const c = new Cls({ day: d, look: 'night', signal: '#F26A1C', onDone: () => { doneCalls++; }, onBack: () => { backCalls++; } });
  for (let i = 0; i < d.cards.length; i++) { c.setState({ i }); const v = c.renderVals(); renders++; if (v.dayTitle == null) throw new Error(k + ' card ' + i + ' has no title'); }
  const v0 = c.renderVals();
  if (!v0.hasBack || !/--signal:#F26A1C;--signal-rgb:242,106,28;/.test(v0.sigVar)) throw new Error(k + ' back button or orange missing');
  v0.goBack(); if (backCalls !== 1) throw new Error(k + ' back did not report');
  if (d.cards[d.cards.length - 1].kind === 'finish') {
    c.setState({ i: d.cards.length - 1 }); c.renderVals().advance();
    if (doneCalls !== 1 || !c.state.dayDone) throw new Error(k + ' Mark the day done did not report');
  }
  const saved = c.state, c2 = new Cls({ day: d, saved, look: 'night' });
  if (c2.state !== saved || c2.renderVals().hasBack) throw new Error(k + ' saved state or back without a handler');
  days++;
}
const alone = new Cls({ look: 'night' }).renderVals();
if (alone.hasBack || alone.dayTitle !== 'Recovery Lift') throw new Error('the board alone should be week 10 Friday with no back button');
console.log('DeckLive.dc.html', h.length, 'chars;', days, 'days,', renders, 'card renders ok; half-manny-decks.json', JSON.stringify(decks).length, 'chars');
