import io
P='IRON_ASYLUM_HANDOFF_1_1.md'
s=io.open(P,encoding='utf-8').read(); orig=s
def rep(old,new,l):
    global s
    n=s.count(old); assert n==1,'ANCHOR %s count==%d'%(l,n)
    s=s.replace(old,new); print('OK  '+l)
def cut(a,b,l):
    global s
    i=s.find(a); j=s.find(b); assert i>0 and j>i,'BOUNDS '+l
    s=s[:i]+s[j:]; print('OK  cut '+l)

rep('`index.html` — **V200**; `<meta name="ia-version">`=**200**. Built in order after V199.',
    '`index.html` — **V201**; `<meta name="ia-version">`=**201**. Built in order after V200. '
    '**V201 BUILT D94: one engine clause — a posterior Main suppresses the deload posterior pre-pass, so a deload pull day keeps '
    'its vertical pull — plus the `g200` re-pin its own expiry predicate forced.**','working file')

rep('highest assigned = D97. Next free = D98.','highest assigned = D99. Next free = D100.','registry')

rep('\n- **Most recent work (V200): D89',
    '\n- **Most recent work (V201): D94 — the deload pull day keeps the pattern its Main already carries.** On a deload pull day '
    'the Main is a deadlift variant by construction (`:8202`), so the hip extension is already on the card and is the heaviest thing '
    'on it. D91’s pre-pass then scored `Pull superset B` above `A` because an `ex.cond[2]` CONDITIONING draw happened to be a '
    '`Kettlebell swing`, and deleted the day’s only vertical pull. Measured before the ruling: **135/135 L-healthy cards carry a '
    'posterior Main, and 135/135 shipped with ZERO vertical pull** (`L-sit chinups` 90, `Neutral-grip chinups` 45). One clause: '
    '`__mainPost` suppresses the pre-pass. **D91 is narrowed, not reversed** — D91-flip LEG cards with a posterior Main measured '
    '**0 on every lattice**, and A⇔C on g199’s 1,728-config lattice is **0 changed cards**. `HALF_MANNY` digest **UNMOVED** at '
    '`d4364dd3fa63a3a1`, so Mario’s program does not change. GREEN: 26 gates ALL PASS 0 REFUSED, sabotage **4/4 + 7/7 + 8/8**, '
    'blast radius 100% classified with every `index.html` removal ruled, fuzz **11,424 configs / 652,672 cells**. Issued: **D98** '
    '(lowback/protect drops the whole row pattern) and **D99** (P7’s stage-keyed lattice).\n'
    '\n- **Most recent work (V200): D89','header V201')

rep('\n- **Prior work (V199): D91',
    '\n- **Prior work (V200): D89 — a drill the author declared `core` is never a loaded compound.** One clause in '
    '`_compoundTier`. `Pallof press` was tier 3 because `_isCompound` matched the bare substring `press`; of 23 declared-core names '
    '22 returned 0 and it returned 3. Killed **54,672** "Much lighter than pallof press" lines (26.26% of every load note displayed) '
    'and the chip row printing `CORE` and `HEAVY COMPOUND` on the same drill. Coach rejected the token model as doctrine and split '
    'the load-tier table off as D96.\n'
    '\n- **Prior work (V199): D91','header V200')

