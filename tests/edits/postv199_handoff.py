import io,sys
P='IRON_ASYLUM_HANDOFF_1_1.md'
s=io.open(P,encoding='utf-8').read()
orig=s
def rep(old,new,label):
    global s
    n=s.count(old)
    assert n==1, 'ANCHOR %s count==%d (need 1)'%(label,n)
    s=s.replace(old,new)
    print('OK  '+label)

# 1. registry
rep('highest assigned = D92. Next free = D93.',
    'highest assigned = D95. Next free = D96.','registry')

# 2. header bullet
rep('\n- **Most recent work (V198): D85',
    '\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout.** '
    'Opened on §12 item 1 of 4, the pull A/B swap shipping with zero gate coverage. The proposed per-card block-count '
    'identity was measured BLIND to the two swap-specific regressions and did not ship. P1/P2 were written into `g199` and '
    'were **vacuous there** (1,440 both-enter pull cards, 0 with a posterior B, V198 and V199 byte-identical), which builder '
    'disclosed rather than shipping green; coach retracted its own siting line. Coverage now lives in a new '
    '`tests/gates/g200_pull_arbitration.js` over a 60-config lattice that contains the population, RED on V198 by exactly 150 '
    'violations and green on V199. D94 (the deload deletes the day’s only vertical pull on 150 cards) and D95 (every pinned '
    'assertion prints its positive-limb population) issued, both unbuilt. Gatekeeper GREEN on the second pass after M1 survived '
    'the first.\n\n- **Most recent work (V198): D85','header bullet')

# 3. 10b lessons
rep('- **(V199) A placement spec written against the SOURCE layout',
    '- **(Post-V199) A gate lattice that cannot reach a phenomenon reports PASS, and PASS is what hides it.** `g199`’s two '
    'seeds and three goals produce 1,440 both-enter deload pull cards and **0** holding a posterior, on V198 and V199 alike, so '
    'the pull pins could not tell the two artifacts apart and still read green. A pin is only an oracle where its positive limb '
    'has a population. **Before siting an assertion, prove its lattice contains the thing it asserts about** — run it against '
    'the PREDECESSOR and require it to be RED there. A gate green on both versions is not testing what it claims.\n'
    '- **(Post-V199) Re-pinning many hand numbers at once converts a gate into a readback of the candidate.** Every in-place fix '
    'for the above cost 28 to 33 re-pins of 56. Those pins are oracles ONLY because each was derived from the predecessor when '
    'its ruling shipped; re-typing 33 of them in one pass off the current artifact destroys that standing wholesale. A new file '
    'on a small containing lattice (60 configs, 3.5% of the cells) re-pinned nothing.\n'
    '- **(Post-V199) A clause can be unfalsifiable by CONSTRUCTION, and no lattice fixes that.** The `break` in the posterior '
    'pre-pass is observable only on a card holding two posterior candidate blocks. A pull card holds at most one, by section '
    'composition. 10,443 of 217,728 deload builds carry two, **0 involving pull**. When a mutation survives, measure whether the '
    'population exists at all before widening anything — the answer may be that the assertion must narrow its claim and the '
    'mutation must move to the gate that can see it.\n'
    '- **(Post-V199) A licence written as prose is not a licence.** A comment telling a future reader "a trip here is expected '
    'after D94" expires never and trips never. A licence is a predicate on the ARTIFACT that refuses loudly once its era ends. '
    'Key it on something that exists today (`ia-version`), never on the version an unbuilt ruling will ship on.\n'
    '- **(V199) A placement spec written against the SOURCE layout','10b')

