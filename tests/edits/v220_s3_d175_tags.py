#!/usr/bin/env python3
# V220 slice 3 of ~14. No version bump in this slice.
#   D175 (P-POPCOND) s1a + s1c + s6 decisions 1 and 3: tags on workout[8], [15], [25], [26].
#   D174 (P-EMOJI) s2 rows V206 :17087 and :17088: dash fixes on [25] and [26].
# Rulings: tests/measure/v220_rulings/p_popcond_ruling.md, tests/measure/v220_rulings/p_emoji_ruling.md.
# Edits are IN PLACE (ia_pop_idx_ stores indices): no entry is added, removed or reordered.
# popEligible does not read `type` yet (later slice), so the type tags are inert on this tree.
#
# LINE-LOCAL transform: each edit finds the one line holding a unique text anchor (asserted
# exactly one line), then rewrites only that line's structure. Emoji bytes are carried over
# from the file; none are typed here. The script holds no backslashes (newline is chr(10)),
# so nothing in it can be decoded as an escape on the way to disk.
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


def split_bare(name, line, last):
    # a bare pool string: <indent>"<text>",   (last entry: no trailing comma)
    body = line.lstrip(' ')
    indent = line[:len(line) - len(body)]
    tail = '"' if last else '",'
    if not (body.startswith('"') and body.endswith(tail)):
        die('%s: line is not a bare string entry%s' % (name, ' (last, no comma)' if last else ''))
    if not last and body.endswith('"},'):
        die('%s: line is already an object' % name)
    return indent, body[1:len(body) - len(tail)]


def sub_once(name, s, old, new):
    c = s.count(old)
    if c != 1:
        die('%s: in-line anchor %r count %d (want 1)' % (name, old, c))
    return s.replace(old, new, 1)


# 1. [8] Cardio / brunch: add type:'cardio' after the existing when:'weekend'.
n = one_line('D175 [8]', 'talk all the shit you want at brunch.')
lines[n] = sub_once('D175 [8]', lines[n], "when:'weekend'},", "when:'weekend', type:'cardio'},")
print('ok   D175 [8] line %d' % (n + 1))

# 2. [15] hungover: bare string -> {t:..., when:'weekend'}
n = one_line('D175 [15]', "Showed up hungover, didn't die.")
ind, txt = split_bare('D175 [15]', lines[n], last=False)
lines[n] = ind + '{t:"' + txt + '"' + ", when:'weekend'},"
print('ok   D175 [15] line %d' % (n + 1))

# 3. [25] dead ugly: D174 dash fix, then bare string -> {t:..., type:'lift'}
n = one_line('D175 [25]', 'looked dead ugly on that last set')
ind, txt = split_bare('D175 [25]', lines[n], last=False)
txt = sub_once('D174 [25]', txt, 'thing — looked', 'thing. Looked')
lines[n] = ind + '{t:"' + txt + '"' + ", type:'lift'},"
print('ok   D175+D174 [25] line %d' % (n + 1))

# 4. [26] playlist: LAST workout entry, no trailing comma. D174 dash fix (the JS quote
#    escapes around "workout complete." are carried over untouched), then -> {t:..., type:'lift'}
n = one_line('D175 [26]', 'ten minutes lifting. But okay')
if lines[n + 1].strip() != '],':
    die('D175 [26]: next line is %r, not the workout pool close' % lines[n + 1].strip())
ind, txt = split_bare('D175 [26]', lines[n], last=True)
txt = sub_once('D174 [26]', txt, 'But okay — ', 'But okay, ')
lines[n] = ind + '{t:"' + txt + '"' + ", type:'lift'}"
print('ok   D175+D174 [26] line %d' % (n + 1))

open(P, 'wb').write(NL.join(lines).encode('utf-8'))
print('wrote', P)
