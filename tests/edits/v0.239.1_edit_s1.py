#!/usr/bin/env python3
# v0.239.1 slice 1 of 3 (PATCH, Mario). D235 P-TIMERDRAG and D236 P-SEMVERLABEL, both Mario's.
# Ruling: tests/measure/v0.239.1_rulings/v0.239.1_ruling_d235_d236.md
# NO version write here and no ia-version meta change (slice 2 does both, last). The report-context line
# ('build: v'+IA_VERSION) is slice 2's too.
#   E1  D235-drag   pointermove: `if(!moved)return;` right after the 5 px threshold line, so a sub-threshold
#                   jitter writes neither top nor left.
#   E2  D235-drag   pointerup's end-of-drag and dock-to-edge code moves into one local snap(); pointerup calls
#                   it and keeps its tap actions (tab tap expands, card tap collapses during the intro) when
#                   nothing moved; pointercancel calls the same snap() and never runs a tap action.
#   E3  D236-label  iaVersionLabel(ver), a function declaration beside `const IA_VERSION` so the harness VM can
#                   reach it: 'v' plus canonical MAJOR.MINOR.PATCH; a legacy integer N reads 0.N.0; one leading
#                   v or V is dropped first so the label never reads vv; anything else prints as given after one v.
#   E4  D236-label  bug-report page label: 'BUILD '+iaVersionLabel(IA_VERSION).
# Untouched: the 5 px threshold, the touchmove guard, _rtApplySide, the update check, IA_VERSION itself.
# Every anchor asserted count==1 on the current state before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')


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


html = open(HTML, encoding='utf-8').read()

# ---- premise guards: the 0.239.0 file (meta 239), no helper yet, the old cancel handler, both label sites ----
for tok, want in (('<meta name="ia-version" content="239">', 1),
                  ('iaVersionLabel', 0),
                  ("handle.addEventListener('pointercancel',function(){dragging=false;_rtDragging=false;});", 1),
                  ("_bv.textContent='BUILD v'+IA_VERSION;", 1),
                  ("+'build: v'+IA_VERSION+'\\n'", 1),
                  ('function _rtWireDrag(handle,isTab){', 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

# ---- E1 D235.1 --------------------------------------------------------------------------------------------
html = rep('E1 pointermove holds below the threshold', html,
    "    if(Math.abs(dx)>5||Math.abs(dy)>5)moved=true;\n"
    "    var fb=frame.getBoundingClientRect();\n",
    "    if(Math.abs(dx)>5||Math.abs(dy)>5)moved=true;\n"
    "    // v0.239.1 (D235.1): below the 5 px threshold nothing is written, so a jittery tap leaves the timer docked.\n"
    "    if(!moved)return;\n"
    "    var fb=frame.getBoundingClientRect();\n")

# ---- E2 D235.2 --------------------------------------------------------------------------------------------
html = rep('E2 shared snap for pointerup and pointercancel', html,
    "  handle.addEventListener('pointerup',function(e){\n"
    "    if(!dragging)return;dragging=false;_rtDragging=false;\n"
    "    var anchor=document.getElementById('rtAnchor'),frame=document.getElementById('restFloat');\n"
    "    anchor.style.transition='left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';\n"
    "    if(moved){\n"
    "      var center=anchor.offsetLeft+anchor.offsetWidth/2,fb=frame.getBoundingClientRect();\n"
    "      _rtSide=(center<fb.width/2)?'left':'right';\n"
    "      anchor.style.left='';_rtApplySide();\n"
    "    }else if(isTab){_rtDismissIntro();rtExpand();}\n"
    "    else if(_rtIntroTO){rtCollapse();}\n"
    "  });\n"
    "  handle.addEventListener('pointercancel',function(){dragging=false;_rtDragging=false;});\n",
    "  // v0.239.1 (D235.2): one end-of-drag path for pointerup and pointercancel. It ends the drag, restores the\n"
    "  // snap transition and, when the drag moved, docks the timer to the nearer edge. It returns moved.\n"
    "  function snap(){\n"
    "    dragging=false;_rtDragging=false;\n"
    "    var anchor=document.getElementById('rtAnchor'),frame=document.getElementById('restFloat');\n"
    "    anchor.style.transition='left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';\n"
    "    if(moved){\n"
    "      var center=anchor.offsetLeft+anchor.offsetWidth/2,fb=frame.getBoundingClientRect();\n"
    "      _rtSide=(center<fb.width/2)?'left':'right';\n"
    "      anchor.style.left='';_rtApplySide();\n"
    "    }\n"
    "    return moved;\n"
    "  }\n"
    "  handle.addEventListener('pointerup',function(e){\n"
    "    if(!dragging)return;\n"
    "    if(snap())return;\n"
    "    if(isTab){_rtDismissIntro();rtExpand();}\n"
    "    else if(_rtIntroTO){rtCollapse();}\n"
    "  });\n"
    "  // A cancel ends the drag through snap() and never runs a tap action; outside a drag it only clears the flags.\n"
    "  handle.addEventListener('pointercancel',function(){\n"
    "    if(dragging){snap();}\n"
    "    else{_rtDragging=false;}\n"
    "  });\n")

# ---- E3 D236.1 --------------------------------------------------------------------------------------------
html = rep('E3 iaVersionLabel helper', html,
    "const IA_VERSION = (document.querySelector('meta[name=\"ia-version\"]')||{}).content || '0';\n",
    "const IA_VERSION = (document.querySelector('meta[name=\"ia-version\"]')||{}).content || '0';\n"
    "// v0.239.1 (D236.1): the version as people read it, 'v' plus MAJOR.MINOR.PATCH. One leading v or V is dropped\n"
    "// first, so the label never reads vv. A pre-semver integer N reads 0.N.0 (239 prints v0.239.0); anything else\n"
    "// prints as given after one v, so the label never throws. IA_VERSION stays the raw meta for the update check.\n"
    "function iaVersionLabel(ver){\n"
    "  var s=String(ver),t=/^[vV]/.test(s)?s.slice(1):s;\n"
    "  return /^(0|[1-9][0-9]*)$/.test(t)?'v0.'+t+'.0':'v'+t;\n"
    "}\n")

# ---- E4 D236.2 (bug-report page half) ----------------------------------------------------------------------
html = rep('E4 bug-report page label', html,
    "const _bv=document.getElementById('bugVersion'); if(_bv) _bv.textContent='BUILD v'+IA_VERSION;\n",
    "const _bv=document.getElementById('bugVersion'); if(_bv) _bv.textContent='BUILD '+iaVersionLabel(IA_VERSION);\n")

with open(HTML, 'w', encoding='utf-8') as f:
    f.write(html)
print('WROTE %s' % HTML)
