#!/usr/bin/env python3
# V220 slice 4 of ~14. No version bump in this slice.
#   D174 (P-EMOJI) s5, Mario decision: the reminder tier is not a celebration, so its pool
#   emoji are stripped. Four of the five POP_POOLS.reminder lines; the fifth
#   ("You disappeared on a workout...") is slice 5 and is not touched here.
# Ruling: tests/measure/v220_rulings/p_emoji_ruling.md s5 (+ p_popcond_ruling.md s6 decision 4).
# Edits are IN PLACE (ia_pop_idx_ stores indices): no entry added, removed or reordered.
#
# LINE-LOCAL: each edit finds the one line holding its text anchor (asserted exactly one),
# requires the line to be   <indent>"<anchor><tail>",   and removes <tail>. The tail is read
# from the file and must be one space followed only by codepoints above U+007F. No emoji and
# no backslashes are typed in this script (newline is chr(10)).
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
NL = chr(10)
src = open(P, 'rb').read().decode('utf-8')
lines = src.split(NL)

ANCHORS = [
    'Yo, you ghosted a session. Mark it or own the skip.',
    'Left a day hanging unmarked. Did you train or nah?',
    'Unfinished business sitting on your calendar. Settle up.',
    "That day didn't log itself, champ. Complete it or call it.",
]


def die(msg):
    print('ABORT ' + msg + '; nothing written')
    sys.exit(1)


for k, anchor in enumerate(ANCHORS, 1):
    name = 'D174-STRIP reminder %d' % k
    hits = [n for n, l in enumerate(lines) if anchor in l]
    if len(hits) != 1:
        die('%s: anchor on %d lines (want 1)' % (name, len(hits)))
    n = hits[0]
    line = lines[n]
    body = line.lstrip(' ')
    indent = line[:len(line) - len(body)]
    head = '"' + anchor
    if not (body.startswith(head) and body.endswith('",')):
        die('%s: line %d is not   "<anchor><tail>",' % (name, n + 1))
    tail = body[len(head):len(body) - 2]
    if not (len(tail) >= 2 and tail[0] == ' ' and all(ord(c) > 0x7F for c in tail[1:])):
        die('%s: tail %r is not one space + non-ASCII only' % (name, tail))
    lines[n] = indent + head + '",'
    print('ok   %s line %d, removed %s' % (name, n + 1, ' '.join('U+%04X' % ord(c) for c in tail[1:])))

open(P, 'wb').write(NL.join(lines).encode('utf-8'))
print('wrote', P)
