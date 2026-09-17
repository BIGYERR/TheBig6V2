#!/usr/bin/env python3
# V197 slice 5c — C1/C2 second pass, driven by what the mutations actually showed.
#
# Slice 5 re-pointed C1 at "no blank name slot" and C2 at "no blank slot in a MULTI-ITEM
# (superset) row". C1 is now falsifiable and trips: M2 -> 6 blank of 22 rendered, M3 -> 7
# blank of 21. C2 did NOT trip on either, and the reason is in the gate's own output:
# every blank the mutations produce is reported "1/1 blank" — the emptied pool yields a
# ONE-ITEM section, not a two-item superset with a nameless second member. So the ruled
# framing "a blank SUPERSET row" is wrong in detail; the symptom is a blank ROW. C2 as
# written was the same vacuity defect one level down: a green that no artifact can turn
# red. It is re-pointed a second time, not deleted.
#   C1  keeps the symptom AND absorbs C2's only gated content (rows == items, so a row
#       cannot be silently dropped). Nothing C2 gated is lost.
#   C2  becomes the DETECTOR SELF-TEST: a real sampled section is re-rendered with a
#       second item that has no name — the exact shape the 8302 guard stops legIso[1]
#       writing — and the same slotText path must report that row blank. It fails if the
#       ex-name markup drifts or the harvest goes blind, which is the failure that would
#       otherwise turn C1 green for the wrong reason.
import io, os, sys

G197 = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'gates', 'g197_leg_accessory.js')

EDITS = []

EDITS.append((
"""//   OLD C1 "all four surfaces ran on every sampled day" — rRan is incremented before the
//   try, so it could not fail for any artifact. OLD C2 "no render surface threw" — no
//   reachable artifact throws. Both were the V195 vacuity defect: a green `ok` reading as
//   coverage. They are NOT deleted, they are RE-POINTED at the symptom that is real, and
//   harvested from rendered output: a superset row with nothing in its name slot.""",
"""//   OLD C1 "all four surfaces ran on every sampled day" — rRan is incremented before the
//   try, so it could not fail for any artifact. OLD C2 "no render surface threw" — no
//   reachable artifact throws. Both were the V195 vacuity defect: a green `ok` reading as
//   coverage. They are NOT deleted, they are RE-POINTED at the symptom that is real, and
//   harvested from rendered output: a row with nothing in its name slot.
// A ROW, NOT A SUPERSET ROW, AND THE MUTATIONS ARE WHY. The first re-point put C2 on a
// blank slot inside a MULTI-ITEM row. C1 trips on M2 (6 blank of 22 rendered) and on M3
// (7 of 21); C2 tripped on neither, because every blank those mutations produce is
// reported "1/1 blank" — an emptied pool yields a ONE-ITEM section, not a two-item
// superset carrying a nameless partner. So C2 was re-pointed a second time rather than
// left green-by-construction. C1 now owns the symptom and the row count (a row may not
// be dropped either); C2 is the DETECTOR SELF-TEST that stops C1 going green blind.""",
    'C header: why C2 moved twice',
))

EDITS.append((
"""ok('C1 every rendered row carries a name the athlete can read (no blank name slot)',
   blankRows === 0 && rowsRendered > 0, blankRows + ' blank of ' + rowsRendered + ' rendered');
ok('C2 every multi-item (superset) row renders one named row per item, none blank, none dropped',
   ssSections > 0 && ssBlank === 0 && ssShort === 0 && rowsRendered === rowsExpected,
   ssSections + ' sampled, ' + ssBlank + ' with a blank slot, ' + ssShort + ' short-rendered, rows ' + rowsRendered + ' vs items ' + rowsExpected);""",
"""ok('C1 every rendered row carries a name the athlete can read, and no item loses its row',
   blankRows === 0 && rowsRendered > 0 && rowsRendered === rowsExpected,
   blankRows + ' blank of ' + rowsRendered + ' rendered, ' + rowsExpected + ' items expected'
   + (ssSections ? ' (' + ssSections + ' multi-item rows sampled, ' + ssBlank + ' blank, ' + ssShort + ' short)' : ''));
// C2 — THE DETECTOR, PROVED. C1's green is worth nothing if a blank row could not be seen
// in the first place: rename the ex-name span in the app and slotText harvests nothing,
// blankRows stays 0 and C1 reads as coverage. So the same harvest is pointed at a section
// that is KNOWN to have a nameless row — a real sampled section, re-rendered with a second
// item carrying no name, which is the exact shape the 8302 guard stops legIso[1] writing.
// Gatekeeper proved this shape does not throw; it renders `<span class="ex-name"></span>`.
// The oracle is the injected item, not the engine: we know what went in.
let probeRan = false, probeNames = 0, probeBlank = 0, probeErr = '';
{
  const rd = renderDays.filter(d => d.sec && (d.sec.items || []).length > 0)[0];
  if (!rd) probeErr = 'no sampled section had an item to build the probe from';
  else {
    const probe = Object.assign({}, rd.sec, { items: (rd.sec.items || []).slice(0, 1).concat([{ name: undefined, detail: '3×12' }]) });
    IA.window.__SEC = [probe];
    try {
      const h = IA.eval('buildSectionsHTML(__SEC,0)');
      const got = slotText(String(h || ''));
      probeRan = true; probeNames = got.length; probeBlank = got.filter(n => !n).length;
      console.log('   -- detector probe on ' + rd.tier + ': 2 items in, ' + probeNames + ' name slots out, ' + probeBlank + ' blank');
    } catch (e) { probeErr = e.message; }
  }
}
ok('C2 the blank-row detector is not blind: a nameless second item is harvested as a blank row',
   probeRan && probeNames === 2 && probeBlank === 1,
   probeErr || (probeNames + ' slots, ' + probeBlank + ' blank — expected 2 and 1'));""",
    'C1 absorbs rows==items; C2 becomes the detector self-test',
))

src = io.open(G197, encoding='utf-8').read()
bad = 0
for a, _, label in EDITS:
    n = src.count(a)
    print('anchor %-3s %s' % (n, label))
    if n != 1:
        bad += 1
if bad:
    sys.stderr.write('ABORT: %d anchor(s) not count==1. Nothing written.\n' % bad); sys.exit(1)
for a, b, _ in EDITS:
    src = src.replace(a, b, 1)
io.open(G197, 'w', encoding='utf-8').write(src)
print('wrote ' + G197)