rep('- **(V200) A "nothing moved" digest pin',
    '- **(V201) A sabotage row is keyed to the RULING it defends; when a ruling removes its observable, the row is RETIRED, not '
    'repointed.** D94 made pull direction first-come by construction, so `v200.json` M2/M3 stopped being observable on g200 — and '
    'their `find` anchors turned out **byte-identical to `v199` M1/M8**. Repointing their `gate` field would have made two rows score '
    'on another spec’s proof. **Check whether a surviving row is a duplicate before repointing it.**\n'
    '- **(V201) A DECLARED TRIP THAT DOES NOT TRIP IS THE SAME ROT AS AN UNDISCLOSED ONE.** Coach declared `g199` C1/C2 on a '
    'rewritten mutation; measurement read them GREEN. A trip list that does not match the sweep is exactly what let `v200` M2/M3 rot '
    'undetected. **Refuted claims go in the note’s history line, never in the list the sweep is checked against** — and the '
    'reason they were wrong goes with them, so the next reader does not re-add them from the same model.\n'
    '- **(V201) A COLLATERAL LIST WRITTEN BEFORE THE MEASUREMENT IS A GUESS WEARING THE WORD DISCLOSED.** Twice in two builds a note '
    'read exhaustive while being illustrative. The fix is structural, not a hand audit repeated every build: `sabotage.py` carries a '
    '`collateral` field per row and **asserts the disclosed gate list equals the measured radius**, so an illustrative note FAILS the '
    'sweep. Until then, write `PENDING GATEKEEPER MEASUREMENT` and let the sweep fill it.\n'
    '- **(V201) SLICE EVERY AGENT BRIEF, NOT JUST BUILDER’S.** A gatekeeper brief carrying ten run-steps and three side-rulings '
    'stalled at the watchdog before its first tool call, exactly as §10b predicts for builder. Split verification into phases '
    '(suite / sabotage / fuzz / blast radius), each opening with a concrete first command. **The rule is about brief length, not '
    'about which agent reads it.**\n'
    '- **(V200) A "nothing moved" digest pin','10b')

rep('### V200 — D89, a declared core drill is not a compound',
    '### V201 — D94, a posterior Main suppresses the deload pre-pass (Mario: "V201 = D94", "Ship D94 at V201", "Flag it for its own D-code")\n'
    '- **A PULL DAY IS THE DAY’S VERTICAL PULL, and the Main already holds the hip extension (D94).** The deload keeps the pattern '
    'the card would otherwise LOSE. On a pull day that is the chinup, not a second hinge: the Main is a deadlift variant by '
    'construction, so the posterior is not at risk. D91’s principle was right and its lens too narrow. **Same lens both sides** '
    '(`_isPostChain` in the app, `E_PAT` in the gate).\n'
    '- **THE THINNER CARD IS THE RIGHT CARD (D94-IS, coach, Mario disclosed not re-asked).** On shoulder/protect deload pull days the '
    'overlay has already stripped A’s vertical pull, so D94 ships a one-item `Pull [row]` where V200 shipped a row plus a swing. '
    '**The V200 card was not richer, it was padded** — the second item was a conditioning hinge under a hinge Main, on an athlete '
    'whose overlay is telling the engine to take load off the upper body. Thinner is the point on a deload week. Rejected: "a pair '
    'beats a singleton" (makes item count an arbitration criterion — volume beating pattern — and restores the swing on exactly '
    'the injured athlete) and healthy-only application (an injury-conditional latch handing the worse pattern card to the person with '
    'the overlay).\n'
    '- **A DIGEST TABLE ROW RECORDS A CLAIM, NOT A VALUE (D94-t).** A row written as a LITERAL asserts a RULED MOVE and must cite its '
    'D-code and the counterfactual oracle that rescues its provenance. A row written as a REFERENCE to V(N-1) asserts RULED UNMOVED, '
    'and its proof is the two-artifact run `gate.sh` already performs. Chosen because the five readers do `TABLE[IA.version]` with '
    '`!!ROW && d===ROW`: **an idiom that changes the VALUE type forces five reader edits; one that changes how the row is WRITTEN '
    'keeps every reader byte-identical.**\n'
    '- **AN EXPIRY IS REMOVED WHEN ITS ERA ENDS, NOT RE-KEYED FORWARD (V201).** `g200`’s `ia-version <= 200` licence fired on '
    'exactly the build it was written for, refused four pins by name, and was then DELETED rather than re-pointed at 201: nothing is '
    'queued that reverses D94, and §10b says key an expiry to the artifact only when an era is KNOWN to end. **The proof replaces '
    'it** — P2 must FAIL by exactly 150 on V200 and V199 and pass on V201.\n'
    '- **P2 GREEN ON V198 IS CORRECT, AND A GATE RED EVERYWHERE IS AS USELESS AS ONE GREEN EVERYWHERE (V201).** V198 predates D91, so '
    'A survives there and the narrowed rule predicts it. The suite separates the four versions because **V198 is red on `g199`**.\n'
    '- **P7 IS A SECOND ORACLE, PROVED BY DISSOCIATION NOT ARGUMENT (V201).** Under `PINSINJ=shoulder/protect`, P2/P2c/P2d/P4 all read '
    'GREEN while **P7 fails 90 of 150** on the same cards. Structural reason: **P4’s first limb is label-only** '
    '(`s.l==='+"'"+'Pull superset A'+"'"+'`, no item test), and P2 is further upstream still, so the class "A wins, A ships, A’s '
    'vertical pull is gone" is invisible to every pin but P7. **A pin that asserts a MOVEMENT is not a rename of a pin that asserts a '
    'LABEL.**\n\n'
    '### V200 — D89, a declared core drill is not a compound','11f')

