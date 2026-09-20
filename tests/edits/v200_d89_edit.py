#!/usr/bin/env python3
# V200 / D89 — declared-core aux drills are never a compound tier.
#
# `Pallof press` matched _isCompound's bare `press` substring and then fell through
# _compoundTier's unguarded `return 3` ("barbell / unspecified-barbell compound").
# Coach printed all 23 _AUX_FAMILY==='core' names on the shipped V199 file: 22 return 0,
# `Pallof press` returns 3. It is the only declared-core name that falls through.
#
# The fix goes in _compoundTier, NOT _isCompound: _compoundTier's readers are all measured,
# _isCompound has unmeasured readers. Accessor used is the real shipped symbol
# `_auxFamily(name)` (index.html :8803), which reads the _AUX_FAMILY map at :8780.
#
# Anchors are asserted count==1 before any write; the first miss aborts the whole script.
# The ia-version bump is the LAST replacement.

import io, sys, os

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
PATH = os.path.normpath(PATH)

with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

orig = src
EDITS = []

# --- Edit 1: the D89 guard, immediately after the _isCompound gate in _compoundTier ---
A1_OLD = """function _compoundTier(name){
  if(!_isCompound(name)) return 0;
  const N=(name||'').toLowerCase();"""
A1_NEW = """function _compoundTier(name){
  if(!_isCompound(name)) return 0;
  // V200 (D89): a drill declared family 'core' in _AUX_FAMILY is a core drill, never a loaded
  // compound. `Pallof press` cleared _isCompound on the bare substring `press` and then fell
  // through to the unqualified-name `return 3` below, reading as barbell-tier. It was the only
  // one of the 23 declared-core names to do so. The map is the authority on what a core drill is.
  if(_auxFamily(name)==='core') return 0;
  const N=(name||'').toLowerCase();"""
EDITS.append(('D89 core guard in _compoundTier', A1_OLD, A1_NEW))

# --- Edit 2 (LAST): ia-version 199 -> 200 ---
A2_OLD = '<meta name="ia-version" content="199">'
A2_NEW = '<meta name="ia-version" content="200">'
EDITS.append(('ia-version 199 -> 200', A2_OLD, A2_NEW))

for label, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor [%s] count==%d, expected 1. No write performed.\n' % (label, n))
        sys.exit(1)
    src = src.replace(old, new, 1)
    sys.stdout.write('ok  %s\n' % label)

if src == orig:
    sys.stderr.write('ABORT: no change produced.\n')
    sys.exit(1)

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

sys.stdout.write('wrote %s (%d -> %d bytes)\n' % (PATH, len(orig.encode('utf-8')), len(src.encode('utf-8'))))
