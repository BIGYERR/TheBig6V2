'use strict';
// g0.239.1_timer_label.js: GATE for D235 P-TIMERDRAG and D236 P-SEMVERLABEL (v0.239.1, PATCH, both Mario's).
//
//   node tests/gates/g0.239.1_timer_label.js <candidate.html>
//
// THE RULING THIS DEFENDS: tests/measure/v0.239.1_rulings/v0.239.1_ruling_d235_d236.md, D235 items 1 and 2, D236 items
// 1 and 2, and its "After" section: "Bug-report page: BUILD v0.239.1. Report context: build: v0.239.1. On a body
// relabelled to the legacy 239: BUILD v0.239.0, never v239. A tap with under 5 px of jitter leaves the timer where it
// was docked. A drag that iOS cancels docks to the nearer edge."
// Sabotage: tests/sabotage/v0.239.1.json, each mutation naming the row here it trips.
//
// ORACLES. Never the engine.
// D236. The candidate's own rows expect 'BUILD v' + SV.str(meta) and 'build: v' + SV.str(meta), where SV is
// tests/semver.js reading the candidate's meta (an independent reader, never the app's helper): 0.239.1 gives
// 'BUILD v0.239.1'. The relabelled rows expect strings typed by hand: the candidate body with its meta rewritten to 239
// reads 'BUILD v0.239.0' and 'build: v0.239.0' (the legacy rule, integer N is 0.N.0) and never v239; rewritten to
// v0.239.1 it reads 'BUILD v0.239.1' and 'build: v0.239.1' and never vv.
// D235. Hand geometry, typed out below and self-checked: the frame (#restFloat) is 375 px wide at left 0 (the 375 px of
// the ruling's evidence); window.innerHeight 852; the anchor (#rtAnchor) is 40 x 60 and sits at top 300 until a move
// writes top. The anchor's offsetLeft follows its style as a browser lays it out: a px left reads as written, left '0'
// reads 0, right '0' reads 375 - 40 = 335. Every write to the anchor's style is logged.
//   jitter: down (355, 330), moves (358, 332) and (352, 328), up: |dx| <= 3 and |dy| <= 2, under the 5 px threshold.
//   case A (tab, docked right): down (355, 330), move (100, 340): top = clamp(8, 852 - 60 - 8 = 784, 300 + 10) = 310 px,
//     left = clamp(0, 375 - 40 = 335, 100 - 0 - 20) = 80 px. Cancel: centre 80 + 20 = 100 < 375 / 2 = 187.5, so left:
//     the left writes after the cancel are '' then '0', right 'auto', top stays 310 px.
//   case B (card, docked left after A): down (20, 400), move (300, 395): top = clamp(8, 784, 310 - 5) = 305 px,
//     left = clamp(0, 335, 300 - 20) = 280 px. Cancel: centre 280 + 20 = 300 >= 187.5, so right: the left writes after
//     the cancel are '' then 'auto', right '0', top stays 305 px.
//   The snap transition, typed by hand: 'left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)'.
//
// SEAMS (the real ones). The page script boots through tests/harness.js load(); a pre-boot hook (g239's: wrap
// vm.runInContext for exactly the one call carrying the harness's globalThis.__IA shim) gives the document a retaining
// getElementById and a retaining addEventListener before the script runs, so init() writes #bugVersion where the gate
// can read it. The report context is read off submitBug()'s real fetch body (a stub fetch records it). D235 wires the
// real _rtInit() (so _rtWireDrag(tab,true) and _rtWireDrag(card,false)) onto handle stubs that keep every listener and
// run it, and fires pointer events on them; the touchmove guard _rtInit registers on the document is run too.
// harness.js is not edited.
//
// VERSION PREDICATE (standing rulings 2 and 4). D235 and D236 ship at ia-version 0.239.1, read from the candidate's
// meta through tests/semver.js cmp.
//   below 0.239.1      REFUSED: every row runs and carries a failing version conjunct, so every row FAILS by name.
//   0.239.1 and up     every row asserts (a minimum, never one exact version).
//
// ROWS
//   D236-label       the bug-report page label (#bugVersion after boot) is 'BUILD v' + SV.str(meta).
//   D236-context     the report context (submitBug's message) has exactly one build line, 'build: v' + SV.str(meta).
//   D236-legacy      the candidate body relabelled 239: label 'BUILD v0.239.0', build line 'build: v0.239.0', no v239.
//   D236-vprefix     the candidate body relabelled v0.239.1: label 'BUILD v0.239.1', build line 'build: v0.239.1', no vv.
//   D235-jitter      a 3 px jitter tap writes neither top nor left (nor right) on the tab or the card; the tab tap still
//                    expands; the card tap still collapses during the intro and does nothing outside it.
//   D235-cancel      a drag past 5 px that ends in pointercancel docks to the nearer edge by the hand arithmetic (A left,
//                    B right), restores the snap transition, runs no tap action and clears the drag (the touchmove
//                    guard stops preventing); a jitter that ends in pointercancel writes nothing and runs no tap action.
//   D235-idlecancel  a pointercancel outside a drag (after a drag docked by pointerup) writes nothing to the anchor,
//                    keeps the side, and only clears the flag.

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const H = require(path.join(__dirname, '..', 'harness.js'));
const SV = require(path.join(__dirname, '..', 'semver.js'));
const S = require(path.join(__dirname, '..', 'status'))('g0.239.1_timer_label');

