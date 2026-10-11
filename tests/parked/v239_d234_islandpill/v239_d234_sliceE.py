#!/usr/bin/env python3
# V239 slice E: D234 R3 (tap) and Amendment 1 (R5a-R5c, the pill intro), tests/measure/v239_rulings/v239_ruling_d234.md.
# R4 needs no code (z 240 unchanged). NOT here: R5b's card-body tap listener in the pill arm (slice F, with the gate and
# spec). _rtPlayIntro, rtCardIntro, rtPillSettle, _rtApplySide and _rtWireDrag are untouched; the tab arms (PWA and
# native without the island) behave byte-identically.
#
#   usage: python3 tests/edits/v239_d234_sliceE.py [<pre-slice source.html>]
#   With a source (the scratch pre_sliceE.html) the slice is rebuilt from it into index.html, so the script reruns
#   cleanly whatever slice E state index.html holds. With none, index.html itself must be pre-slice.
#
#   E1  C10  CSS after the C6 pill block, all under #restFloat.rt-pill. R3: the card hangs centred beneath the pill
#            (absolute, top = the pill's lower edge + 6, left 50% - 98 for its 196 width), all corners rounded, full
#            border, no nub (it would draw above the card's top edge). R5a: transform-origin top centre; two NEW
#            keyframes: rtPillDrop (scaleY 0 -> 1 from the top edge with one 6 px downward overshoot; no rotation, no
#            horizontal travel; scaleY from the top origin and a downward-only translate draw no pixel above the pill's
#            lower edge) and rtPillEcho (scale 1 -> 1.08 -> 1, never below 1, opacity untouched).
#   E2  C11  R3: _rtSetExpanded keeps the pill displayed while the card is open (pill arm only); rtExpand toggles in the
#            pill arm (open, then a second tap closes through rtCollapse, as the › button does). The pill's tap is a
#            click listener added in _rtInit's pill branch (dismiss the intro, then rtExpand): the only rtExpand caller
#            today is _rtWireDrag's pointerup, which the pill arm does not wire. No outside-tap close.
#   E3  C12  _rtPlayPillIntro, beside _rtPlayIntro (R5a, R5c): the card drops at 0.3 s (0.6 s drop, at rest by 0.9 s,
#            inside the 2.2 s mark), the fold starts at 2.2 s (rtPillDrop reversed in 0.34 s), then the card closes and
#            the pill echoes 0.34 s, cleared at the 420 ms cleanup. _rtIntroTO holds the 2.2 s timeout, then the fold's,
#            and is null once the card is closed. Under _wkReduceMotion(): no animation; the card shows at 0.3 s and
#            closes at 2.2 s, both timeouts held in _rtIntroTO; no echo.
#   E4  C13  updateRestFloat: _rtIntroPending consumed as today, then the pill arm runs _rtPlayPillIntro and returns;
#            the tab arms run the V238 lines.
# Every anchor asserted count==1 on the source before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else HTML


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

# ---- premise guards: slice D landed (amended), no slice E token -----------------------------------------
counts('premise', html, (('<meta name="ia-version" content="239">', 1), ('var _rtPill=false;', 1), ('rt-five', 2),
                         ('rtPillDrop', 0), ('rtPillEcho', 0), ('_rtPlayPillIntro', 0), ('function _rtPlayIntro(){', 1),
                         ('function _wkReduceMotion(){', 1), ('rtExpand()', 2)))

# ---- E1 CSS (C10) -----------------------------------------------------------------------------------------
GLYPH_RUN = "#restFloat.rt-pill #rtGlyph.run{color:var(--signal);}\n"
html = rep('E1 card hang + keyframes', html, GLYPH_RUN, GLYPH_RUN +
    "/* V239 (D234 R3, Amendment 1 R5a): the card hangs centred beneath the pill, 6 below its lower edge, all corners rounded,\n"
    "   no side treatment and no nub. It unfolds from its top edge: scaleY from the top origin plus a downward-only overshoot\n"
    "   never draws above the pill. The fold is rtPillDrop reversed; the echo never scales the pill below 1. */\n"
    "#restFloat.rt-pill #rtCard{position:absolute;top:calc(100% + 6px);left:50%;margin-left:-98px;border:2px solid var(--signal) !important;border-radius:12px !important;transform-origin:top center;cursor:default;}\n"
    "#restFloat.rt-pill #rtNub{display:none;}\n"
    "@keyframes rtPillDrop{0%{transform:scaleY(0) translateY(0);}60%{transform:scaleY(1) translateY(6px);}100%{transform:scaleY(1) translateY(0);}}\n"
    "@keyframes rtPillEcho{0%{transform:scale(1);}55%{transform:scale(1.08);}100%{transform:scale(1);}}\n")

# ---- E2 R3 (C11) ------------------------------------------------------------------------------------------
SET_OLD = ("function _rtSetExpanded(v){\n"
           "  _rtExpanded=v;\n"
           "  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard');\n"
           "  if(tab)tab.style.display=v?'none':'flex';\n"
           "  if(card)card.style.display=v?'block':'none';\n"
           "  _ruRender();\n"
           "}\n"
           "function rtExpand(){_rtSetExpanded(true);}\n")
