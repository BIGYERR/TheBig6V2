#!/usr/bin/env python3
# V239 slice D: D234 P-ISLANDPILL R1, R2 (as re-ruled by Amendment 2, R2a-R2d) and R6 only
# (tests/measure/v239_rulings/v239_ruling_d234.md, Mario's concurrence, Amendment 2). NOT built here: R3 (tap), R4,
# R5 / Amendment 1 (intro, slice E): _rtPlayIntro, _rtIntroPending, updateRestFloat, _rtSetExpanded, rtExpand and
# _rtApplySide are untouched. No version bump (already 239), no era row.
# Contract: window.iaIsland.hasIsland === true is the pill arm, read ONCE in _rtInit, never flipped; absent or not true
# is the tab arm (the PWA's, byte-identical in behaviour). D233's clock keeps keying on plugin presence.
#
#   usage: python3 tests/edits/v239_d234_sliceD.py [<pre-slice source.html>]
#   With a source (the scratch pre_sliceD.html), the slice is rebuilt from it and written to index.html, so the
#   script reruns cleanly whatever slice D state index.html holds. With none, index.html itself must be pre-slice.
#
#   D1  C6  one CSS block after the rtPillSettle keyframes, every selector under #restFloat.rt-pill (R2b, R2c, R2d).
#           17 Pro sim, 402 pt frame (m2): cutout x 138.3..263.6, y 14..50.7; status clock ends 96.7; cellular slot
#           starts 288. Pill 180 x 43 at top 11, x 99..279 (centre = frame centre - 12: left 50%, translateX(-102px)),
#           ink fill (--accent), no border. Padding 3 each end: the clock starts x 102 (leading tail 99..138.3), the
#           12 x 12 glyph box sits x 264..276 (trailing cap 263.6..279). #rtMini 12 px, 11 px under .rt-five.
#           !important only on the properties _rtApplySide writes inline (anchor left/right, tab border/radius).
#   D2  C7  ASY_ICON_PATHS gains "timer" (stroke style, 24 viewBox). R2a: the existing stroked "pause" is reused;
#           no second pause key.
#   D3  C8  _rtInit decides the arm once (var _rtPill). Pill arm: the .rt-pill class, #rtGlyph created here and
#           APPENDED as #rtTab's last child (R2c), no _rtWireDrag, no touchmove guard, no _rtApplySide; then
#           _rtSetExpanded(false), _ruRender(). Tab arm: every line as V238.
#   D4  C9  _ruRender, pill arm only: #rtMini reads m:ss as plain text, .rt-five on when main.length >= 5 (R2d: 10:00
#           and 60:00 step to 11 px; no format change); #rtGlyph = asyIcon(timer | pause, 12): pause while stopped with
#           _ruElapsed>0, else timer; its colour follows #rtMini's .run. Tab arm: _rtStack as V238.
# Every anchor asserted count==1 on the source before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else HTML
BS = chr(92)
Q = BS + '"'    # the source's escaped quote inside the ASY_ICON_PATHS literal


def rep(label, text, old, new):
    n = text.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (label, n))
        sys.exit(1)
    if old == new:
        print('ABORT %s: replacement equals anchor; nothing written' % label)
        sys.exit(1)
    print('ok %s' % label)
    return text.replace(old, new, 1)


def counts(stage, text, table):
    for tok, want in table:
        n = text.count(tok)
        if n != want:
            print('ABORT %s %r: count %d (want %d); nothing written' % (stage, tok, n, want))
            sys.exit(1)


print('source %s' % SRC)
html = open(SRC, encoding='utf-8').read()

# ---- premise guards: the pre-slice tree (D233 slices A-C landed, no D234 token) --------------------------
counts('premise', html, (('<meta name="ia-version" content="239">', 1), ('function _ruIsland(){', 1), ('rt-pill', 0),
                         ('rtGlyph', 0), ('_rtPill', 0), ('rt-five', 0), (Q + 'timer' + Q, 0), ('"timer":', 0),
                         ('"pause":"<rect', 1), ('function _rtInit(){', 1),
                         ('_rtWireDrag(tab,true);_rtWireDrag(card,false);', 1)))

# ---- D1 CSS (C6) ------------------------------------------------------------------------------------------
KF = "@keyframes rtPillSettle{0%{transform:scale(.35) translateX(40%);opacity:0;}55%{transform:scale(1.08) translateX(0);opacity:1;}100%{transform:scale(1) translateX(0);opacity:1;}}\n"
html = rep('D1 pill CSS', html, KF, KF +
    "/* V239 (D234 R2, Amendment 2): native app, island confirmed (_rtInit adds the pill class once): the tab is an ink pill\n"
    "   around the cutout, clock in the leading tail, glyph in the trailing cap. 180x43 at top 11, centre = frame centre - 12:\n"
    "   x 99..279 on a 402 pt frame (cutout 138.3..263.6, 14..50.7; status clock ends 96.7; cellular starts 288). Clock text\n"
    "   from x 102, 12 px (11 px at five digits); glyph box 12x12 at x 264..276. Without the class nothing here applies. */\n"
    "#restFloat.rt-pill #rtAnchor{top:11px;left:50% !important;right:auto !important;transform:translateX(-102px);transition:none;}\n"
    "#restFloat.rt-pill #rtTab{flex-direction:row;justify-content:space-between;align-items:center;gap:0;width:180px;height:43px;padding:0 3px;background:var(--accent);border:none !important;border-radius:21.5px !important;cursor:default;}\n"
    "#restFloat.rt-pill #rtChev{display:none;}\n"
    "#restFloat.rt-pill #rtMini{flex-direction:row;font-size:12px;line-height:1;white-space:nowrap;}\n"
    "#restFloat.rt-pill #rtMini.rt-five{font-size:11px;}\n"
    "#restFloat.rt-pill #rtGlyph{display:flex;align-items:center;justify-content:center;flex:0 0 12px;width:12px;height:12px;color:var(--border2);}\n"
    "#restFloat.rt-pill #rtGlyph.run{color:var(--signal);}\n")