const ROOT = path.join(__dirname, '..', '..');
const ART = process.argv[2] || path.join(ROOT, 'index.html');
const ERA = '0.239.1';
const J = JSON.stringify;

const LABEL = {
  'D236-label':      'D236-label (ia-version >= 0.239.1) the bug-report page label reads BUILD v plus the canonical M.m.p of the meta (BUILD v0.239.1 at 0.239.1)',
  'D236-context':    'D236-context (ia-version >= 0.239.1) the report context has exactly one build line, build: v plus the canonical M.m.p of the meta',
  'D236-legacy':     'D236-legacy (ia-version >= 0.239.1) the body relabelled 239 reads BUILD v0.239.0 and build: v0.239.0, never v239',
  'D236-vprefix':    'D236-vprefix (ia-version >= 0.239.1) the body relabelled v0.239.1 reads BUILD v0.239.1 and build: v0.239.1, never vv',
  'D235-jitter':     'D235-jitter (ia-version >= 0.239.1) a 3 px jitter tap on the tab or the card writes neither top nor left; the tab tap expands, the card tap collapses only during the intro',
  'D235-cancel':     'D235-cancel (ia-version >= 0.239.1) a cancelled drag docks to the nearer edge (A left at x 80, B right at x 280), restores the snap transition, runs no tap action; a cancelled jitter writes nothing',
  'D235-idlecancel': 'D235-idlecancel (ia-version >= 0.239.1) a pointercancel outside a drag writes nothing to the anchor, keeps the side and only clears the flag',
};
const IDS = Object.keys(LABEL);
S.declare(IDS);

