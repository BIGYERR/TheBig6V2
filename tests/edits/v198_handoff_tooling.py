import io
P='IRON_ASYLUM_HANDOFF_1_1.md'
s=io.open(P,encoding='utf-8').read()
def rep(old,new,label):
    global s
    n=s.count(old); assert n==1,'ANCHOR %s count==%d (want 1)'%(label,n)
    s=s.replace(old,new)
def droplines(prefix,label):
    global s
    lines=s.split('\n')
    hits=[i for i,l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits)==1,'DROP %s count==%d (want 1)'%(label,len(hits))
    del lines[hits[0]]
    s='\n'.join(lines)

# ── registry: D90 -> D91 ──────────────────────────────────────────────────────
rep('highest assigned = D90. Next free = D91.','highest assigned = D91. Next free = D92.','reg')

# ── §12: the three tooling items are DONE — delete, do not annotate ───────────
droplines('- **NEXT TOOLING PASS, ITEM 1 of 3 — `gate.sh` cannot see a REFUSED assertion','t1')
droplines('- **NEXT TOOLING PASS, ITEM 2 of 3 — `g193_budget_floor` B4g will fail V199','t2')
droplines('- **NEXT TOOLING PASS, ITEM 3 of 3 — `g197d_d84_base` still carries ZERO mutation coverage','t3')

# ── §12: the lens entry now names which copies remain ─────────────────────────
rep('Fix the line next time the script is touched; do not re-derive the bias claim, it was measured and is false.',
    'The GATE copy (`tests/gates/g197c_d84_cmp.js:174`) was narrowed to the shipped lens in the V198 tooling pass and proved inert: gate stdout byte-identical on three invocations, and an independent probe found **31 of 2,879 leg cells name a `leg_iso` movement at all, and all 31 also carry hinge or hip_ext, so 0 cells can ever distinguish the two lenses.** The two MEASURE copies (`v198_d85_posterior_floor.js:91`, `v198_d85_tier3_exemption.js:63`) still carry the wide set. Fix them next time either is touched; do not re-derive the bias claim, it was measured and is false.','lens')

# ── §12: new items from the tooling pass and the D88/D91 rulings ──────────────
NEW='''- **`g193_gear_gates` and `g193_rotation_reach` still exit 1 with NO diagnostic — the same defect in a THIRD shape (V198 tooling, gatekeeper).** The V198 pass fixed `gate.sh`'s detail grep from `^FAIL` to `^[[:space:]]*FAIL`, which recovered the diagnostic for the **10 of 23** gates that print an indented `  FAIL `. These two print neither form: they collect failures and emit them under a `FAILURES:` header as `  - <msg>`, which matches neither grep. A real failure in either still costs the whole diagnostic. Fails closed, so cosmetic — and it is the third distinct shape of "the runner cannot see this gate's failure text", after the bare `^FAIL` and the REFUSED bucket.
- **The `leg_iso` lens is now defended by exactly ONE assertion, and nothing else ever can be (V198 tooling, slice E).** Gatekeeper's probe: **0 of 2,879 leg cells distinguish `{hinge,hip_ext}` from `{+leg_iso}`**, so no lattice sweep and no app mutation can red a regression back to the wide set. A hand-built `{Back squat, Leg extension}` card asserted posterior-FREE, in `g197c_d84_cmp`'s E3a family, is the only detector that can exist. **If that probe is ever deleted the lens becomes unassertable again** — it is not redundant with anything.
- **D88 is RESCOPED and is now low priority (V199, coach retracted its own mechanism, Mario concurred).** D88 blamed the `legIso` draw at `index.html:8342`. Measured: the pool held a posterior member **10,080/10,080** draws and the draw PICKED one **10,056/10,080 (99.76%)**; all six tiers carry all three posterior members after `_gear`; and the `Leg press` on the card D88 quoted is the **main squat-slot** override at `7628`, `_pattern` `squat`, never a `leg_accessory` draw at all. **A pool-side rule reaches 146/746 weeks and the section survives to the shipped card in 4 of them: realised yield 746 -> 742.** D88 buys four weeks. What survives is the OBSERVATION — a lowback/protect athlete on commercial gets an all-quad, all-abductor leg card for a spine — not the mechanism.
- **The race-week taper is CORRECT BY DESIGN, and the population is 506 from here (V199, coach, Mario concurred).** 240 of the original 746 zero-posterior weeks are W13/W14 on `goal=half` — the taper, from the engine's own `taperWeeks` at `index.html:3418`, which for a 14-week half is exactly 2. Three reasons: the run IS loaded hip extension in taper and a "must carry a hinge LIFT" predicate is the wrong lens on it; the hinge is the highest-eccentric, longest-DOMS lift in the file and its last heavy session belongs 10-14 days out, which is where W13 opens; and **a hinge in W14 would VIOLATE D37/D38** (primer only through three days out, nothing from two days out, foot/ankle mobility only), so adding one is a doctrine breach, not a fix. **746 is retired as a number. Quote 506.** Coach flagged that stage 5 likely holds W13 12 + W14 12 = 24 more, making **482** the likely floor, but did not isolate them — so 506 is what the attribution boundary supports.
- **WATCH, not built: the taper primes a squat and never a hip extension.** W14 ships `Primer — <squat>` plus `Foot & ankle — mobility only`, so the glutes enter a hip-extension race un-primed at zero fatigue cost. Argues for swapping the W14 primer PATTERN, never for adding a hinge. A primer is a pattern rehearsal and the athlete rehearses the race pattern on the shakeout.
'''
rep('## 12. Open / carried forward\n\n','## 12. Open / carried forward\n\n'+NEW,'12new')

# ── queue line: D88 demoted, D91 added ────────────────────────────────────────
rep("Queue, ALL RULED AND CONCURRED, none built: **D88** (the 746 draw-side zero-posterior weeks no floor can reach — a lowback athlete on commercial gets six movements, all quad or abductor, on a card for a back injury; pool-side rule, wants its own before-picture) · ",
    "Queue, ALL RULED AND CONCURRED, none built: **D89 = V199** (re-source `capSessionBudget`'s tier-3 skip: name core explicitly and make the barbell exemption require an implement token rather than fall through to it — the exemption is asserted by NO gate today) · **D91** (`recoveryDeload` keeps its one surviving accessory block by PATTERN, not by push order — 320 of the 506 zero-posterior weeks, the biggest single lever; 6-8 lines with a card-ORDER constraint, so V200 behind a mandatory counterfactual measure pass) · **D88, LOW PRIORITY and rescoped** (the pool-side rule at `index.html:8342` reaches 146/746 weeks and realises 746 -> 742; its stated draw mechanism was measured and RETRACTED) · ",'queue')
io.open(P,'w',encoding='utf-8').write(s)
print('handoff: tooling + D88/D91 rulings OK')
