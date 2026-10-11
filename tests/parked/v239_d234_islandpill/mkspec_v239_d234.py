#!/usr/bin/env python3
# Writes tests/sabotage/v239_d234.json; every anchor asserted count==1 on index.html first (all or nothing).
import json, sys
ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
html = open(ROOT + '/index.html', encoding='utf-8').read()
G = 'gates/g239_d234_pill.js'
RUL = ' Ruling: tests/measure/v239_rulings/v239_ruling_d234.md'
M = [
 ('P1-D234 hasIsland is read truthy: the string "1" draws the pill',
  '_rtPill=!!(_I&&_I.hasIsland===true);', '_rtPill=!!(_I&&_I.hasIsland);', 'D234-native-noisland',
  '(hasIsland "1" gets the pill class, plain 0:00 and no drag). R1: unknown reads as the tab.'),
 ('P2-D234 the tab arm\'s clock format keys on the plugin instead of the island flag',
  'mini.innerHTML=_rtPill?main:_rtStack(main);', 'mini.innerHTML=window.iaIsland?main:_rtStack(main);', 'D234-native-noisland',
  '(hasIsland false and absent print plain 0:00, not the V238 stack). R1, R6.'),
 ('P3-D234 the pill class is never added', "if(fr)fr.classList.add('rt-pill');", 'if(fr){}', 'D234-native-pill',
  '(restFloat class empty). R2.'),
 ('P4-D234 the glyph is prepended, not appended', 'tab.appendChild(gl);', 'tab.insertBefore(gl,tab.firstChild);', 'D234-native-pill',
  '(last child #rtMini, not #rtGlyph). Amendment 2 R2c.'),
 ('P5-D234 the five-digit step is dropped', ";if(_rtPill)mini.classList.toggle('rt-five',main.length>=5);}", ';}', 'D234-native-pill',
  '(10:00 and 60:00 without rt-five). Amendment 2 R2d.'),
 ('P6-D234 the glyph reads pause at idle', "var gk=(!_ruRunning&&_ruElapsed>0)?'pause':'timer';", "var gk=_ruRunning?'timer':'pause';", 'D234-native-pill',
  '(idle glyph pause, not timer). R2: timer muted at idle.'),
 ('P7-D234 rtExpand no longer toggles in the pill arm', 'function rtExpand(){if(_rtPill&&_rtExpanded){rtCollapse();return;}_rtSetExpanded(true);}',
  'function rtExpand(){_rtSetExpanded(true);}', 'D234-native-tap', '(a second pill tap leaves the card open). R3.'),
 ('P8-D234 the pill hides while the card is open', "if(tab)tab.style.display=(v&&!_rtPill)?'none':'flex';", "if(tab)tab.style.display=v?'none':'flex';",
  'D234-native-tap', '(pill display none with the card open). R3: the pill stays visible.'),
 ('P9-D234 drag is wired in the pill arm', "    _rtSetExpanded(false);_ruRender();\n    return;\n  }\n  _rtWireDrag(tab,true);",
  "    _rtWireDrag(tab,true);_rtWireDrag(card,false);_rtSetExpanded(false);_ruRender();\n    return;\n  }\n  _rtWireDrag(tab,true);", 'D234-native-nodrag',
  '(pointerdown sets _rtDragging, the move sets top 100px, the side snaps left). R3.'),
 ('P10-D234 the pill arm is dispatched to the tab intro', 'if(_rtPill){_rtPlayPillIntro();return;}', 'if(_rtPill){_rtPlayIntro();return;}', 'D234-native-intro',
  '(rtCardIntro with the pill hidden at (1)). Amendment 1 R5b.'),
 ('P11-D234 reduced motion is ignored in the pill arm', "  if(_wkReduceMotion()){\n    _rtIntroTO=setTimeout(function(){\n      _rtSetExpanded(true);",
  "  if(false){\n    _rtIntroTO=setTimeout(function(){\n      _rtSetExpanded(true);", 'D234-native-intro', '(point 5: the card animates under reduce). Amendment 1 R5c.'),
 ('P12-D234 the card-body tap listener is dropped',
  "    card.addEventListener('click',function(e){if(e&&e.target&&e.target.closest&&e.target.closest('.rt-btn,.rt-reset,.rt-collapse'))return;if(_rtIntroTO)rtCollapse();});\n",
  '', 'D234-native-intro', '(a card-body tap at 500 leaves the intro running and the card open). Amendment 1 R5b.'),
 ('P13-D234 the card-body tap closes the card outside the intro too', 'if(_rtIntroTO)rtCollapse();', 'rtCollapse();', 'D234-native-intro',
  '(an open card closes on a body tap). Amendment 1 R5b: outside the intro it does nothing.'),
 ('P14-D234 the fold\'s timeout is not held in _rtIntroTO',
  "    _rtIntroTO=setTimeout(function(){\n      _rtIntroTO=null;\n      card.style.animation='';",
  "    _rtIntroTO=null;setTimeout(function(){\n      _rtIntroTO=null;\n      card.style.animation='';", 'D234-native-intro',
  '(at 2300, mid-fold, _rtIntroTO is null with the card still open). Amendment 1 R5b.'),
 ('P15-D234 the pill echo is dropped', "tab.style.animation='rtPillEcho .34s cubic-bezier(.34,1.4,.5,1) 1 both';", "tab.style.animation='';",
  'D234-native-intro', '(point 2: no rtPillEcho at 2540). Amendment 1 R5a.'),
 ('P16-D234 the pill is shown on Home and the wizard', "var show=!!activeProg&&(_curScreen==='screenWeek'||",
  "var show=!!activeProg&&(_rtPill||_curScreen==='screenWeek'||", 'D234-native-screens', '(display block on Home and the wizard). R2.'),
 ('P17-D234 the pill\'s render tells the island', "gl.classList.toggle('run',_ruRunning);}}", "gl.classList.toggle('run',_ruRunning);}_ruIsland();}",
  'D234-noislandcall', '(every pill render adds a call to the log). R6: D234 adds no island call.'),
 ('P18-D234 the pill\'s glyph carries a word', 'gl.innerHTML=asyIcon(gk,12);', "gl.innerHTML=asyIcon(gk,12)+'Rest';", 'D234-copy',
  '(glyph text "Rest"). R7: no new string.'),
]
out = []
for name, anchor, repl, rowid, why in M:
    n = html.count(anchor)
    if n != 1 or anchor == repl:
        print('ABORT %s: anchor count %d' % (name, n)); sys.exit(1)
    out.append({'name': name, 'anchor': anchor, 'replacement': repl, 'gate': G,
                'note': 'NAMED TRIP: g239_d234_pill.js row ' + rowid + ' ' + why + RUL + '.'})
open(ROOT + '/tests/sabotage/v239_d234.json', 'w', encoding='utf-8').write(json.dumps(out, indent=1, ensure_ascii=False) + '\n')
print('WROTE %d mutations' % len(out))