cut('- **D94 — THE DELOAD PULL DAY KEEPS','- **D95 — EVERY PINNED ASSERTION','D94 (built)')

rep('## 12. Open / carried forward\n',
    '## 12. Open / carried forward\n\n'
    '- **D98 — `lowback/protect` DROPS THE WHOLE ROW PATTERN (Mario flagged it for its own code, V201, UNBUILT).** '
    '`index.html:7031-7044`: `R==='+"'"+'lowback'+"'"+'` sets `P.drop=new Set(['+"'"+'hinge'+"'"+','+"'"+'row'+"'"+'])` plus a '
    '`dropNames` regex, so **every row goes**. A chest-supported or seated row is standard practice around a low back and is arguably '
    'the movement you most want KEPT there. Measured consequence already in hand: on linjA the two lowback states drop **300 of 900** '
    'candidate `Pull superset B` posteriors before `recoveryDeload` ever sees them, which is why lowback contributes 0 to D94. Needs '
    'its own measure before any ruling. **Coach recommended it be asked, not bundled into D94; Mario chose to flag it.**\n'
    '- **D99 — P7’S CLAIM IS STAGE-KEYED AND ITS LATTICE CANNOT SEE THAT (coach, V201, deferred out of V201 with reason).** P7 '
    'today pins "the shipped card carries a vertical pull", which reads **FAIL 90 of 150** on a shoulder/protect row where the OVERLAY '
    'removed the chinup upstream and the deload deleted nothing. The correct claim is p1 -> shipped: **every card whose A carries a '
    '`V_PULL` item at p1 ships one.** Measure: mini lattice plus a `shoulder/protect` companion row — (i) cards with a `V_PULL` item '
    'in A at p1, (ii) cards shipping one, (iii) equality under V201 and the shortfall count under V200, which must equal the D94 swap '
    'population on that row. **Not done inside V201** because it changes P7’s oracle and its expected count in the build that '
    'introduced it, with no baseline to prove the new number against. Until then P7 on the healthy lattice is a correct pin with a '
    'known blind spot, recorded in the gate header.\n'
    '- **`sabotage.py` CANNOT EXPRESS A HARNESS- OR GATE-ANCHORED MUTATION, AND THE OBVIOUS FIX IS WORSE THAN THE GAP (V201 '
    'gatekeeper).** It reads `src` from `argv[1]` and counts anchors in the **candidate HTML only**; there is no `file` key. So the two '
    'harness mutations coach named are unreachable and **the harness’s V201 era row is asserted by nothing** — a row could be '
    'deleted tomorrow and no sweep would notice. **A schema-only `"file"` key would be WORSE:** a mutated `tests/harness.js` is not the '
    'file a gate’s `require('+"'"+'../harness.js'+"'"+')` resolves, so the mutation would take effect nowhere and the row would '
    'score while proving nothing. The real work is a **tree-copy mutator** (copy `tests/` into the tempdir, mutate there, invoke the '
    'gate from that tree), plus making the V185 absolutise-the-gate-path line tree-aware, plus a post-write assertion that the loaded '
    'file is the mutated one. **Gatekeeper proved the tree-copy route works** (`git archive HEAD tests | tar -x` is how it scored a '
    'pre-re-pin gate against a V200 mutant and isolated the D94 re-pin regression).\n'
    '- **A SABOTAGE SPEC FILE HAS NO LEGAL PLACE FOR A HEADER (V201 builder).** `sabotage.py` `json.load`s the file and enumerates '
    '**every** array element as a mutation, so a header ROW would be read as a mutation and CRASH the sweep, and a top-level object '
    'would iterate its keys as strings. The D94-s supersession reason is therefore carried as a `_file_header` key on the first row '
    '(extra keys are ignored by the runner; **proved safe by execution**, not by reading the runner). **The format can hold mutations '
    'and nothing else, so every claim ABOUT a spec lives somewhere the runner cannot check it.** Pairs with the `collateral`-field item '
    'above: both are the same shape.\n'
    '- **D91’S 374 WEEKS ARE MEASURED, NOT GATED — but the CONSEQUENCE is gated (V201, corrected twice).** No assertion anywhere '
    'reads 374; the only `374` in the gate sources is a source-line citation. The intactness was proved by measure’s counterfactual '
    '(A⇔C on g199 = 0 changed cards). **What IS gated on the shipped artifact is its consequence:** `g199` **C2** (deload '
    'zero-posterior weeks == 0) and **H5** (swap population 2,160/2,826); `v199` M1’s note records C2 going 0 -> 374 when the '
    'pre-pass is reverted. **What is ungated is the counterfactual DELTA (746 -> 372), which is what "374" names.** Do not add a 374 '
    'pin: it would need a `__PREPASS_OFF` hook inside the engine so the gate could assert against its own counterfactual. **Stop '
    'repeating 374 as a gate.**\n'
    '- **THE FIRST-COME FALLBACK IS THE DELOAD’S GENERAL KEEP PATH; THE PRE-PASS IS THE EXCEPTION (V201, found by a mutation).** '
    'The rewritten `v199` M2 (`(pickIdx<0||i===pickIdx)` -> `(i===pickIdx)`) reds **nine** gates, two of them structural rather than '
    'digest: `g193_samecard` **G5f** (3,888 PUSH cards left with the Main and no other block) and **G5a** (162/648 lowback-protect '
    'vertical-pull main days likewise). So `pickIdx<0` is the ONLY path by which any card **without a posterior accessory candidate** '
    'keeps an accessory block at all, **on every family**. `g193_budget_floor` B3 follows from the same cause and is not a separate '
    'finding. Nothing is ruled here; it is a fact about `recoveryDeload` that no ruling had stated.\n'
    '- **A D-CODE COLLISION HAPPENED FOR THE FOURTH TIME, AND THE FIX IS MECHANICAL (V201).** Coach issued "D97" for the P7 lattice '
    'when D97 was already the `_itemCost` cost lens; corrected to **D99**. Every previous collision had the same cause: a number typed '
    'from memory past the registry line at handoff:10 that exists for it. Coach’s own remedy, adopted: **a D-code is READ OFF the '
    'registry in the same call that gathers the evidence, and the registry line is QUOTED in the ruling** so the number is auditable.\n',
    '12 new entries')