// ── hand oracles ─────────────────────────────────────────────────────────────────────────────────────────────────────
const LEGACY_LABEL = 'BUILD v0.239.0', LEGACY_BUILD = 'build: v0.239.0';
const VPFX_LABEL = 'BUILD v0.239.1', VPFX_BUILD = 'build: v0.239.1';
const FW = 375, FL = 0, IH = 852, AW = 40, AH = 60, TOP0 = 300;
const A_TOP = '310px', A_LEFT = '80px', A_SIDE = 'left', A_LEFTW = ['', '0'];
const B_TOP0 = 310, B_TOP = '305px', B_LEFT = '280px', B_SIDE = 'right', B_LEFTW = ['', 'auto'];
const SNAP_TR = 'left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';
{ // the arithmetic, typed out (never the engine's handler)
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v)), maxT = IH - AH - 8, maxL = FW - AW;
  const ok = maxT === 784 && maxL === 335
    && clamp(8, maxT, TOP0 + (340 - 330)) + 'px' === A_TOP && clamp(0, maxL, 100 - FL - AW / 2) + 'px' === A_LEFT && 80 + AW / 2 < FW / 2
    && clamp(8, maxT, B_TOP0 + (395 - 400)) + 'px' === B_TOP && clamp(0, maxL, 300 - FL - AW / 2) + 'px' === B_LEFT && !(280 + AW / 2 < FW / 2)
    && Math.abs(358 - 355) < 5 && Math.abs(332 - 330) < 5 && Math.abs(352 - 355) < 5 && Math.abs(328 - 330) < 5
    && Math.abs(303 - 300) < 5 && Math.abs(401 - 400) < 5 && Math.abs(297 - 300) < 5 && Math.abs(404 - 400) < 5
    && Math.abs(100 - 355) > 5 && Math.abs(300 - 20) > 5;
  if(!ok) throw new Error('hand oracle self-check');
}

// ── version, read from the candidate's meta ──────────────────────────────────────────────────────────────────────────
const HTML = fs.readFileSync(ART, 'utf8');
let VER;
try { VER = SV.fromHtml(HTML); } catch(e){ VER = SV.parse(0); S.info('the candidate meta does not read as a version (' + e.message + '); read as 0'); }
const verOk = SV.cmp(VER, ERA) >= 0;
const verCj = () => ['ver', verOk, 'ia-version ' + SV.tag(VER) + (verOk ? ' >= ' : ' < ') + SV.tag(ERA)];
S.info('g0.239.1 D235 P-TIMERDRAG and D236 P-SEMVERLABEL | candidate ' + ART + ' ia-version ' + SV.tag(VER));
if(!verOk) S.info('REFUSED: ia-version ' + SV.tag(VER) + ' predates D235 and D236 (' + SV.tag(ERA) + '). Every row runs and FAILS by its version conjunct.');

// ── boot with a retaining document (pre-boot hook) ───────────────────────────────────────────────────────────────────
function boot(file){
  const els = {}, docL = {};
  const orig = vm.runInContext;
  vm.runInContext = function(code, ctx, o){
    if(typeof code === 'string' && code.indexOf('globalThis.__IA') >= 0){
      vm.runInContext = orig;
      const doc = ctx.document, mkDiv = doc.getElementById;
      doc.getElementById = id => els[id] || (els[id] = Object.assign(mkDiv.call(doc, id), { id }));
      doc.addEventListener = (t, fn) => { if(typeof fn === 'function') (docL[t] = docL[t] || []).push(fn); };
    }
    return orig.call(vm, code, ctx, o);
  };
  try {
    const IA = H.load(file);
    return { IA, els, docL, ctx:IA.ctx, ev:IA.eval, err:null };
  } catch(e){ return { err:String(e && e.message || e) }; } finally { vm.runInContext = orig; }
}

// the report context: submitBug() with a recording fetch; returns the posted message
async function reportMessage(B){
  const calls = [];
  B.ctx.fetch = (url, o) => { calls.push({ url, body:o && o.body }); return Promise.resolve({ ok:false, status:0, json:() => Promise.resolve({}), text:() => Promise.resolve('') }); };
  B.ctx.document.getElementById('bugText').value = 'gate probe';
  await B.ev('submitBug()');
  if(calls.length !== 1) throw new Error('submitBug posted ' + calls.length + ' times (hand 1)');
  return String(JSON.parse(calls[0].body).message);
}
const buildLines = msg => msg.split('\n').filter(l => /^build:/.test(l));