SET_NEW = ("function _rtSetExpanded(v){\n"
           "  _rtExpanded=v;\n"
           "  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard');\n"
           "  // V239 (D234 R3): in the pill arm the pill stays displayed while the card hangs beneath it.\n"
           "  if(tab)tab.style.display=(v&&!_rtPill)?'none':'flex';\n"
           "  if(card)card.style.display=v?'block':'none';\n"
           "  _ruRender();\n"
           "}\n"
           "// V239 (D234 R3): in the pill arm a tap toggles: the first opens the card, a second closes it as the › button does.\n"
           "function rtExpand(){if(_rtPill&&_rtExpanded){rtCollapse();return;}_rtSetExpanded(true);}\n")
html = rep('E2 _rtSetExpanded/rtExpand', html, SET_OLD, SET_NEW)
TAP_OLD = "    var gl=document.createElement('span');gl.id='rtGlyph';gl.setAttribute('aria-hidden','true');tab.appendChild(gl);\n"
TAP_NEW = (TAP_OLD +
           "    // V239 (D234 R3): the pill's tap (drag is not wired here, so this is its only tap): end any intro, then toggle.\n"
           "    tab.addEventListener('click',function(){_rtDismissIntro();rtExpand();});\n")
html = rep('E2 pill tap listener', html, TAP_OLD, TAP_NEW)

# ---- E3 the pill intro (C12) ------------------------------------------------------------------------------
APPLY = "function _rtApplySide(){\n"
html = rep('E3 _rtPlayPillIntro', html, APPLY,
    "// V239 (D234 Amendment 1, R5a-R5c): the pill arm's first-program intro. The card drops out of the pill at 0.3 s,\n"
    "// holds, folds back up at 2.2 s in 0.34 s, then the pill echoes. _rtIntroTO is non-null until the card is closed, so a\n"
    "// tap or Start during the fold still ends the intro. Reduced motion: shown at 0.3 s, closed at 2.2 s, nothing moves.\n"
    "function _rtPlayPillIntro(){\n"
    "  var card=document.getElementById('rtCard'),tab=document.getElementById('rtTab');\n"
    "  if(!card||!tab){_rtSetExpanded(false);return;}\n"
    "  if(_rtIntroTO)clearTimeout(_rtIntroTO);\n"
    "  if(_wkReduceMotion()){\n"
    "    _rtIntroTO=setTimeout(function(){\n"
    "      _rtSetExpanded(true);\n"
    "      _rtIntroTO=setTimeout(function(){_rtIntroTO=null;_rtSetExpanded(false);},1900);\n"
    "    },300);\n"
    "    return;\n"
    "  }\n"
    "  _rtSetExpanded(true);\n"
    "  card.style.animation='none';void card.offsetWidth;\n"
    "  card.style.animation='rtPillDrop .6s cubic-bezier(.34,1.25,.5,1) .3s 1 both';\n"
    "  _rtIntroTO=setTimeout(function(){\n"
    "    card.style.animation='none';void card.offsetWidth;\n"
    "    card.style.animation='rtPillDrop .34s cubic-bezier(.5,0,.75,0) 1 reverse both';\n"
    "    _rtIntroTO=setTimeout(function(){\n"
    "      _rtIntroTO=null;\n"
    "      card.style.animation='';\n"
    "      _rtSetExpanded(false);\n"
    "      tab.style.animation='none';void tab.offsetWidth;\n"
    "      tab.style.animation='rtPillEcho .34s cubic-bezier(.34,1.4,.5,1) 1 both';\n"
    "      setTimeout(function(){tab.style.animation='';},420);\n"
    "    },340);\n"
    "  },2200);\n"
    "}\n" + APPLY)

# ---- E4 dispatch (C13) ------------------------------------------------------------------------------------
DISP_OLD = ("  if(_rtIntroPending){\n"
            "    _rtIntroPending=false;\n"
            "    _rtSide='right';_rtApplySide();\n"
            "    _rtPlayIntro();\n"
            "  }\n")
DISP_NEW = ("  if(_rtIntroPending){\n"
            "    _rtIntroPending=false;\n"
            "    if(_rtPill){_rtPlayPillIntro();return;}   // V239 (D234 Amendment 1 R5b): the pill arm's own intro\n"
            "    _rtSide='right';_rtApplySide();\n"
            "    _rtPlayIntro();\n"
            "  }\n")
html = rep('E4 updateRestFloat dispatch', html, DISP_OLD, DISP_NEW)

# ---- post guards ------------------------------------------------------------------------------------------
counts('post', html, (('rtPillDrop', 4), ('rtPillEcho', 2), ('_rtPlayPillIntro', 2), ('function _rtPlayIntro(){', 1),
                      ('_rtPlayIntro();', 1), ("tab.addEventListener('click'", 1), ('rtExpand()', 3),
                      ('@keyframes rtCardIntro{', 1), ('@keyframes rtPillSettle{', 1), ('<meta name="ia-version" content="239">', 1)))

open(HTML, 'w', encoding='utf-8').write(html)
print('WROTE %s' % HTML)