# 4. 11f
rep('### V199 — D91, the deload keeps the pattern',
    '### Post-V199 — the tooling pass that re-sited itself twice (Mario: "coach’s order, ship D93 now", "Keep the predicate", "Commit, no V200 tag")\n'
    '- **A tooling pass does not bump `ia-version`, and it does not get a tag (Mario, post-V199).** D93 ships 0 hunks in '
    '`index.html`, so the artifact stays at 199 and no `V200` tag is cut: tags track `ia-version`, and a `V200` tag would point '
    'at a file reading 199. The label "V200" in §12’s tooling items was a misnomer from the start. Precedent followed: the '
    'V198 tooling pass, digest line only.\n'
    '- **The g200 pull pins carry a REAL expiry, and the first V201 build pays for it (Mario, post-V199, recommendation '
    'accepted with the cost stated).** `g200` reads `ia-version` off the candidate, arms P2/P2c/P4/P6 at `<= 200` and REFUSES '
    'all four above it; `tests/gate.sh` blocks at two independent guards (:85 and :96), proved by running the real suite against '
    'an artifact forced to 201. **This reds the first V201 build whether or not D94 is in it.** Mario took the tax rather than '
    'let a gate keep asserting in green a pull survivor coach has already ruled coaching-wrong — the failure E5 paid for. The '
    'rejected alternative was prose plus a §12 note.\n'
    '- **Coach may retract its own ruling, and did (post-V199).** Coach sited the pull oracle in `g199` and listed that lattice '
    'as untouchable in the same breath, before anyone had checked the lattice could see the phenomenon. Builder’s vacuity '
    'disclosure forced the retraction. **A ruling written ahead of the measure that would test its premise is a hypothesis.**\n'
    '- **Gatekeeper’s recommendation was INVERTED by measure, and the inversion was then verified adversarially '
    '(post-V199).** Gatekeeper called re-declaring sabotage M1 to `g199` "only relabels the hole" and named a lattice extension '
    'the honest fix. Measure proved the opposite: the population is structurally absent from pull and present on leg, where '
    '`g199` already tests it. Gatekeeper then re-derived the reconciliation itself — 1,080 + 240 + 30 = **1,350, exactly '
    'G1’s hand pin**, by a differently-shaped count (drop events vs label co-occurrence). **An agent’s recommendation is '
    'evidence, not a verdict; send it back to measure before acting on it.**\n\n'
    '### V199 — D91, the deload keeps the pattern','11f')

# 5a. delete closed 12 item 1
i=s.find('- **NEXT TOOLING PASS (V200), ITEM 1 of 4')
j=s.find('- **NEXT TOOLING PASS (V200), ITEM 2 of 4')
assert i>0 and j>i, 'ITEM 1/2 bounds'
s=s[:i]+s[j:]
print('OK  delete 12 item 1 (closed)')

for n in ('2','3','4'):
    rep('- **NEXT TOOLING PASS (V200), ITEM %s of 4'%n,
        '- **NEXT TOOLING PASS, ITEM %s of 4 (item 1 CLOSED post-V199)'%n,'relabel item '+n)

