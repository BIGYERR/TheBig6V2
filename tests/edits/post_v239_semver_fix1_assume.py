#!/usr/bin/env python3
# post_v239_semver_fix1_assume.py — Post-V239 semver pass, fix 1 (tests only, no build).
#
# FINDING (gatekeeper review of 82361a5): the gates that read IA_ASSUME_VERSION guard it with
# `process.env.IA_ASSUME_VERSION !== undefined`. Before the semver pass a set-but-empty value was inert
# (`+''` is 0, never an era); after it, SV.cmp('', ...) throws and the gate dies with no PASS/FAIL summary.
#
# RULING (main session, tooling shape): unset OR empty (after trim) means no knob; any other value must
# parse through SV (a garbage value still throws, loudly, by design). Change nothing else.
#
# SHAPE (identical in every file): each code occurrence of the guard
#     process.env.IA_ASSUME_VERSION !== undefined
# becomes
#     (process.env.IA_ASSUME_VERSION || '').trim() !== ''
# The value handed to SV.cmp is untouched, so any non-blank value still parses through SV or throws.
# Every anchor is the whole source line (newline-bounded), asserted count==1 in its file; all anchors
# are checked in memory first and nothing is written unless every one hits.
import glob, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OLD = 'process.env.IA_ASSUME_VERSION !== undefined'
NEW = "(process.env.IA_ASSUME_VERSION || '').trim() !== ''"
EXPECT_FILES = 24
EXPECT_EDITS = 37

EDITS = [
    ('tests/gates/g203_mile_pencil.js',
     'const eraV = (process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, REKEY_ASSUME) === 0 && SV.cmp(artifactV, REKEY_ASSUME - 1) === 0) ? REKEY_ASSUME : artifactV;',
     "const eraV = ((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, REKEY_ASSUME) === 0 && SV.cmp(artifactV, REKEY_ASSUME - 1) === 0) ? REKEY_ASSUME : artifactV;"),
    ('tests/gates/g207_test_calendar.js',
     'const ERA_V = (process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, D183_ERA) === 0 && SV.cmp(VER, D183_ERA - 1) === 0) ? D183_ERA : VER;',
     "const ERA_V = ((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, D183_ERA) === 0 && SV.cmp(VER, D183_ERA - 1) === 0) ? D183_ERA : VER;"),
    ('tests/gates/g218_d157_swim_sizer.js',
     'const D183_ERA = 223, ERA_V = (process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, D183_ERA) === 0 && SV.cmp(VER, D183_ERA - 1) === 0) ? D183_ERA : VER;',
     "const D183_ERA = 223, ERA_V = ((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, D183_ERA) === 0 && SV.cmp(VER, D183_ERA - 1) === 0) ? D183_ERA : VER;"),
    ('tests/gates/g221_d177_swapfloor.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g221_d178_active.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g221_d179_donenav.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g221_d180_blockopen.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g222_d181_chain.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g222_d181_chain.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g222_d181_durable.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g223_d182_racedate.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g223_d183_safepace.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g223_d184_testlen.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g225_d186_clockend.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g225_d186_clockend.js',
     '} else if(process.env.IA_ASSUME_VERSION !== undefined){',
     "} else if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g225_d187_pacerate.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g225_d187_pacerate.js',
     '} else if(process.env.IA_ASSUME_VERSION !== undefined){',
     "} else if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g226_d188_beginnermile.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g226_d188_beginnermile.js',
     '} else if(process.env.IA_ASSUME_VERSION !== undefined){',
     "} else if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g226_d189_pacedisclose.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g226_d189_pacedisclose.js',
     '} else if(process.env.IA_ASSUME_VERSION !== undefined){',
     "} else if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g227_d190_cuecap.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g227_d190_cuecap.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g227_d190_prefpath.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g227_d190_prefpath.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g227_d190_seam.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g227_d190_seam.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g228_d192_undokey.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g228_d192_undokey.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g228_d193_cueword.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g228_d193_cueword.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g229_d193_build.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g229_d193_build.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g229_d194_lens.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g229_d194_lens.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
    ('tests/gates/g230_d194_lens2.js',
     'if(process.env.IA_ASSUME_VERSION !== undefined){',
     "if((process.env.IA_ASSUME_VERSION || '').trim() !== ''){"),
    ('tests/gates/g230_d194_lens2.js',
     '  if(process.env.IA_ASSUME_VERSION !== undefined && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){',
     "  if((process.env.IA_ASSUME_VERSION || '').trim() !== '' && SV.cmp(process.env.IA_ASSUME_VERSION, ERA) === 0 && SV.cmp(STAMP, ERA - 1) === 0){"),
]

def die(msg):
    print('ABORT: ' + msg + ' (nothing written)')
    sys.exit(1)


def main():
    if len(EDITS) != EXPECT_EDITS:
        die('EDITS has %d rows, want %d' % (len(EDITS), EXPECT_EDITS))
    files = sorted(set(f for f, _, _ in EDITS))
    if len(files) != EXPECT_FILES:
        die('EDITS names %d files, want %d' % (len(files), EXPECT_FILES))
    tree = sorted(os.path.relpath(p, ROOT) for p in glob.glob(os.path.join(ROOT, 'tests', 'gates', '*.js'))
                  if 'IA_ASSUME_VERSION' in open(p, encoding='utf-8').read())
    if tree != files:
        die('knob file set differs from the tree: only in tree %s, only in script %s'
            % (sorted(set(tree) - set(files)), sorted(set(files) - set(tree))))
    texts = {}
    for f in files:
        with open(os.path.join(ROOT, f), encoding='utf-8', newline='') as fh:
            texts[f] = fh.read()
    for f, old, new in EDITS:
        if old.count(OLD) != 1 or new != old.replace(OLD, NEW):
            die('%s: row is not the ruled shape: %r' % (f, old))
        anchor = '\n' + old + '\n'
        n = texts[f].count(anchor)
        if n != 1:
            die('%s: anchor count %d, want 1: %r' % (f, n, old))
        line = texts[f][:texts[f].index(anchor) + 1].count('\n') + 1
        texts[f] = texts[f].replace(anchor, '\n' + new + '\n', 1)
        print('%s:%d  %s' % (f, line, new.strip()))
    for f in files:
        if OLD in texts[f]:
            die('%s: a guard was left unconverted' % f)
    for f in files:
        with open(os.path.join(ROOT, f), 'w', encoding='utf-8', newline='') as fh:
            fh.write(texts[f])
    print('OK: %d replacements in %d files' % (len(EDITS), len(files)))


if __name__ == '__main__':
    main()
