#!/usr/bin/env python3
# V220 slice 5 of ~14. No version bump in this slice.
#   D174 (P-EMOJI) s2 rows V206 :17095 (reminder), :17108 and :17112 (season), plus s5 (Mario
#   accepted): the reminder tier's icon becomes the ASY icon NAME 'notebook', and the last
#   reminder-pool emoji is stripped. Season-tier emoji STAY.
# Ruling: tests/measure/v220_rulings/p_emoji_ruling.md s2 and s5.
# Pool edits are IN PLACE (ia_pop_idx_ stores indices): no entry added, removed or reordered.
#
# LINE-LOCAL: each edit finds the one line holding its text anchor (asserted exactly one) and
# rewrites only that line. Emoji tails and the old icon value are read from the file; none are
# typed here. Em-dashes are literal U+2014. No backslashes (newline is chr(10)).
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
NL = chr(10)
src = open(P, 'rb').read().decode('utf-8')
lines = src.split(NL)


def die(msg):
    print('ABORT ' + msg + '; nothing written')
    sys.exit(1)


def one_line(name, anchor):
    hits = [n for n, l in enumerate(lines) if anchor in l]
    if len(hits) != 1:
        die('%s: anchor on %d lines (want 1)' % (name, len(hits)))
    return hits[0]


def sub_once(name, s, old, new):
    c = s.count(old)
    if c != 1:
        die('%s: in-line anchor %r count %d (want 1)' % (name, old, c))
    return s.replace(old, new, 1)


def non_ascii_only(s):
    return len(s) > 0 and all(ord(c) > 0x7F for c in s)


# 1. reminder[4], the LAST reminder entry (no trailing comma): dash fix, then strip the emoji tail.
name = 'D174 reminder[4]'
n = one_line(name, 'You disappeared on a workout. Your record, your call')
if lines[n + 1].strip() != '],':
    die('%s: next line is %r, not the reminder pool close' % (name, lines[n + 1].strip()))
line = sub_once(name, lines[n], 'your call — fix it.', 'your call. Fix it.')
body = line.lstrip(' ')
indent = line[:len(line) - len(body)]
stop = 'Fix it.'
if not (body.startswith('"') and body.endswith('"') and body.count(stop) == 1):
    die('%s: line is not a bare last string entry' % name)
cut = body.index(stop) + len(stop)
tail = body[cut:len(body) - 1]
if not (len(tail) >= 2 and tail[0] == ' ' and non_ascii_only(tail[1:])):
    die('%s: tail %r is not one space + non-ASCII only' % (name, tail))
lines[n] = indent + body[:cut] + '"'
print('ok   %s line %d, dash fixed, removed %s' % (name, n + 1, ' '.join('U+%04X' % ord(c) for c in tail[1:])))

# 2. season: "Rare as fuck -- most quit" dash fix (emoji stays).
name = 'D174 season rare'
n = one_line(name, 'Rare as fuck — most quit at week two')
lines[n] = sub_once(name, lines[n], 'Rare as fuck — most quit', 'Rare as fuck. Most quit')
print('ok   %s line %d' % (name, n + 1))

# 3. season: weak-ass -> weak ass (emoji stays).
name = 'D174 season weak ass'
n = one_line(name, 'You outlasted every weak-ass excuse')
lines[n] = sub_once(name, lines[n], 'weak-ass', 'weak ass')
print('ok   %s line %d' % (name, n + 1))

# 4. POP_CFG.reminder icon: the emoji value becomes the ASY icon name 'notebook'.
name = 'D174 POP_CFG.reminder icon'
n = one_line(name, "reminder:{icon:'")
line = lines[n]
if not line.lstrip(' ').startswith("reminder:{icon:'"):
    die('%s: line %d does not open with the reminder entry' % (name, n + 1))
a = line.index("icon:'") + len("icon:'")
b = line.index("'", a)
old = line[a:b]
if not non_ascii_only(old):
    die('%s: old icon value %r is not an emoji' % (name, old))
lines[n] = line[:a] + 'notebook' + line[b:]
print('ok   %s line %d, replaced %s' % (name, n + 1, ' '.join('U+%04X' % ord(c) for c in old)))

open(P, 'wb').write(NL.join(lines).encode('utf-8'))
print('wrote', P)
