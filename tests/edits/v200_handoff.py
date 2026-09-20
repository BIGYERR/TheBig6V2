import io
P='IRON_ASYLUM_HANDOFF_1_1.md'
s=io.open(P,encoding='utf-8').read(); orig=s
def rep(old,new,label):
    global s
    n=s.count(old); assert n==1,'ANCHOR %s count==%d'%(label,n)
    s=s.replace(old,new); print('OK  '+label)
def cut(start,nxt,label):
    global s
    i=s.find(start); j=s.find(nxt)
    assert i>0 and j>i,'BOUNDS '+label
    s=s[:i]+s[j:]; print('OK  cut '+label)

rep('`index.html` — **V199**; `<meta name="ia-version">`=**199**. Built in order after V198.',
    '`index.html` — **V200**; `<meta name="ia-version">`=**200**. Built in order after V199. '
    '**V200 BUILT D89: one engine clause — a drill declared family `core` in `_AUX_FAMILY` is never a loaded compound — '
    'plus the digest-pin re-siting it forced.**','working file')

rep('highest assigned = D95. Next free = D96.','highest assigned = D97. Next free = D98.','registry')

rep('\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout.** Opened on',
    '\n- **Most recent work (V200): D89 — a drill the author declared `core` is never a loaded compound.** '
    '§12 said `_compoundTier` had seven readers and one measured; the six-reader measure ran (1,728 configs / 95,232 day cells / '
    '349,709 swappable items) and found the flagship defect was **one name**. `Pallof press` is tier 3 because `_isCompound` (`:9313`) '
    'matches the bare substring `press` and `_compoundTier` ends in an unguarded `return 3`. Of 23 `_AUX_FAMILY==='
    '’core’` names, 22 returned 0 and it returned 3. Cost: **54,672 "Much lighter than pallof press" lines, 26.26% of every '
    'load note ever displayed**, and a chip row printing **`CORE` and `HEAVY COMPOUND` side by side on the same anti-rotation drill**. '
    'Coach ruled ONE LINE in `_compoundTier` (`if(_auxFamily(name)===’core’) return 0;`) and **rejected the token model as '
    'doctrine** — `Close-grip bench press`, `Sumo deadlift`, `Deadlift`, `Front squat`, `Back squat`, `Pendlay row` ARE tier 3 and '
    'demoting them would make real leg and press work trimmable. It also **overturned the earlier Mario-concurred D89 form** by printing '
    'four HALF_MANNY cards where protecting all core at the budget spends a loaded press to keep a second rotation drill, inverting hard '
    'days hard. Mario accepted the overturn and his own changed card. Exactly **one name of the universe moves**, exactly one HALF_MANNY '
    'cell (**W11 MON `Core — Anti-Rotation[Pallof press]` -> `[Plank shoulder taps]`**), digest `6e32421331693437` -> '
    '`d4364dd3fa63a3a1`, readers R1-R4 move by **0**. `_isCompound` and `_itemCost` ruled OUT and proved byte-identical. GREEN: 26 gates '
    '**ALL PASS** 0 REFUSED, sabotage **9/9** and **8/8**, 17 hunks 100% classified, fuzz 1,945 configs / 118,034 cells / 126 differences '
    '**all of the ruled shape**. Issued: **D96** (the load-tier table, absorbing D82) and **D97** (the `_itemCost` cost lens).\n'
    '\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout.** Opened on','header V200')

rep('\n- **Most recent work (V198): D85',
    '\n- **Prior work (V199): D91 — the deload stops deleting the day’s only hip extension.** `recoveryDeload` kept its one '
    'surviving accessory block by PUSH ORDER, so on every deload leg day it kept a second squat-pattern block and deleted the day’s '
    'only hip extension. 374 deload weeks flip, all 374 survive to the shipped card, whole lattice 746 -> 372 zero weeks, 0 going the '
    'wrong way. Coach corrected its own headline number unprompted (ruled 320, measure said 374). Three of the four reds on the candidate '
    'were confinements built the session before, firing correctly on their first real edit. *(Header bullet added at V200; the V199 '
    'session folded its work into the working-file line and the digest only.)*\n'
    '\n- **Prior work (V198): D85','header V199')