# 5b. new 12 entries
rep('## 12. Open / carried forward\n',
    '## 12. Open / carried forward\n\n'
    '- **D94 — THE DELOAD PULL DAY KEEPS THE PATTERN ITS MAIN ALREADY CARRIES (coach, post-V199, RULED AND UNBUILT).** On a '
    'deload pull day the Main is a deadlift variant by construction (`Main — ex.backMain`, index.html:8202), so the Main IS '
    'the day’s hip extension. D91’s swap then keeps `Pull superset B` because its `ex.cond[2]` CONDITIONING draw happened to '
    'be a `Kettlebell swing`, and deletes `Pull superset A` — the day’s only vertical pull. **150 of 1,120 deload day builds '
    'on the ruled lattice ship this card, 150/150 surviving `capRegionalFatigue` and `capSessionBudget` to the athlete.** The '
    'strength/hypertrophy branch (`Row volume`, :8223) is the CONTROL and keeps the right survivor, so the BALANCED athlete gets '
    'the worse card and nobody else does. Mario’s own program is byte-identical by seed luck only: his pull-day `ex.cond[2]` '
    'partners are broad jumps, burpees and jump squats, none a hinge. **The singleton "swing alone" shape does NOT occur** — 0 '
    'of 20,480 dayCells across two artifacts — so that sentence and old measure item (4) are struck as falsified. Proposed '
    'fix, NOT ruled until measured: the pre-pass (9404-9413) arbitrates only when no Main section holds a posterior under the '
    'same lens. Measure required first, in order: (1) posterior-Main count on the 135/405 swapped cards; (2) the "Main posterior '
    'AND a posterior accessory candidate" population across leg/pull/push, which is D94’s whole blast radius; (3) vertical-pull '
    'loss; (4) the singleton case — STRUCK; (5) why lowback/protect is 0; (6) the writer of the 3/135 `Dumbbell split-stance '
    'deadlift`; (7) why 5K/10K/test/liftonly contribute 0; (8) on the injury diagnostic, the 60 cards where the survivor moved '
    'from a singleton A to a two-item B, and whether they gained the swing under a hinge Main. **D94 will trip `g200`’s expiry '
    'predicate by design — it must bring its own after-grid and re-pin P2/P2c/P4/P6.**\n'
    '- **D95 — EVERY PINNED ASSERTION PRINTS THE POPULATION ITS POSITIVE LIMB EXERCISED (coach, post-V199, RULED, applied '
    'gate by gate).** The defect is not a two-seed lattice; measure showed `g199`’s seeds are indistinguishable on every shape '
    'metric from seeds that fire. The defect is accepting a pin without printing the population it ran on — which is how P1/P2 '
    'read green over a blind spot. **Applied as each gate is NEXT TOUCHED, never as a sweep**, because a sweep re-pins hundreds '
    'of hand numbers off the candidate. Measure named: a one-shot liveness census across `tests/gates/*.js` listing, per '
    'assertion, whether its stated population is 0 on the shipped artifact.\n'
    '- **`g200`’S ENTIRE POSITIVE LIMB IS ONE MOVEMENT NAME, and it is now pinned (post-V199).** `Pull superset B`’s only '
    'posterior-capable slot is the `ex.cond[2]` draw at index.html:8228, off `EXLIB.conditioning` (:1626) = six names of which '
    '**exactly one** is posterior; `_bwFlat` (:7922) substitutes six of which **zero** are, which is why bodyweight is excluded '
    'from the lattice. Wide lattice: posterior items held there = `{Kettlebell swing: 7,200}`, **7,200 of 7,200, 100%**, and no '
    'other posterior name appears in that section’s 15-name occupancy census. Removing the swing from the pool takes P2c 150 '
    '-> 0 and with it P2’s positive limb, P4’s 150/150 and P1’s V198/V199 split. **Any draw-side edit to '
    '`EXLIB.conditioning` reaches `g200` first**; P6 pins it as an equality and sabotage M4 trips P6 and P2c together. By '
    'contrast the leg limb is carried by 17+ names.\n'
    '- **`Lower strength` IS READ BY NO ASSERTION IN EITHER GATE (post-V199, D95 class).** It holds posterior work on **17,496 '
    'single-block deload cards** over the wide lattice (31,752 configs / 217,728 deload day builds) and neither `g199` nor '
    '`g200` counts it. Coach ruled it its own entry rather than a D94 item, so a tooling gap is not held hostage to an engine '
    'build. Measure named: on `g199`’s lattice, how many deload builds carry `Lower strength` as the SOLE posterior candidate, '
    'and whether the survivor is that block on every one (it must be, by the loop — the claim to add is the equality). Lands '
    'in `g199` as a family census line when `g199` is next touched, per D95.\n'
    '- **`E_PAT` AND `cls()` NOW LIVE IN TWO GATE FILES (post-V199, debt, deliberate).** Coach licensed either a shared module '
    'or byte-identical duplication with the probe asserted in BOTH files; the duplicate path was taken to avoid restructuring '
    'two gates at the tail of a pass already re-sited twice. Verified byte-identical by gatekeeper independently of builder’s '
    'own script (which first reported a FALSE differs from its own region delimiter). **Two copies are two lenses waiting to '
    'diverge** — `g199` A5 and `g200` A5 are the only thing holding them together. Recommend lifting all three into '
    '`tests/g200_oracle.js` the next time either gate is opened.\n'
    '- **`A5` CAN NEVER BE TRIPPED BY SABOTAGE, and that is correct (post-V199, gatekeeper).** It asserts gate code against a '
    'hand table; `sabotage.py` mutates `index.html` only, so no app mutation can reach it. It is a genuine split-lens drift '
    'guard, NOT vacuous — but it must never be cited as coverage of engine behaviour. Same standing as `g196_ledger`’s A0/B0.\n'
    '- **`tests/sabotage/v200.json` M2’s COLLATERAL NOTE READS EXHAUSTIVE AND IS ILLUSTRATIVE (post-V199, gatekeeper).** The '
    'note lists C1, C2, C4, E3, F1, F2, G5, H5; the run also fails C6, E1b, E5, E6, G2b, I2. The declared gate and assertions '
    'trip correctly so it is not a defect, but a reader treating the list as complete will mis-size a future blast radius.\n'
    '- **THE HEADER HAS NO "Most recent work" BULLET FOR V199 (post-V199, record defect).** The top work bullet is V198; V199’s '
    'summary lives only in the working-file line and its digest entry. Not a dropped build — the V199 digest line is present '
    'and complete — but the header’s rotation was skipped. Fix on the next build that touches the header.\n',
    '12 new entries')

