#!/usr/bin/env python3
# V239 slice A of the web side: D233 P-ISLAND as amended by Mario's concurrence (R1 native only).
# NO version bump here (slice B bumps 238 -> 239, adds the boot end() call, writes gate + spec).
# Ruling: tests/measure/v239_rulings/v239_ruling_d233.md (R1 amended, R2, R3; R6 no ia_ key).
#   E1  C1+C2  _ruNow line -> _ruClock() (Date.now() iff window.iaIsland, else performance.now(),
#              read lazily on every call), _ruIsland() (run / stop / end, try/catch, absent -> return),
#              _ruNow on _ruClock().
#   E2  C1+C2  ruStart: anchor on _ruClock(); _ruIsland() after _ruRender().
#   E3  C1+C2  ruPause: frozen value on _ruClock(); _ruIsland() after _ruRender().
#   E4  C2     ruReset ends with _ruIsland(); ruResetIfIdle calls it in the zeroing branch only.
# Untouched: the L14014 header comment, ruToggle, _ruRender, the L14247 / L14797 callers, every other
# performance.now. Every anchor asserted count==1 on the current state before any write; all or nothing.
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

# ---- premise guards: V238 file, no island seam yet, three clock sites on performance.now ---------
for tok, want in (('<meta name="ia-version" content="238">', 1), ('iaIsland', 0), ('_ruClock', 0),
                  ('_ruIsland', 0), ('performance.now()-_ruStart', 2), ('_ruStart=performance.now()', 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT premise %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

# ---- E1 -------------------------------------------------------------------------------------------
html = rep('E1 _ruClock/_ruIsland/_ruNow', html,
    "function _ruNow(){return _ruRunning?(performance.now()-_ruStart):_ruElapsed;}\n",
    "// V239 (D233, R1 as amended): inside the native app (window.iaIsland present) the rest clock is the wall clock\n"
    "// and the island mirrors every seam; on the PWA it stays performance.now() and the island is never called.\n"
    "function _ruClock(){return window.iaIsland?Date.now():performance.now();}\n"
    "function _ruIsland(){var I=window.iaIsland;if(!I)return;try{if(_ruRunning)I.run(_ruStart);else if(_ruElapsed>0)I.stop(_ruElapsed);else I.end();}catch(e){}}\n"
    "function _ruNow(){return _ruRunning?(_ruClock()-_ruStart):_ruElapsed;}\n")

# ---- E2 -------------------------------------------------------------------------------------------
html = rep('E2 ruStart', html,
    "function ruStart(){if(_ruRunning)return;_ruRunning=true;_ruStart=performance.now()-_ruElapsed;if(_ruId)clearInterval(_ruId);_ruId=setInterval(_ruRender,33);_ruRender();}\n",
    "function ruStart(){if(_ruRunning)return;_ruRunning=true;_ruStart=_ruClock()-_ruElapsed;if(_ruId)clearInterval(_ruId);_ruId=setInterval(_ruRender,33);_ruRender();_ruIsland();}\n")

# ---- E3 -------------------------------------------------------------------------------------------
html = rep('E3 ruPause', html,
    "function ruPause(){if(_ruRunning){_ruElapsed=performance.now()-_ruStart;}_ruRunning=false;if(_ruId){clearInterval(_ruId);_ruId=null;}_ruRender();}\n",
    "function ruPause(){if(_ruRunning){_ruElapsed=_ruClock()-_ruStart;}_ruRunning=false;if(_ruId){clearInterval(_ruId);_ruId=null;}_ruRender();_ruIsland();}\n")

# ---- E4 -------------------------------------------------------------------------------------------
html = rep('E4 ruReset/ruResetIfIdle', html,
    "function ruReset(){ruPause();_ruElapsed=0;_ruRender();}\n"
    "// Idle-only reset for day-open: a running rest survives navigation; a cold open starts fresh.\n"
    "function ruResetIfIdle(){if(!_ruRunning){_ruElapsed=0;_ruRender();}}\n",
    "function ruReset(){ruPause();_ruElapsed=0;_ruRender();_ruIsland();}\n"
    "// Idle-only reset for day-open: a running rest survives navigation; a cold open starts fresh.\n"
    "function ruResetIfIdle(){if(!_ruRunning){_ruElapsed=0;_ruRender();_ruIsland();}}\n")

# ---- post guards ------------------------------------------------------------------------------------
for tok, want in (('performance.now()-_ruStart', 0), ('_ruClock()', 4), ('_ruIsland();', 4),
                  ('<meta name="ia-version" content="238">', 1)):
    n = html.count(tok)
    if n != want:
        print('ABORT post %r: count %d (want %d); nothing written' % (tok, n, want))
        sys.exit(1)

open(HTML, 'w', encoding='utf-8').write(html)
print('WROTE %s' % HTML)