rep('\n- **V200 — D89, a drill the author declared',
    '\n- **V201 — D94, a posterior Main suppresses the deload pre-pass, so a deload pull day keeps its vertical pull.** The seven-item '
    'measure §12 named ran first and the defect was worse than the entry said: **135/135 L-healthy swap cards carry a posterior Main '
    '(100%), and 135/135 shipped with ZERO vertical pull** — `L-sit chinups` 90 and `Neutral-grip chinups` 45 deleted to keep a '
    'conditioning `Kettlebell swing` under a deadlift Main. Coach’s load-bearing assumption was COUNTED rather than inherited: '
    'D91-flip LEG cards with a posterior Main read **0 on every lattice**, so D91 and D94 do not conflict. The counterfactual came back '
    'clean on four lattices — **all 374 D91 weeks survive, A⇔C on g199 is 0 changed cards, 0 wrong-way, 0 third outcome, '
    '`HALF_MANNY` digest UNMOVED** — so Mario’s program does not change and he concurred on the pattern question (vertical pull '
    'over a second hinge). One clause shipped, coach’s text verbatim. **Then the build’s real cost surfaced, and it was all in the '
    'suite around the change.** `g200`’s `ia-version <= 200` expiry — the tax Mario accepted post-V199 — **fired on exactly '
    'the build it was written for**, refusing four pins by name; coach ruled it DELETED rather than re-keyed, with P2’s '
    'FAIL-by-150-on-the-predecessor as the replacement proof. The harness era table hit its first bump and had **no V201 row**, which is '
    'the conjunct failing loudly as designed; coach ruled the **reference idiom** (a literal asserts a RULED MOVE, a reference asserts '
    'RULED UNMOVED) because the five readers all do `TABLE[IA.version]` and only a change in how the row is WRITTEN keeps them '
    'byte-identical — and builder then found the missing row was red in **five** gates, not two. Sabotage re-runs found **two live '
    'V200 mutations SURVIVING** (216 and 210 of 1,152 configs move) because D94 moved their observable off g200; coach REJECTED the '
    'repoint I proposed, on the ground that their anchors are **byte-identical to `v199` M1/M8** — duplicates, retired 9 -> 7. '
    '`v199` M2 became a proven no-op and was rewritten onto the zero limb of F4/H3; **gatekeeper then refuted half of coach’s own '
    'declaration for it** (C1/C2 measured GREEN) and its measured radius turned up two structural trips nobody predicted, which '
    'reframed the mutation: **the first-come fallback is the deload’s general keep path and the pre-pass is the exception.** Phase C '
    'returned one RED coach had to rule rather than gatekeeper absorb — **150 shoulder/protect cells where D94 ships a one-item '
    '`Pull [row]`** against V200’s row-plus-swing, byte-identical to what V198 shipped; ruled **D94-IS, the thinner card is the '
    'right card**, because the V200 card was padded with a hinge under a hinge Main on an athlete guarding a joint. **P7 was proved a '
    'genuine second oracle by dissociation**: under a shoulder/protect override P2/P2c/P2d/P4 all read green while P7 failed 90 of 150, '
    'because **P4’s first limb is label-only** and the class "A wins, A ships, A’s vertical pull is gone" is invisible to every '
    'other pin. **My own gatekeeper brief stalled at the watchdog** carrying ten run-steps — the §10b lesson applied to builder '
    'all session and not to the agent with the longest job — and the verification was re-run in four phases. GREEN: **26 gates ALL '
    'PASS, 0 REFUSED**, `g200` 18/0 on V201 and 15/3 on V200/V199 (P2 exactly 150 of 210, P4 0/150, P7 0/150) and 18/0 on V198 '
    '(correct — V198 predates D91 and is red on g199 instead), sabotage **4/4 + 7/7 + 8/8** with 0 survived / 0 NOT-APPLIED / 0 '
    'CRASH and every failing assertion read BY NAME, blast radius **100% classified with every `index.html` removal ruled**, fuzz '
    '**11,424 configs / 652,672 cells**, `pace` measured at **exactly 60** where coach could only predict it. Issued: **D98** '
    '(lowback/protect drops the whole row pattern) and **D99** (P7’s stage-keyed lattice). Incidental in the commit and named: '
    '`tests/measure/v201_d95_pace_editability.js`, a D95-class artifact with no ruling attached.\n'
    '\n- **V200 — D89, a drill the author declared','digest')

assert s!=orig
io.open(P,'w',encoding='utf-8').write(s)
print('WROTE '+P)