// the candidate body with its meta rewritten (a scratch copy; the version predicate stays the candidate's)
let TMP = '';
function relabel(content){
  const n = (HTML.match(/<meta name="ia-version" content="[^"]*"/g) || []).length;
  if(n !== 1) throw new Error('the candidate carries ' + n + ' ia-version metas (want 1)');
  if(!TMP) TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'g0.239.1-'));
  const f = path.join(TMP, 'relabel_' + content.replace(/[^A-Za-z0-9.]/g, '_') + '.html');
  fs.writeFileSync(f, HTML.replace(/<meta name="ia-version" content="[^"]*"/, '<meta name="ia-version" content="' + content + '"'));
  return f;
}

// ── D235 stubs: handles that keep every listener and run it, a logging anchor, the frame ─────────────────────────────
function mkHandle(id){
  const lis = {};
  const h = { id, style:{}, dataset:{}, innerHTML:'', textContent:'', lis,
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(t, fn){ if(typeof fn === 'function') (lis[t] = lis[t] || []).push(fn); }, removeEventListener(){},
    setPointerCapture(){}, releasePointerCapture(){}, querySelector(){ return null; }, closest(){ return null; } };
  return h;
}
function fire(h, type, x, y){
  const e = { type, clientX:x, clientY:y, pointerId:1, cancelable:true, prevented:0, preventDefault(){ this.prevented++; },
    target:{ closest(){ return null; } }, currentTarget:h };
  const fns = h.lis[type] || [];
  fns.forEach(f => f.call(h, e));
  return fns.length;
}
function mkAnchor(){
  const raw = {}, log = [];
  const style = new Proxy(raw, { set(o, k, v){ log.push([String(k), String(v)]); o[k] = v; return true; } });
  return { id:'rtAnchor', style, raw, log, offsetWidth:AW, offsetHeight:AH,
    get offsetTop(){ return /px$/.test(raw.top || '') ? parseFloat(raw.top) : TOP0; },
    get offsetLeft(){ return /px$/.test(raw.left || '') ? parseFloat(raw.left) : raw.left === '0' ? 0 : raw.right === '0' ? FW - AW : 0; },
    classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, addEventListener(){}, removeEventListener(){},
    getBoundingClientRect(){ return { top:0, left:0, width:AW, height:AH, right:AW, bottom:AH }; } };
}
function mkFrame(){
  return { id:'restFloat', style:{ display:'block' }, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    addEventListener(){}, removeEventListener(){},
    getBoundingClientRect(){ return { top:0, left:FL, width:FW, height:IH, right:FL + FW, bottom:IH, x:FL, y:0 }; } };
}
// wire the real _rtInit onto fresh stubs, docked right, collapsed, no intro, no drag
function rig(B){
  const tab = mkHandle('rtTab'), card = mkHandle('rtCard'), anchor = mkAnchor(), frame = mkFrame();
  Object.assign(B.els, { rtTab:tab, rtCard:card, rtAnchor:anchor, restFloat:frame });
  B.ctx.innerHeight = IH;
  B.docL.touchmove = [];
  B.ev("_rtInited=false;_rtSide='right';_rtExpanded=false;_rtIntroTO=null;_rtDragging=false;_rtInit();");
  const ev = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'];
  const wired = [tab, card].every(h => ev.every(t => (h.lis[t] || []).length === 1)) && B.docL.touchmove.length === 1;
  return { tab, card, anchor, wired, lisCount:J([tab, card].map(h => ev.map(t => (h.lis[t] || []).length))) + ' touchmove ' + B.docL.touchmove.length };
}
const st = a => ({ top:a.raw.top, left:a.raw.left, right:a.raw.right, transition:a.raw.transition });
const writes = (a, from, keys) => a.log.slice(from).filter(w => !keys || keys.indexOf(w[0]) >= 0);
const guard = B => { let p = 0; (B.docL.touchmove || []).forEach(f => { const e = { cancelable:true, preventDefault(){ p++; } }; f(e); }); return p; };

