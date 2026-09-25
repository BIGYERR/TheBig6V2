#!/usr/bin/env python3
# V220 slice 2 of ~14. No version bump in this slice.
#   D174 (P-EMOJI) s2 rows 1-4: four dash fixes in POP_POOLS.workout, edited IN PLACE.
# Ruling: tests/measure/v220_rulings/p_emoji_ruling.md s2 (table of 9 pool strings).
# ia_pop_idx_ stores indices: never reorder, add or remove entries. The emoji on these
# workout lines STAY (celebration tier); only the text before the emoji changes, so every
# anchor is the text portion alone and no emoji byte enters this script.
# Em-dashes below are literal U+2014 characters.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, 'rb').read().decode('utf-8')

EDITS = [
    ('D174 workout 1 (you know)',
     'Just, you know — faster next time.',
     'Just, you know, faster next time.'),
    ('D174 workout 2 (look at you)',
     'Look at you — vertical, sweaty, and useful.',
     'Look at you. Vertical, sweaty, and useful.'),
    ('D174 workout 3 (walk-up)',
     'Sweat now or be wheezing on the way up to your 8-story walk-up.',
     'Sweat now or be wheezing up eight flights of stairs later.'),
    ('D174 workout 4 (medal)',
     "Quit looking for a medal — it's under your tetas, find it later.",
     "Quit looking for a medal. It's under your tetas, find it later."),
]

for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (name, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('ok   %s' % name)

open(P, 'wb').write(src.encode('utf-8'))
print('wrote', P)