# 6. digest
rep('\n- **V199 — D91, the deload stops deleting',
    '\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout, no tag cut.** '
    'Opened §12 item 1 of 4: the pull A/B swap shipping with zero gate coverage. **The proposed fix did not survive measure.** '
    'A per-card block-count identity was probed against five hand-built mutations and found BLIND to the two swap-specific '
    'regressions (last-posterior-wins, swap reverted to push order) at 312 and 994 differing cards, while redundant with F4/F5. '
    '§12’s "606 differences" **did not reproduce on any lattice** — actual 135 on L-healthy (2,916 configs / 214,326 cards) '
    'and 405 on L-injury (1,296 / 145,152); the three conservation figures (30,592, 79,733, 4,509 swapped) reproduced exactly, '
    'so only the population figure was unsourced. **Retired.** Coach ruled D93, sited it in `g199` — and builder then disclosed '
    'that P1/P2 were VACUOUS there: 1,440 both-enter pull cards, **0 holding a posterior**, V198 and V199 byte-identical, PASS '
    'over a blind spot. Coach **retracted its own siting line**. Every in-place fix cost **28 to 33 re-pins of 56**; a new '
    '`tests/gates/g200_pull_arbitration.js` over a 60-config / 5,120-cell mini lattice (3.5% of `g199`’s cells) re-pinned '
    'NOTHING and contains 150 swap cards. Pins, all measured on both artifacts: **P1 1,470 == 1,470**, **P2c 150 == 150** (read '
    'off p1, the deload’s INPUT, which is what makes it an oracle), **P2 0 violations on V199 and exactly 150 on V198**, **P4 '
    '150/150 vs 0/150**. `g199` keeps **P0**, an equality pinning its own blindness at 1,440/0 and naming `g200` as the real '
    'oracle. First gatekeeper pass came back **RED**: sabotage M1 SURVIVED. Measure proved why, and it inverted gatekeeper’s '
    'recommended fix — a pull card holds **at most ONE** posterior candidate block by construction, so first-wins and '
    'last-wins select identically; **10,443 of 217,728 deload builds carry two, 0 involving pull**, and eleven costed lattice '
    'extensions all contain the population only as LEG cards `g200` does not read. **No lattice change could fix it.** M1 '
    're-declared to `g199` G1/G2, where the clause IS tested on 1,776 of 15,360 deload builds — and gatekeeper then '
    'adversarially re-derived the reconciliation itself, 1,080 + 240 + 30 = **1,350, exactly G1’s hand pin**, by a '
    'differently-shaped count. **P6 ships**: `g200`’s whole positive limb is ONE name, `{Kettlebell swing: 150}`, 7,200/7,200 '
    'on the wide lattice, now pinned as an equality. P2’s prose licence replaced by a REAL predicate on `ia-version`, proved '
    'to block the real suite at `gate.sh:85` and `:96` — **the first V201 build reds whether or not D94 is in it**, Mario’s '
    'accepted cost. GREEN: 25 gates, `g200` **15/0** on V199 and **13/2** on V198, `g199` **56/0** (HEAD was 54 — builder’s '
    '"56 before and after" was wrong and there is **no CLASS R removal in the shipped diff**, since P1/P2 never reached HEAD), '
    'sabotage **5/5** and **8/8** on v199, 0 NOT-APPLIED, 0 CRASH, 7 hunks 100% classified with 0 assertion rows deleted, fuzz '
    'identity EXACT, digest `6e32421331693437` unmoved. Issued: **D94** (the deload deletes the day’s only vertical pull on '
    '150 shipped cards; its "swing alone" worst case struck as falsified, 0 of 20,480) and **D95** (every pinned assertion '
    'prints its positive-limb population, applied gate by gate, never as a sweep). Both unbuilt.\n'
    '\n- **V199 — D91, the deload stops deleting','digest')

assert s!=orig
io.open(P,'w',encoding='utf-8').write(s)
print('WROTE '+P)