rep('- **(Post-V199) A gate lattice that cannot reach a phenomenon',
    '- **(V200) A "nothing moved" digest pin is a claim about a DIFF, and is true only for the build that made it.** On a single '
    'artifact such a pin can only say "equals the ruled value". Pin the fixture digest by `ia-version` ERA, with the D-code that moved '
    'it, in one shared table — **five literals in four files broke on the first app change in three passes**, and a bare literal '
    're-pin also makes unrelated gates red on the PREVIOUS artifact, which `gate.sh` runs first. Row existence must be a CONJUNCT '
    '(`!!ROW && d===ROW`) so an absent row fails loudly instead of passing on `undefined===undefined`, and fails without throwing so the '
    'summary still prints. **A repoint is ruled only when the new digest was printed from a source-surgery copy BEFORE the build, the '
    'differential is fully classified into the ruling’s shape, and gatekeeper has shown the stale pin fails on the digest line and '
    'nothing else. A digest read off the built artifact after the fact is never a pin.**\n'
    '- **(V200) A dead constant is worse than a missing one, and a re-pinned dead literal is the worst of the three.** '
    '`g197b_sweep.js` declared a fixture digest that NO assertion read, for three passes, while looking maintained. Re-pinning it would '
    'have preserved the illusion. **Before repointing any pin, grep that something reads it** — `grep -c` the symbol and require '
    'more than the declaration.\n'
    '- **(V200) A measure script’s headline numbers can describe a hypothesis, not the build.** `v200_d89_tier3_readers.js` prints '
    '"D89 DELTA" figures of 2,773 / 58,992 / 135,956 which are MODEL A/B counterfactuals measured to CHOOSE a model; the shipped delta '
    'was 0 at those readers. **The correction belongs in the script header, where the misreading happens, not only in the handoff, which '
    'the next session may not read.**\n'
    '- **(Post-V199) A gate lattice that cannot reach a phenomenon','10b')

rep('### Post-V199 — the tooling pass that re-sited itself twice',
    '### V200 — D89, a declared core drill is not a compound (Mario: "V200 = D89", "Ship the core clause", "Add the assertion")\n'
    '- **A movement’s AUTHORED family outranks any inference from its name (D89).** `_AUX_FAMILY` is the authored truth about what a '
    'movement IS, and the swap sheet’s first chip already reads from it. When the same table gates the load tier, `CORE` and `HEAVY '
    'COMPOUND` cannot print together by construction, and `swapLoadNote` cannot claim top-end strength on a drill that has none to lose. '
    'The clause goes in `_compoundTier`, **not** `_isCompound`, because `_isCompound`’s readers were unmeasured at ruling time '
    '(there are exactly two: `_compoundTier` and `_itemCost`).\n'
    '- **A NAME is not a load classifier, and the token test is not the fix (D89, doctrine, coach over measure’s proxy).** '
    'Measure’s oracle was "no implement token", a proxy that cannot separate "wrongly tier 3" from "rightly tier 3, badly named". '
    '`Close-grip bench press`, `Sumo deadlift`, `Deadlift`, `Front squat`, `Back squat`, `Pendlay row` are real barbell lifts and tier 3 '
    'is CORRECT for them; demoting them would make real leg and press work trimmable. The load fix belongs in an explicit TABLE (D96), '
    'not the name (it is the athlete-facing string AND the `ia_exw_` slug key, so renaming breaks history) and not the regex (a proxy on '
    'a proxy is how this started).\n'
    '- **PROTECTING ALL CORE AT THE BUDGET IS WRONG, and the earlier D89 form is overturned (V200, coach reversed a Mario-concurred '
    'ruling with printed cards).** §12’s D89 said "name core explicitly" at the budget guard. Coach built that clause and printed '
    'four HALF_MANNY cards where it spends a loaded press to keep a SECOND rotation drill (W2 MON loses `Kettlebell single-arm press` for '
    '`Landmine rotations`; W6 MON loses `Dumbbell decline press`; W10 MON loses `Dumbbell lateral raise`; W11 FRI loses the `Delt '
    'finisher`). On an over-length day the second core drill goes BEFORE the accessory press. Protecting `Pallof press` alone was the '
    'accident written down as policy. **Mario accepted the overturn and the ~504 cards, including his own W11 Monday.**\n'
    '- **What shipped is the SKIP, not the PRICE (V200, coach amended its own rationale on challenge).** The budget no longer SKIPS '
    '`Pallof press` as a protected tier-3 compound (`:9595`); it still PRICES it at `sets × 1.5` (`:9362`, via `_itemCost`). The '
    'justification "the budget treats it like dead bugs" overclaimed and was narrowed BEFORE ship rather than after. `_itemCost` '
    'over-prices every non-heavy `_isCompound` name, `Band pull-apart` included, so it is a cost-lens ruling (**D97**), not a one-name '
    'patch.\n'
    '- **`g197b`’s dead digest constant gets the assertion it was missing, not deletion (Mario, V200).** Deleting was the minimal '
    'honest fix; adding leaves `g197b` with the identity check a sweep gate over that fixture should always have had. The reason is on '
    'record so the new gate obligation is not an unexplained surface.\n\n'
    '### Post-V199 — the tooling pass that re-sited itself twice','11f')

