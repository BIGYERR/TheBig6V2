#!/usr/bin/env python3
# V214 close D — tests/gates/g208_d103a_readers.js E3 era row (gatekeeper, V214 proof). 3 edits, 1 file.
# E3 pairs each keyed easy run of the uninjured build with the same day of the easy-mode build. From 214
# the uninjured dated test eve (T-1) carries D158's shakeout, while easy mode (a protect-park mode, coach's
# V214 fix) keeps V213's handling there. So from 214 the D158 test eve of a dated program leaves the E3
# pairing, and in its place E3e asserts the ruling: under easy mode a training-day test eve is handled as
# V213's rule handles it (card types and subtypes, lift presence, rest flag equal to V213's for the same
# cfg; g214 D8's property). V213 is read from argv[3] when it reads 213, else git bc3cccc. Below 214, E3
# reads exactly as before and E3e is skipped by name. No index.html change.
import io, sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g208_d103a_readers.js'
src = io.open(P, encoding='utf-8').read()
REPS = [
("E1 D158 eve helper",
"""  let stridesDealt = 0, stridesLeft = [], plusLeft = [], doseBad = [];
""",
"""  let stridesDealt = 0, stridesLeft = [], plusLeft = [], doseBad = [];
  // V214 (D158 + coach's fix, close D): from 214 the uninjured dated test eve (T-1, date arithmetic from
  // raceDate) carries D158's shakeout and easy mode keeps V213's handling there, so that cell leaves the E3
  // pairing and E3e asserts the ruling in its place. Below 214 nothing is excluded.
  const ERA214 = 214, eveOf = cfg => { if(!cfg.raceDate) return null; const [y, m, dd] = cfg.raceDate.split('-').map(Number); const e = new Date(y, m - 1, dd - 1);
    return {w: Math.floor(Math.round((e - START) / 864e5) / 7) + 1, d: ALL[e.getDay()]}; };
  const d158Eve = (b, w, d) => { if(VER < ERA214 || !b.dated) return false; const e = eveOf(b.cfg); return !!e && +w === e.w && d === e.d; };
  let eveOut = 0;
"""),
("E2 keptBad skips the D158 eve",
"""      if(!PARK_SET.has(k) && canon(after) !== canon(ruled2b(c))) keptBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k);""",
"""      if(!PARK_SET.has(k) && d158Eve(b, w, d)) eveOut++;
      else if(!PARK_SET.has(k) && canon(after) !== canon(ruled2b(c))) keptBad.push(b.fam + ' #' + i + ' W' + w + ' ' + d + ' key ' + k);"""),
("E3 E3 label + E3e row",
"""  ok(`E3 every keyed easy run is left exactly as dealt in easy mode, strides finisher aside (the 2b text rule) (${(total.easy || 0) - (parked.easy || 0)}/${total.easy || 0})`, keptBad.length === 0 && (total.easy || 0) > 0, keptBad.length + ': ' + keptBad.slice""",
"""  if(VER < ERA214) skip('E3e ia-version ' + VER + ' predates D158 (V' + ERA214 + '); no test eve leaves the E3 pairing');
  else {
    let B213 = (IB && +IB.version === 213) ? IB : null, why = B213 ? 'argv' : '';
    if(!B213){ try { const f = path.join(os.tmpdir(), 'g208r_v213_' + process.pid + '.html');
      fs.writeFileSync(f, require('child_process').execFileSync('git', ['-C', path.join(__dirname, '..', '..'), 'show', 'bc3cccce3f048a9e0e4e45846bfe8315635c8430:index.html'], {maxBuffer: 1 << 27}));
      const x = load(f); try { fs.unlinkSync(f); } catch(e){} if(+x.version === 213){ B213 = x; why = 'git bc3cccc'; } else why = 'git copy reads ' + x.version; } catch(e){ why = 'git show failed: ' + String(e.message).slice(0, 80); } }
    const isLift = s => !!s && (s.items || []).length && !/mobility|stretch|taper/i.test(s.label || '');
    const sig = x => canon({rest: !x || !!x.rest, lift: !!(x && !x.rest && (x.sections || []).some(isLift)), cards: [].concat((x && x.cardio) || []).filter(Boolean).map(c => c.type + ':' + (c.subtype || '')).sort()});
    let n = 0; const eBad = [];
    if(B213) BASECFG.forEach((b, i) => { if(!b.dated) return; const e = eveOf(b.cfg); if(!e || e.w < 1 || (b.cfg.restDays || []).includes(e.d)) return;
      const p = get(b.fam, i, 'easy'), q = build(B213, withInj(b.cfg, 'easy')); n++;
      const sa = sig(p.weeks[e.w] && p.weeks[e.w][e.d]), sb = sig(q.weeks[e.w] && q.weeks[e.w][e.d]); if(sa !== sb) eBad.push(b.fam + ' #' + i + ' W' + e.w + ' ' + e.d + ': V213 ' + sb + ' now ' + sa); });
    ok(`E3e easy mode handles the training-day test eve as V213's rule does: no shakeout card, same lift presence, same rest flag (${n} dated eves, V213 from ${why || 'nowhere'}; ${eveOut} eve cells left the E3 pairing)`,
       !!B213 && n > 0 && eBad.length === 0, (B213 ? '' : 'V213 unavailable: ' + why + '; ') + eBad.length + ': ' + eBad.slice(0, 2).join(' || '));
  }
  ok(`E3 every keyed easy run is left exactly as dealt in easy mode, strides finisher aside (the 2b text rule) (${(total.easy || 0) - (parked.easy || 0)}/${total.easy || 0}${VER >= ERA214 ? '; from 214 the D158 test eve is E3e\\'s' : ''})`, keptBad.length === 0 && (total.easy || 0) > 0, keptBad.length + ': ' + keptBad.slice"""),
]
bad = False
for tag, old, new in REPS:
    c = src.count(old); print('%-34s count=%d' % (tag, c)); bad |= (c != 1)
if bad: sys.exit('ABORT: an anchor did not appear exactly once. Nothing written.')
for tag, old, new in REPS: src = src.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(src); print('WROTE', P)