# ---- D2 icon (C7) -----------------------------------------------------------------------------------------
CLOCK = '"clock":"<circle cx=' + Q + '12' + Q + ' cy=' + Q + '12' + Q + ' r=' + Q + '10' + Q + '/><polyline points=' + Q + '12 6 12 12 16 14' + Q + '/>",'
TIMER = ('"timer":"<line x1=' + Q + '10' + Q + ' y1=' + Q + '2' + Q + ' x2=' + Q + '14' + Q + ' y2=' + Q + '2' + Q + '/>'
         '<line x1=' + Q + '12' + Q + ' y1=' + Q + '14' + Q + ' x2=' + Q + '15' + Q + ' y2=' + Q + '11' + Q + '/>'
         '<circle cx=' + Q + '12' + Q + ' cy=' + Q + '14' + Q + ' r=' + Q + '8' + Q + '/>",')
html = rep('D2 timer icon', html, CLOCK, CLOCK + TIMER)

# ---- D3 _rtInit (C8) --------------------------------------------------------------------------------------
INIT_OLD = ("function _rtInit(){\n"
            "  if(_rtInited)return;\n"
            "  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard'),anchor=document.getElementById('rtAnchor');\n"
            "  if(!tab||!card||!anchor)return;\n"
            "  _rtInited=true;\n"
            "  _rtWireDrag(tab,true);_rtWireDrag(card,false);\n")
INIT_NEW = ("// V239 (D234 R1): the arm is decided once, in _rtInit, and never flipped. window.iaIsland.hasIsland===true is the\n"
            "// pill (native app, island confirmed); absent or anything else is the tab, the PWA's. D233's clock keys on the\n"
            "// plugin's presence and this on the island flag; the two are independent.\n"
            "var _rtPill=false;\n"
            "function _rtInit(){\n"
            "  if(_rtInited)return;\n"
            "  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard'),anchor=document.getElementById('rtAnchor');\n"
            "  if(!tab||!card||!anchor)return;\n"
            "  _rtInited=true;\n"
            "  try{var _I=window.iaIsland;_rtPill=!!(_I&&_I.hasIsland===true);}catch(e){_rtPill=false;}\n"
            "  if(_rtPill){\n"
            "    // V239 (D234 R2, Amendment 2 R2c): the pill. Its glyph slot is made here and appended last (the trailing cap),\n"
            "    // so the tab arms' DOM is untouched. No drag on the pill or its card, and no _rtApplySide: it is not on a side.\n"
            "    var fr=document.getElementById('restFloat');if(fr)fr.classList.add('rt-pill');\n"
            "    var gl=document.createElement('span');gl.id='rtGlyph';gl.setAttribute('aria-hidden','true');tab.appendChild(gl);\n"
            "    _rtSetExpanded(false);_ruRender();\n"
            "    return;\n"
            "  }\n"
            "  _rtWireDrag(tab,true);_rtWireDrag(card,false);\n")
html = rep('D3 _rtInit arm', html, INIT_OLD, INIT_NEW)

# ---- D4 _ruRender (C9) ------------------------------------------------------------------------------------
MINI_OLD = "  var mini=document.getElementById('rtMini');if(mini){mini.innerHTML=_rtStack(main);mini.classList.toggle('run',_ruRunning);}\n"
MINI_NEW = ("  var mini=document.getElementById('rtMini');if(mini){mini.innerHTML=_rtPill?main:_rtStack(main);mini.classList.toggle('run',_ruRunning);if(_rtPill)mini.classList.toggle('rt-five',main.length>=5);}\n"
            "  // V239 (D234 R2, Amendment 2): the pill's trailing glyph: timer while running, pause while stopped at a nonzero\n"
            "  // value, timer at idle; muted unless running (its colour follows #rtMini's .run). Five or more clock chars: 11 px.\n"
            "  if(_rtPill){var gl=document.getElementById('rtGlyph');if(gl){var gk=(!_ruRunning&&_ruElapsed>0)?'pause':'timer';if(gl.dataset.k!==gk){gl.innerHTML=asyIcon(gk,12);gl.dataset.k=gk;}gl.classList.toggle('run',_ruRunning);}}\n")
html = rep('D4 _ruRender pill arm', html, MINI_OLD, MINI_NEW)

# ---- post guards ------------------------------------------------------------------------------------------
counts('post', html, (('_rtPill', 7), ('rt-pill', 8), ('rt-five', 2), ('asyIcon(gk,12)', 1), ('tab.appendChild(gl)', 1),
                      ('insertBefore(gl', 0), ('"timer":"<line', 1), ('"pause":"<rect', 1),
                      ('_rtWireDrag(tab,true);_rtWireDrag(card,false);', 1), ('<meta name="ia-version" content="239">', 1)))

open(HTML, 'w', encoding='utf-8').write(html)
print('WROTE %s' % HTML)
