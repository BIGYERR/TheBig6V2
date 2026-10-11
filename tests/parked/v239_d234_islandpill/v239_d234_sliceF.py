#!/usr/bin/env python3
# V239 slice F (the last web slice): D234 Amendment 1 R5b's card-body tap in the pill arm
# (tests/measure/v239_rulings/v239_ruling_d234.md). The gate (tests/gates/g239_d234_pill.js) and the spec
# (tests/sabotage/v239_d234.json) are new files written beside this script, not by it.
#
#   usage: python3 tests/edits/v239_d234_sliceF.py [<pre-slice source.html>]
#   With a source (the scratch pre_sliceF.html) the slice is rebuilt from it into index.html, so the script reruns
#   cleanly whatever slice F state index.html holds. With none, index.html itself must be pre-slice.
#
#   F1  C14  _rtInit's pill branch: a click listener on #rtCard. During the intro (_rtIntroTO set) a plain tap on the
#            card's body dismisses the intro and closes the card (rtCollapse, today's drag-path
#            `else if(_rtIntroTO){rtCollapse();}`); outside the intro it does nothing. A tap on Start, Reset or the
#            minimize button returns at once (the drag path's own `.rt-btn,.rt-reset,.rt-collapse` guard): those keep
#            their handlers, which already handle wasIntro. The tab arms never reach this branch.
# Every anchor asserted count==1 on the source before any write; all or nothing.
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else HTML


def counts(stage, text, table):
    for tok, want in table:
        n = text.count(tok)
        if n != want:
            print('ABORT %s %r: count %d (want %d); nothing written' % (stage, tok, n, want))
            sys.exit(1)


print('source %s' % SRC)
html = open(SRC, encoding='utf-8').read()
counts('premise', html, (('<meta name="ia-version" content="239">', 1), ('function _rtPlayPillIntro(){', 1),
                         ("card.addEventListener('click'", 0), ("tab.addEventListener('click'", 1)))

TAP = "    tab.addEventListener('click',function(){_rtDismissIntro();rtExpand();});\n"
NEW = (TAP +
       "    // V239 (D234 Amendment 1 R5b): a plain tap on the card's body during the intro ends it and closes the card, as the\n"
       "    // drag path's `else if(_rtIntroTO){rtCollapse();}` does in the tab arms; outside the intro it does nothing. Start,\n"
       "    // Reset and the minimize button keep their own handlers (they already handle the intro).\n"
       "    card.addEventListener('click',function(e){if(e&&e.target&&e.target.closest&&e.target.closest('.rt-btn,.rt-reset,.rt-collapse'))return;if(_rtIntroTO)rtCollapse();});\n")
counts('anchor', html, ((TAP, 1),))
html = html.replace(TAP, NEW, 1)
print('ok F1 card-body tap')

counts('post', html, (("card.addEventListener('click'", 1), ("tab.addEventListener('click'", 1), ('if(_rtIntroTO)rtCollapse();', 1),
                      ('<meta name="ia-version" content="239">', 1)))
open(HTML, 'w', encoding='utf-8').write(html)
print('WROTE %s' % HTML)