cut('- **THE HEADER HAS NO "Most recent work" BULLET FOR V199','- **`_compoundTier` HAS SEVEN READERS','V199 header gap (fixed)')
cut('- **`_compoundTier` HAS SEVEN READERS',"- **§12's DELETE-THE-GUARD FIGURES",'D89 (built)')

rep('## 12. Open / carried forward\n',
    '## 12. Open / carried forward\n\n'
    '- **D96 — THE LOAD-TIER TABLE, absorbing D82 (coach, V200, RULED IN DESIGN, UNBUILT).** D89 fixed the one declared-core name; '
    '**20 of 27 HEAVY COMPOUND-tagged movements still have no implement token**, and the fall-through reaches five readers. Coach '
    'REJECTED the token model as doctrine and ruled an explicit table. Draft, **for Mario’s review — his gym, his call**: tier 3 '
    '(barbell, bare name) `Deadlift`, `Sumo deadlift`, `Front squat`, `Back squat`, `Close-grip bench press`, `Pendlay row`, `Power '
    'clean`. tier 2 (loaded, not top-end) `Landmine rotational press`, `Landmine reverse lunge`, `Zercher single-leg deadlift`, '
    '`Bulgarian split squat`, `Walking lunge`, `Reverse lunge`, `Split squat`, `Squat (slow 3s tempo)`. tier 1 (machine/cable/suspension) '
    '`TRX row (if available)`, `Lat pulldown`, `Leg press` — **this row closes D82**, whose blocking swap-universe measure has now '
    'run. tier 0 (not a lift) `Jump squats` (also give it an `_AUX_FAMILY` row of `power` so the chip stops reading SQUAT), '
    '`Straight-arm pulldown`. Fixes R1’s three REAL protection inversions (`TRX row > Weighted chinups` 420, `Lat pulldown` 18, '
    '`Straight-arm pulldown` 12); the other 891 are ties between real barbell lifts broken by position, which is the right winner. '
    'In scope and NOT cosmetic: R3’s `Dumbbell goblet squat -> Jump squats` (3,534) is a like-for-like load failure the athlete acts '
    'on, and R4 reorders 47.59% of add-list renders. Measure named: a `table` variant of `tests/measure/v200_d89_tier3_readers.js`, same '
    'seven readers and denominators; **split the unilateral names’ R7 skips by equipment before Mario decides 2 vs 3**; and '
    '`_pattern(’Landmine rotational press’)` — if it is `hpress`, R2’s regression (a barbell bench press leaving a bench '
    'shortlist, 108) is a pattern-row defect the table will NOT fix.\n'
    '- **D97 — `_itemCost` PRICES EVERY NON-HEAVY `_isCompound` NAME AS A COMPOUND (coach, V200, ruled OUT of D89, UNBUILT).** '
    '`_itemCost` (`index.html:9362`) reads `_isCompound` directly, not `_compoundTier`, so after D89 the two lenses disagree about '
    '`Pallof press`: tier 0, priced `sets × 1.5` (3 sets = 4.5 against 3.0 for a genuine core name). Coach: 1.5× on a cable '
    'anti-rotation drill is wrong, **but the same predicate over-prices `Band pull-apart` (6,800 shipped, tier 1) and every other '
    'non-heavy `_isCompound` name**, so a one-name patch would leave the cost lens with the identical proxy defect the tier lens just '
    'shed. Cost is TIME ON THE FLOOR, not load. Measure named, `tests/measure/v201_cost_lens.js`: (a) cells over cap on arrival today vs '
    'declared-core at 1.0× vs tier-1 `_isCompound` names at 1.0×; (b) how many of D89’s ~504 cells change again; (c) the '
    'HALF_MANNY digest under each; (d) **which writer refills `Core — Anti-Rotation` after the budget spends its only item** — '
    '80/80 of the sampled cells GAINED `Plank shoulder taps` and 0 days lost their core section, while `Rotational Power` is NOT refilled '
    'in the base case, so a pillar-specific post-build writer is latent (D92 class). **Builder note: `g197d` E5 confines `_itemCost` by '
    'slice, so any edit there brings its own gate re-pin.**\n'
    '- **A DIGEST TABLE ROW’S PROVENANCE CANNOT BE VERIFIED FROM THE TREE (V200 gatekeeper, process gap, Mario’s call).** '
    '`MANNY_DIGEST_BY_VERSION[200]` is a bare literal: a row typed from coach’s PRE-BUILD prediction and a row pasted off the built '
    'artifact are byte-identical source, and git cannot separate them when the whole change set lands in one commit. **D89 is rescued by '
    '`g200_core_tier` F1a, not by the table** — F1a asserts the COUNTERFACTUAL (candidate minus the clause) hashes to '
    '`6e32421331693437`, a value V198 and V199 independently shipped and four gates pinned before this build existed, so the after-digest '
    'is anchored to a pre-existing before-digest plus a one-line source delta whose behavioural consequence is separately pinned to a '
    'named cell. **For the next ruling that moves a digest WITHOUT a counterfactual gate, provenance is unverifiable.** Gatekeeper '
    'recommends: write the ruled after-digest into the handoff D-code entry and add an assertion parsing it back out, so two files '
    'written by different agents at different times must agree. Counter, stated: it couples a gate to prose formatting and only widens '
    'the blast radius of a lie from one file to two. Gatekeeper still takes it.\n'
    '- **ONLY ONE GATE DISCRIMINATES D89 (V200 gatekeeper, ruled intent, recorded anyway).** The five re-pinned gates are green on BOTH '
    'artifacts by design of the era-table form, so they prove NOTHING about D89; the entire behavioural burden rests on '
    '`g200_core_tier` (43 assertions, hand tables, parsed thresholds, a counterfactual reference). That is what the form is for, but a '
    'single point of proof is worth knowing about before it is edited.\n'
    '- **THE 740-NAME SWEEP DENOMINATOR IS UNVERIFIED (V200).** The V200 confirmation pass reported a 740-name `_compoundTier` universe; '
    'the ship pass could not reproduce it, getting **485** (EXLIB + RAND_POOLS + `_AUX_FAMILY` keys, deep-walked) and **128** (`name:` '
    'literals) by two independent extractions. **The finding is unchanged at every denominator — exactly one name moves, `Pallof '
    'press` 3 -> 0** — and `g200_core_tier` A0a/A0b independently pins the 23-name core set as source text. Recorded so nobody '
    'quotes 740 as measured.\n'
    '- **`gate.sh` STOPS AT THE FIRST RED, so a late gate can go ungraded for a whole session (V200).** While the stale pins were red, '
    'the runner never reached `g200_core_tier` and its green existed only as per-gate runs. It is graded now. **Never quote a `gate.sh` '
    'line for a gate the runner did not reach.**\n',
    '12 new entries')