// ── rows ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
async function row(id, fn){
  let cj;
  try { cj = await fn(); } catch(e){ cj = [['crash', false, String(e && e.stack || e).split('\n').slice(0, 2).join(' | ')]]; }
  cj.unshift(verCj());
  const bad = cj.filter(c => !c[1]);
  for(const c of cj) if(!c[1]) S.info(id + ' ' + c[0] + ': ' + c[2]);
  S.check(id, bad.length === 0, LABEL[id], bad.map(c => c[0]).join(', ') + (bad.length ? ' failed (INFO lines above)' : ''));
}
const booted = (B, what) => B && !B.err ? null : [['boot', false, what + ' did not boot: ' + (B ? B.err : 'not loaded')]];

async function main(){
  const B0 = boot(ART);
  if(B0.err) S.info('boot failed: ' + B0.err);
  const canon = SV.str(VER);

  await row('D236-label', async () => {
    const no = booted(B0, 'the candidate'); if(no) return no;
    const got = B0.els.bugVersion ? B0.els.bugVersion.textContent : undefined;
    return [['label', got === 'BUILD v' + canon, '#bugVersion ' + J(got) + ' (hand ' + J('BUILD v' + canon) + ', SV.str of the meta)']];
  });

  await row('D236-context', async () => {
    const no = booted(B0, 'the candidate'); if(no) return no;
    const bl = buildLines(await reportMessage(B0));
    return [['build', J(bl) === J(['build: v' + canon]), 'build lines ' + J(bl) + ' (hand ' + J(['build: v' + canon]) + ')']];
  });

  for(const [id, content, wantLabel, wantBuild, banned] of [['D236-legacy', '239', LEGACY_LABEL, LEGACY_BUILD, /v239/i], ['D236-vprefix', 'v0.239.1', VPFX_LABEL, VPFX_BUILD, /vv/i]]){
    await row(id, async () => {
      const f = relabel(content), cj = [];
      cj.push(['relabel', SV.cmp(SV.fromHtml(fs.readFileSync(f, 'utf8')), content) === 0, 'the scratch meta reads ' + SV.str(SV.fromHtml(fs.readFileSync(f, 'utf8'))) + ' (hand ' + content + ')']);
      const B = boot(f), no = booted(B, 'the body relabelled ' + content); if(no) return cj.concat(no);
      const got = B.els.bugVersion ? B.els.bugVersion.textContent : undefined;
      cj.push(['label', got === wantLabel && !banned.test(got), '#bugVersion ' + J(got) + ' (hand ' + J(wantLabel) + ', never ' + banned.source + ')']);
      const bl = buildLines(await reportMessage(B));
      cj.push(['build', J(bl) === J([wantBuild]) && !bl.some(l => banned.test(l)), 'build lines ' + J(bl) + ' (hand ' + J([wantBuild]) + ', never ' + banned.source + ')']);
      return cj;
    });
  }

  await row('D235-jitter', async () => {
    const no = booted(B0, 'the candidate'); if(no) return no;
    const R = rig(B0), cj = [], ev = B0.ev, TLR = ['top', 'left', 'right'];
    cj.push(['wired', R.wired, 'listeners [tab, card] x [down, move, up, cancel] ' + R.lisCount + ' (hand all 1)']);
    const docked = st(R.anchor);
    cj.push(['docked', docked.left === 'auto' && docked.right === '0' && docked.top === undefined, 'after _rtInit ' + J(docked) + ' (hand left auto, right 0, no top)']);
    // tab: 3 px jitter, then up
    let m = R.anchor.log.length;
    fire(R.tab, 'pointerdown', 355, 330); fire(R.tab, 'pointermove', 358, 332); fire(R.tab, 'pointermove', 352, 328);
    const midW = writes(R.anchor, m, TLR);
    fire(R.tab, 'pointerup', 352, 328);
    const tabW = writes(R.anchor, m, TLR), tabSt = st(R.anchor);
    cj.push(['tab-still', midW.length === 0 && tabW.length === 0 && tabSt.left === 'auto' && tabSt.right === '0' && tabSt.top === undefined,
      'writes ' + J(tabW) + ' state ' + J(tabSt) + ' (hand none: left auto, right 0, no top)']);
    cj.push(['tab-expands', ev('_rtExpanded') === true && ev('_rtDragging') === false, '_rtExpanded ' + ev('_rtExpanded') + ' _rtDragging ' + ev('_rtDragging') + ' (hand true, false)']);
    // card during the intro: a jitter tap collapses
    ev('_rtIntroTO=424242;');
    m = R.anchor.log.length;
    fire(R.card, 'pointerdown', 300, 400); fire(R.card, 'pointermove', 303, 401); fire(R.card, 'pointerup', 303, 401);
    let cw = writes(R.anchor, m, TLR);
    cj.push(['card-intro', cw.length === 0 && ev('_rtExpanded') === false && ev('_rtIntroTO') === null,
      'writes ' + J(cw) + ' _rtExpanded ' + ev('_rtExpanded') + ' _rtIntroTO ' + ev('_rtIntroTO') + ' (hand none, false, null)']);
    // card outside the intro: a jitter tap does nothing
    ev('_rtSetExpanded(true);');
    m = R.anchor.log.length;
    fire(R.card, 'pointerdown', 300, 400); fire(R.card, 'pointermove', 297, 404); fire(R.card, 'pointerup', 297, 404);
    cw = writes(R.anchor, m, TLR);
    const cSt = st(R.anchor);
    cj.push(['card-still', cw.length === 0 && ev('_rtExpanded') === true && cSt.left === 'auto' && cSt.right === '0' && cSt.top === undefined,
      'writes ' + J(cw) + ' _rtExpanded ' + ev('_rtExpanded') + ' state ' + J(cSt) + ' (hand none, true, left auto, right 0)']);
    return cj;
  });

  await row('D235-cancel', async () => {
    const no = booted(B0, 'the candidate'); if(no) return no;
    const R = rig(B0), cj = [], ev = B0.ev;
    cj.push(['wired', R.wired, 'listeners ' + R.lisCount + ' (hand all 1)']);
    // A: the tab, docked right, dragged to x 100 and cancelled
    fire(R.tab, 'pointerdown', 355, 330); fire(R.tab, 'pointermove', 100, 340);
    const aMid = st(R.anchor), aGuard = guard(B0);
    cj.push(['A-moved', aMid.top === A_TOP && aMid.left === A_LEFT && aMid.right === 'auto' && aMid.transition === 'none',
      'mid-drag ' + J(aMid) + ' (hand top ' + A_TOP + ', left ' + A_LEFT + ', right auto, transition none)']);
    let m = R.anchor.log.length;
    const nA = fire(R.tab, 'pointercancel', 100, 340);
    const aSt = st(R.anchor), aLW = writes(R.anchor, m, ['left']).map(w => w[1]);
    cj.push(['A-dock', nA === 1 && ev('_rtSide') === A_SIDE && J(aLW) === J(A_LEFTW) && aSt.left === '0' && aSt.right === 'auto' && aSt.top === A_TOP && aSt.transition === SNAP_TR,
      '_rtSide ' + ev('_rtSide') + ' left writes ' + J(aLW) + ' state ' + J(aSt) + ' (hand left, ["","0"], left 0, right auto, top ' + A_TOP + ', snap transition)']);
    const aGuard2 = guard(B0);
    cj.push(['A-notap', ev('_rtExpanded') === false && ev('_rtDragging') === false && aGuard === 1 && aGuard2 === 0,
      '_rtExpanded ' + ev('_rtExpanded') + ' _rtDragging ' + ev('_rtDragging') + ' touchmove prevented mid-drag ' + aGuard + ', after ' + aGuard2 + ' (hand false, false, 1, 0)']);
    // B: the card, docked left after A, dragged to x 300 and cancelled
    fire(R.card, 'pointerdown', 20, 400); fire(R.card, 'pointermove', 300, 395);
    const bMid = st(R.anchor);
    cj.push(['B-moved', bMid.top === B_TOP && bMid.left === B_LEFT && bMid.right === 'auto',
      'mid-drag ' + J(bMid) + ' (hand top ' + B_TOP + ', left ' + B_LEFT + ', right auto)']);
    m = R.anchor.log.length;
    fire(R.card, 'pointercancel', 300, 395);
    const bSt = st(R.anchor), bLW = writes(R.anchor, m, ['left']).map(w => w[1]);
    cj.push(['B-dock', ev('_rtSide') === B_SIDE && J(bLW) === J(B_LEFTW) && bSt.left === 'auto' && bSt.right === '0' && bSt.top === B_TOP && bSt.transition === SNAP_TR && ev('_rtDragging') === false,
      '_rtSide ' + ev('_rtSide') + ' left writes ' + J(bLW) + ' state ' + J(bSt) + ' _rtDragging ' + ev('_rtDragging') + ' (hand right, ["","auto"], left auto, right 0, top ' + B_TOP + ', snap transition, false)']);
    // C: the tab, a 3 px jitter that ends in pointercancel: nothing written, no tap action
    m = R.anchor.log.length;
    fire(R.tab, 'pointerdown', 355, 330); fire(R.tab, 'pointermove', 358, 332); fire(R.tab, 'pointercancel', 358, 332);
    const cW = writes(R.anchor, m, ['top', 'left', 'right']);
    cj.push(['C-jitter', cW.length === 0 && ev('_rtSide') === B_SIDE && ev('_rtExpanded') === false && ev('_rtDragging') === false,
      'writes ' + J(cW) + ' _rtSide ' + ev('_rtSide') + ' _rtExpanded ' + ev('_rtExpanded') + ' _rtDragging ' + ev('_rtDragging') + ' (hand none, right, false, false)']);
    return cj;
  });

  await row('D235-idlecancel', async () => {
    const no = booted(B0, 'the candidate'); if(no) return no;
    const R = rig(B0), cj = [], ev = B0.ev;
    cj.push(['wired', R.wired, 'listeners ' + R.lisCount + ' (hand all 1)']);
    // a drag ended by pointerup: docks left (case A's arithmetic) and never expands
    fire(R.tab, 'pointerdown', 355, 330); fire(R.tab, 'pointermove', 100, 340); fire(R.tab, 'pointerup', 100, 340);
    const uSt = st(R.anchor);
    cj.push(['drag-up', ev('_rtSide') === A_SIDE && uSt.left === '0' && uSt.right === 'auto' && ev('_rtExpanded') === false,
      '_rtSide ' + ev('_rtSide') + ' state ' + J(uSt) + ' _rtExpanded ' + ev('_rtExpanded') + ' (hand left, left 0, right auto, false)']);
    // then a cancel with no drag in flight, on the tab and on the card, with a stale flag
    const m = R.anchor.log.length;
    ev('_rtDragging=true;');
    const n1 = fire(R.tab, 'pointercancel', 100, 340), n2 = fire(R.card, 'pointercancel', 100, 340);
    const w = writes(R.anchor, m), iSt = st(R.anchor);
    cj.push(['still', n1 === 1 && n2 === 1 && w.length === 0 && ev('_rtSide') === A_SIDE && iSt.left === '0' && iSt.right === 'auto',
      'cancels heard ' + n1 + ',' + n2 + ' anchor writes ' + J(w) + ' _rtSide ' + ev('_rtSide') + ' (hand 1,1, none, left)']);
    cj.push(['flag', ev('_rtDragging') === false && ev('_rtExpanded') === false,
      '_rtDragging ' + ev('_rtDragging') + ' _rtExpanded ' + ev('_rtExpanded') + ' (hand false, false)']);
    return cj;
  });
}

main().catch(e => S.info('main threw: ' + String(e && e.stack || e).split('\n').slice(0, 2).join(' | '))).finally(() => {
  try { if(TMP) fs.rmSync(TMP, { recursive:true, force:true }); } catch(e){}
  S.summary();
});
