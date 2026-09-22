#!/usr/bin/env python3
# V202 slice 7 — two new sabotage mutations, one per new gate row family.
#   M23 -> g202_pace_copy.js     (S1: the appendix goes back to being conditional on the limb)
#   M24 -> g202_int_doctrine.js  (S2: ONE of the four ruled INT notes takes the cap of 10 back)
# Also refreshes one note's prose that described the old cap.
import io, json, os
ROOT='/Users/CanasBangin/Desktop/TheBig6V2'
SAB=os.path.join(ROOT,'tests','sabotage','v202.json')
APP=os.path.join(ROOT,'index.html')
def read(p):
    with io.open(p,encoding='utf-8') as f: return f.read()

app=read(APP)
raw=read(SAB)
spec=json.loads(raw)
print('mutations before:', len(spec))

M23_ANCHOR = "          if(_psShift > 0) note += ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';"
M23_REPL   = "          if(_psShift > 0 && !pp._goalMet) note += ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';"

RULED_INT = "INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop."
M24_ANCHOR = ("          } else {\n"
              "            note = '" + RULED_INT + "';\n"
              "          }\n"
              "          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about")
M24_REPL   = M24_ANCHOR.replace("Hard cap at 8.", "Hard cap at 10.")

NEW = [
 {"name": "M23 -> S1 is half-reverted: the re-sited D2b-iii appendix keeps its single site but takes a "
          "limb test back, so a goal-met athlete under an injury shift is once again told nothing about the "
          "frozen pace clock. Dampened and on-schedule athletes still read it, which is the population a "
          "spot-check is most likely to sample, and every prescribed second is untouched",
  "anchor": M23_ANCHOR,
  "replacement": M23_REPL,
  "gate": "gates/g202_pace_copy.js",
  "note": "NAMED TRIP: g202_pace_copy C10, the appendix sweep. The goal-met x non-zero-shift class "
          "(57 of 293 INT cards on the 54-cfg lattice) loses the sentence. C10a stays GREEN because all "
          "three classes are still REACHED, C11 stays GREEN because the zero-shift side is untouched, and "
          "C12/C13 stay GREEN because the notes that do carry it carry it correctly and once. This is "
          "exactly the defect slice 5 introduced and slice 7 fixed, so a suite without C10 would ship it twice."},
 {"name": "M24 -> ONE of the four copies of the ruled generic INT note takes the cap of 10 back. The other "
          "three still read 8, so the string looks maintained wherever a reviewer greps; the copy that "
          "regresses is the one on the progression path, which is the note the athlete with a pace goal "
          "actually reads. No prescribed rep count changes: getINTReps still caps at 8, so the card now "
          "promises two intervals the engine will never write",
  "anchor": M24_ANCHOR,
  "replacement": M24_REPL,
  "gate": "gates/g202_int_doctrine.js",
  "note": "NAMED TRIP: g202_int_doctrine D9 (source count falls 4 -> 3 ruled, 0 -> 0 legacy full sentences) "
          "and D9b (the RENDERED note on the generic cfg stops matching the ruled string). D9d stays GREEN "
          "because the engine's prescribed maximum is still 8 and RULED_INT_NOTE is the gate's own typed "
          "oracle, which is the point: only a row that reads the artifact catches a note that lies about "
          "code that is correct. This mutation is why the set replacement is asserted as a count, not "
          "as four independent anchors."},
]
for m in NEW:
    c = app.count(m['anchor'])
    print('  %s anchor count==1 (found %d) %s' % (m['name'].split(' ->')[0], c, 'OK' if c==1 else 'MISS'))
    if c != 1: raise SystemExit('ABORT: anchor not unique. Nothing written.')
    assert m['anchor'] != m['replacement'], 'no-op mutation'

# refresh the one note whose prose quoted the old cap
old_prose = 'The athlete is told to build from 4 reps to 10'
hits = [i for i,m in enumerate(spec) if old_prose in m.get('note','') or old_prose in m.get('name','')]
print('  stale-cap prose hits:', hits)
for i in hits:
    for k in ('name','note'):
        if old_prose in spec[i][k]:
            spec[i][k] = spec[i][k].replace(old_prose, 'The athlete is told to build from 4 reps to 8')

spec.extend(NEW)
labels = [m['name'].split(' ->')[0].strip() for m in spec]
assert labels == ['M%d' % (i+1) for i in range(len(spec))], 'labels not unique+contiguous: %s' % labels
with io.open(SAB,'w',encoding='utf-8') as f:
    json.dump(spec, f, ensure_ascii=False, indent=2)
    f.write('\n')
print('mutations after:', len(spec), '| labels', labels[0], '..', labels[-1], '| unique:', len(set(labels))==len(labels))