rep('\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout, no tag cut.**',
    '\n- **V200 — D89, a drill the author declared `core` is never a loaded compound.** §12 carried D89 as unscopeable until six '
    'of `_compoundTier`’s seven readers were measured. The measure ran (1,728 configs / 95,232 day cells / 502,501 shipped items / '
    '349,709 swappable) and the flagship defect turned out to be **one name**: `Pallof press` is tier 3 because `_isCompound` matches the '
    'bare substring `press` and `_compoundTier` ends in an unguarded `return 3` commented "unspecified-barbell compound". Of 23 '
    '`_AUX_FAMILY===’core’` names, **22 returned 0 and it returned 3.** The cost, both athlete-facing and both confirmed exactly: '
    '**54,672 `Much lighter than pallof press` lines of 208,208 notes displayed — 26.26% of every load note ever shown**, printing 22 '
    'times in one sheet; and a chip row reading **`CORE` · `TODAY` · `HEAVY COMPOUND`** on the same anti-rotation drill. The '
    'scoping fact that decided the ruling: MODEL A (token) and MODEL B (declared-core) are **identical on five of six readers**, and '
    '**74,169 − 19,497 = 54,672 exactly** — demoting fall-through names 3->2 silences **not one** Pallof line, because a gap of 2 '
    'to a tier-0 candidate still clears `d<2`. Coach ruled ONE LINE, **rejected the token model as doctrine** (`Close-grip bench press`, '
    '`Sumo deadlift`, `Deadlift`, `Front squat`, `Back squat`, `Pendlay row` ARE tier 3), split the rest off as **D96**, and '
    '**overturned the earlier Mario-concurred D89 form** by printing four HALF_MANNY cards where protecting all core at the budget spends '
    'a loaded press to keep a second rotation drill — hard days hard, inverted. Mario accepted the overturn and his own changed card. '
    'Challenged mid-build on `_itemCost` (which reads `_isCompound` directly and still prices the drill at `sets × 1.5`), coach '
    '**narrowed its own rationale before ship**: what shipped is the SKIP, not the PRICE, and the cost lens became **D97**. Then the '
    'build’s real cost surfaced: the digest move broke **five pins in four files**, and gatekeeper’s confirmation pass found the '
    'ruled list wrong in two ways — **`g197b_sweep.js:98` was a DEAD CONSTANT nothing read** (re-pinning it would have made a vacuous '
    'line look maintained; Mario ruled ADD the missing assertion), and **`g199` B2 at :336 was missed**, so the plan as ruled would have '
    'left the suite red. Coach’s form: two version-keyed tables in `tests/harness.js` with row-existence as a CONJUNCT, because '
    '`gate.sh` runs the previous artifact first and a bare literal repoint reds five unrelated gates for a reason none of them tests. '
    'Three false-premise sentences struck (`byte-identical to V198`, `D93 is a gate-only ruling`) — true history, false predicates. '
    'GREEN: **26 gates ALL PASS, 0 REFUSED**, `g200_core_tier` **43/0** on V200 and **31/12** on V199 (red on the predecessor by design, '
    'graded by `gate.sh` for the first time), sabotage **9/9** with every mutation’s failing assertion read BY NAME (M7 trips A1 and '
    'D1b and leaves E1 green, because `2>=3` is false — it separates the copy claim from the tag claim) and **8/8** on v199, 17 hunks '
    '**100% classified with no unruled removal**, fuzz **1,945 configs / 118,034 cells / 126 differences, all of the ruled shape, 0 '
    'unclassified**. Exactly one name in the universe moves; exactly one HALF_MANNY cell, **W11 MON `Core — Anti-Rotation[Pallof '
    'press]` -> `[Plank shoulder taps]`**; digest `6e32421331693437` -> `d4364dd3fa63a3a1`, counterfactual `75ae3d256b642a9d` -> '
    '`5fe2c6bb32c76498`; readers R1-R4 move by **0**; `_isCompound` and `_itemCost` proved byte-identical. **Disclosed, not hidden:** a '
    'digest table row’s provenance cannot be verified from the tree (D89 is rescued by F1a’s counterfactual, not by the table); '
    'only `g200_core_tier` discriminates D89 at all; and the confirmation pass’s 740-name sweep denominator did not reproduce (485 '
    'and 128 by two extractions, same one-name finding).\n'
    '\n- **Post-V199 tooling pass — no build. `ia-version` stays 199, `index.html` byte-identical throughout, no tag cut.**','digest')

assert s!=orig
io.open(P,'w',encoding='utf-8').write(s)
print('WROTE '+P)
