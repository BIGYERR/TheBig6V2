import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { restSmoke, runSmoke } from './smoke.mjs';
// The boards go to out/project (gitignored), or to DECK_OUT/project.
const OUT = (process.env.DECK_OUT || 'out') + '/project/';
mkdirSync(OUT, { recursive: true });
const T = readFileSync('deck.template.html', 'utf8');
const D = JSON.parse(readFileSync('week10.json', 'utf8'));
const B = [['M', 'AD_Week10Mon.dc.html', 'The Half Manny, week 10 Monday'], ['T', 'AE_Week10Tue.dc.html', 'The Half Manny, week 10 Tuesday'], ['W', 'AG_Week10Wed.dc.html', 'The Half Manny, week 10 Wednesday'], ['H', 'AF_Week10Thu.dc.html', 'The Half Manny, week 10 Thursday'], ['F', 'AH_Week10Fri.dc.html', 'The Half Manny, week 10 Friday'], ['S', 'AI_Week10Sat.dc.html', 'The Half Manny, week 10 Saturday'], ['U', 'AJ_Week10Sun.dc.html', 'The Half Manny, week 10 Sunday']];
for (const [k, file, title] of B) {
  const d = D[k]; d.head.key = k.toLowerCase();
  const html = T.replace('__TITLE__', title).replace('__DATA__', JSON.stringify(d));
  writeFileSync(OUT + file, html);
  // smoke: run the logic class with a stub runtime over every card and the main actions
  const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const WIN = { matchMedia: () => ({ matches: true }) };
  const Cls = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', js + '\nreturn Component;')(
    class { constructor(p) { this.props = p; } setState(s) { this.state = Object.assign({}, this.state, typeof s === 'function' ? s(this.state) : s); } },
    WIN, (f) => { f(); return 0; }, () => {});
  const c = new Cls({ look: 'auto', vertical: false });
  let n = 0;
  for (let i = 0; i < d.cards.length; i++) {
    c.setState({ i }); let v = c.renderVals(); n++;
    if (v.c.canSwap) { v.c.swap(); v = c.renderVals(); if (v.sw.t1.length) v.sw.t1[0].pick(); else if (v.sw.t2.length) v.sw.t2[0].pick(); v = c.renderVals(); n++; if (v.c.hasFrom) { v.c.unswap(); n++; } }
    v = c.renderVals();
    if (v.c.hasMembers) {
      v.c.members.forEach((_, k) => {
        let w = c.renderVals(); const m = w.c.members[k]; if (!m.hasLog) { m.tick(); n++; return; }
        m.toggle(); w = c.renderVals(); const mm = w.c.members[k]; if (!mm.isOpen) throw new Error(k + ' drawer did not open');
        if (mm.hasLast) mm.fill();
        w = c.renderVals(); w.c.members[k].rows.forEach((r, j) => { let z = c.renderVals(); const rr = z.c.members[k].rows[j]; if (rr.typed) rr.setR({ target: { value: '6' } }); else rr.rUp(); z = c.renderVals(); z.c.members[k].rows[j].log(); });
        w = c.renderVals(); if (!w.c.members[k].allOn) throw new Error('movement ' + k + ' not all logged');
        n++;
      });
      v = c.renderVals(); if (!v.c.done) throw new Error(k + ' card ' + i + ' not logged after every movement');
      c.setState({ done: {}, msets: Object.assign({}, c.state.msets, { [i]: c.state.msets[i].map((sets) => sets.map((x) => Object.assign({}, x, { on: false }))) }) });
    }
    v = c.renderVals();
    if (v.c.hasMembers) { const m = v.c.members[0]; if (m.canSwap) { m.swap(); let w = c.renderVals(); (w.sw.t1[0] || w.sw.t2[0] || { pick() {} }).pick(); } v = c.renderVals(); v.c.members[0].out(); v = c.renderVals(); n++; if (v.c.members[0].isOut) v.c.members[0].back(); }
    v = c.renderVals();
    if (v.c.showSets) { v.toggle(); v = c.renderVals(); v.fillAll(); v = c.renderVals(); v.rows.forEach((r) => r.log()); v = c.renderVals(); n++; }
    if (v.c.canCant) { v.openCant(); v = c.renderVals(); v.toMove(); v = c.renderVals(); v.days[d.week.length > 2 ? 2 : d.week.findIndex((w) => w.tone !== 'off')].pick(); v = c.renderVals(); v.applyMove(); v = c.renderVals(); n++; if (!v.c.isMoved) throw new Error(k + ' move did not land'); v.unmove(); }
    v = c.renderVals();
    if (v.c.canSkip || v.c.canAll) { v.c.skip(); v = c.renderVals(); if (!v.c.dead) throw new Error(k + ' skip did not land on card ' + i); v.c.unskip(); n++; }
    v = c.renderVals(); v.flip(); v = c.renderVals(); v.openMap(); v = c.renderVals(); v.tiles[0].go(); c.renderVals(); n++;
  }
  // mid-swipe preview, both ways and both orientations
  if (d.cards.length > 2) for (const vert of [false, true]) for (const dd of [-60, 60, -200]) {
    c.setState({ i: 1, vert, drag: true, dx: vert ? 0 : dd, dy: vert ? dd : 0 });
    const pv = c.renderVals();
    if (!pv.peekOn) throw new Error(k + ' no peek mid-swipe');
    const want = String(((1 + (dd < 0 ? 1 : -1)) + d.cards.length) % d.cards.length + 1).padStart(2, '0');
    if (pv.peek.num !== want) throw new Error(k + ' peek shows ' + pv.peek.num + ' not ' + want);
    n++;
  }
  c.setState({ drag: false, dx: 0, dy: 0, vert: false }); if (c.renderVals().peekOn) throw new Error(k + ' peek stays after release');
  // the run comes first on HALF MANNY; the toggle; the vertical pager follows the finger and the wheel
  if (d.runIdx >= 0 && d.runIdx !== 0) throw new Error(k + ' run is not first');
  if (d.cards.length > 2) { const fake = (x, y) => ({ clientX: x, clientY: y, target: { closest: () => null } });
    c.setState({ i: 0, vert: false, anim: null, sheet: null, skip: {}, moved: null });
    let v = c.renderVals(); v.setVert(); v = c.renderVals();
    if (!v.vert || v.vertPressed !== 'true' || v.ghosts.length !== 0) throw new Error(k + ' toggle to up and down');
    v.onDown(fake(100, 400)); c.renderVals().onMove(fake(100, 280)); v = c.renderVals();
    if (!v.peekOn || v.peek.num !== '02' || v.pv.c.num !== '02' || (d.cards[1].chips.length > 0 && !v.pv.c.chips.length) || v.pv.c.title !== d.cards[1].title) throw new Error(k + ' the next card is not drawn in full');
    v.onUp(); v = c.renderVals(); if (c.state.i !== 1) throw new Error(k + ' pager did not move to card 2');
    v.onDown(fake(100, 300)); c.renderVals().onMove(fake(100, 420)); c.renderVals().onUp(); if (c.state.i !== 0) throw new Error(k + ' pager did not come back');
    v = c.renderVals(); v.onDown(fake(100, 300)); c.renderVals().onMove(fake(100, 260)); c.renderVals().onUp(); if (c.state.i !== 0) throw new Error(k + ' a short drag moved the pager');
    v = c.renderVals(); v.onWheel({ deltaY: 70, deltaX: 0, target: { closest: () => null } }); if (c.state.i !== 1) throw new Error(k + ' wheel did not page');
    v = c.renderVals(); v.setSide(); v = c.renderVals(); if (v.vert || v.sidePressed !== 'true') throw new Error(k + ' toggle back');
    v.onWheel({ deltaY: 0, deltaX: 80, target: { closest: () => null } }); if (c.state.i !== 2) throw new Error(k + ' sideways wheel did not page');
    n += 6; }
  // the done motion: a lift with a glow in the card's colour, then the exit and the next card rising
  if (d.cards.length > 2) { c.setState({ i: 1, vert: false, done: {}, skip: {}, moved: null, doneAnim: { phase: 'lift', glow: true } });
    let v = c.renderVals();
    if (!/scale\(1\.03\)/.test(v.cardStyle) || !/0 0 42px 8px rgba\(/.test(v.cardStyle)) throw new Error(k + ' no lift or glow');
    c.setState({ doneAnim: { phase: 'leave' } }); v = c.renderVals();
    if (!/deckTuck/.test(v.cardStyle) || !v.peekOn || !/peekRise/.test(v.peekStyle) || v.peek.num !== '03') throw new Error(k + ' sideways exit');
    c.setState({ vert: true }); v = c.renderVals();
    if (!/pagerLeave/.test(v.cardStyle) || !/pagerRise/.test(v.peekStyle)) throw new Error(k + ' pager exit');
    c.setState({ vert: false, doneAnim: null, i: 1 }); v = c.renderVals(); v.advance();
    if (c.state.i !== 2 || !c.state.done[1] || c.state.doneAnim) throw new Error(k + ' advance did not land');
    n += 4; }
  // the load row: typing cascades into untouched sets, the last-time pill fills the box, Fill every set overwrites all
  for (let i = 0; i < d.cards.length; i++) {
    const cd0 = d.cards[i];
    c.setState({ i, done: {}, skip: {}, moved: null, sheet: null, open: false, mopen: {}, load: {}, mload: {}, names: {},
      sets: Object.assign({}, c.state.sets, cd0.sets ? { [i]: cd0.sets.map(() => ({ w: '', r: null, on: false })) } : {}),
      msets: Object.assign({}, c.state.msets, cd0.members ? { [i]: cd0.members.map((m) => c.fresh(m.log)) } : {}),
      members: Object.assign({}, c.state.members, cd0.members ? { [i]: cd0.members.map((m) => ({ name: m.name, from: null, out: false, tick: false })) } : {}) });
    let v = c.renderVals();
    if (v.c.showSets && v.c.hasLoad) {
      v.toggle(); v = c.renderVals();
      v.setLoad({ target: { value: '100' } }); v = c.renderVals();
      if (!v.rows.every((r) => r.w === '100')) throw new Error(k + ' load did not cascade on card ' + i);
      v.rows[0].setW({ target: { value: '120' } }); v = c.renderVals(); v.setLoad({ target: { value: '110' } }); v = c.renderVals();
      if (v.rows[0].w !== '120' || !v.rows.slice(1).every((r) => r.w === '110')) throw new Error(k + ' a typed set was overwritten on card ' + i);
      if (v.c.hasLast) { v.reuseLast(); v = c.renderVals(); if (v.loadVal !== String(d.cards[i].last)) throw new Error('reuse'); v.fillAll(); v = c.renderVals(); if (!v.rows.every((r) => r.w === String(d.cards[i].last))) throw new Error('fill'); }
      n++;
    }
    if (v.c.hasMembers) v.c.members.forEach((m, k2) => {
      if (!m.hasLoad) return;
      let w = c.renderVals(); w.c.members[k2].toggle(); w = c.renderVals();
      w.c.members[k2].setLoad({ target: { value: '50' } }); w = c.renderVals();
      if (!w.c.members[k2].rows.every((r) => r.w === '50')) throw new Error(k + ' member load did not cascade');
      if (w.c.members[k2].hasLast) { w.c.members[k2].reuseLast(); w = c.renderVals(); if (w.c.members[k2].loadVal !== String(d.cards[i].members[k2].log.last)) throw new Error('member reuse'); }
      n++;
    });
  }
  // no toasts on skip, take out, put back; the RPE i opens its sheet with the card's own number
  let said = 0; const say0 = c.say.bind(c); c.say = (t) => { said++; say0(t); };
  for (let i = 0; i < d.cards.length; i++) {
    c.setState({ i, done: {}, skip: {}, moved: null, sheet: null });
    let v = c.renderVals();
    if (v.c.hasRpe) { const want = +(String(d.cards[i].rx).match(/RPE\s*(\d+)/) || [])[1]; v.c.openRpe(); v = c.renderVals(); if (!v.isRpeSheet || v.rpeN !== want) throw new Error(k + ' RPE i on card ' + i + ' shows ' + v.rpeN); if (v.rpeRows.filter((r) => /signal/.test(r.style)).length !== 1) throw new Error('not exactly one band lit'); if (v.hasSheet) throw new Error('rpe opened the bottom sheet'); if (!/rpeWarpIn|transform-origin/.test(v.rpeBubble)) throw new Error('no warp'); v.closeRpe(); v = c.renderVals(); if (v.isRpeSheet) throw new Error('bubble stayed'); n++; }
    if (v.c.hasMembers) { v.c.members.forEach((m) => { if (m.hasRpe) { m.openRpe(); const w = c.renderVals(); if (!w.isRpeSheet) throw new Error(k + ' member RPE'); w.closeRpe(); n++; } }); v = c.renderVals(); }
    const before = said;
    if (v.c.canSkip || v.c.canAll) { v.c.skip(); v = c.renderVals(); if (v.c.chips[0].t !== 'Skipped') throw new Error('skipped pill'); v.c.unskip(); v = c.renderVals(); }
    if (v.c.hasMembers && v.c.members.length > 1) { v.c.members[0].out(); v = c.renderVals(); if (!v.c.members[0].isOut) throw new Error('out'); v.c.members[0].back(); v = c.renderVals(); }
    if (said !== before) throw new Error(k + ' a skip or put back raised a toast on card ' + i);
  }
  c.say = say0;
  c.setState({ i: d.cards.length - 1 }); let v = c.renderVals(); v.advance(); v = c.renderVals();
  const runSaid = restSmoke(c, d, k, WIN) || runSmoke(c, d, k, WIN); v = c.renderVals();
  console.log(k, file, html.length, runSaid + ',', 'bytes,', d.cards.length, 'cards,', n, 'renders ok, last CTA:', v.ctaText);
}
