#!/usr/bin/env python3
# V201 — D94, slice 3 of 4. Re-pin tests/gates/g200_pull_arbitration.js.
#
# g200's four D91-era pins (P2, P2c, P4, P6) sat under an ia-version licence written at V200:
# armed at or below 200, REFUSED above it. That predicate fired on exactly the build it was
# written for — V201 reads "D91-era pins REFUSED". D94 now brings its own after-grid and
# re-pins them. Four edits, all in this one gate file. index.html is NOT touched.
#
#   1. P2   — NARROWED, not reversed. On a both-enter deload pull card the survivor is
#             Pull superset B iff B holds an E_PAT posterior at p1 AND no Main-class section
#             holds one at p1; else A. Same lens both sides: KMAIN on the label (via cls()),
#             E_PAT on the item names (via isPost()), mirroring __mainPost in index.html.
#             Still read off the p1/p2 STAGE record, never the shipped card (g193_samecard:374).
#   2. P4   — FLIPS. Was "B reaches the shipped card 150/150". Now "A reaches the shipped
#             card 150/150", zero losses at capRegionalFatigue or capSessionBudget.
#   3. P6   — value UNCHANGED ({"Kettlebell swing":150} as an equality). Prose flips: the
#             swing is no longer the movement that WINS the arbitration, it is the movement
#             the fix declines to keep.
#   4. THE LICENCE IS DELETED, not re-keyed to 201. No ruling is queued that reverses D94, and
#             §10b keys an expiry to the artifact only when an era is known to end. The proof
#             replaces the licence: FAIL-by-150 on V200 and V199 is what the rule wants.
#
# P2c and its floor are UNCHANGED: 150, read off p1, upstream of the arbitration.
# Anchors are asserted count==1 before any write. First miss aborts the whole script.

import io, sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g200_pull_arbitration.js'

with io.open(PATH, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

orig_len = len(src)
reps = []

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 0 — header ACCEPTANCE PROPERTY. It described the V198/V199 pair. The pins now
#          separate four artifacts, and the four-artifact table IS the licence's replacement.
# ─────────────────────────────────────────────────────────────────────────────
H_OLD = (
"// ACCEPTANCE PROPERTY — this gate must be RED on the predecessor. Against\n"
"// `git show V198:index.html` it MUST read P1 PASS, P2c PASS, P4 FAIL (0 of 150) and P2 FAIL\n"
"// with exactly 150 violations. Against shipped V199 all four PASS. If it is green on BOTH\n"
"// artifacts it is not testing what it claims and it must be rewritten, not re-pinned.\n")
H_NEW = (
"// ACCEPTANCE PROPERTY, RE-PINNED BY D94 (V201). There is no longer an ia-version licence in\n"
"// this file. It was deleted rather than re-keyed to 201: no ruling is queued that reverses\n"
"// D94, and §10b keys an expiry to the artifact only when an era is known to end. THE PROOF\n"
"// BELOW REPLACES IT, and it must hold on all four artifacts:\n"
"//   V201 (D94 shipped)      all green.\n"
"//   V200                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150.\n"
"//   V199                    P2 FAIL with EXACTLY 150 violations, P4 FAIL 0 of 150.\n"
"//   V198                    GREEN, AND THAT IS CORRECT. V198 predates D91, A survives there,\n"
"//                           and the D94 rule predicts A there too. Do not \"fix\" this green:\n"
"//                           the suite still separates V198 from the rest because V198 is red\n"
"//                           on g199_deload_arbitration.js, D91's leg family.\n"
"// If P2 is GREEN on V200 the re-pin has failed and this file is to be rewritten, not adjusted.\n"
"// FAIL-by-150 on the predecessor is the whole proof a prose licence could never give.\n")
reps.append(('E0 header acceptance property', H_OLD, H_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 1a — the sweep. Carry the Main clause and re-key the census.
#           cls() reads the LABEL only for 'main' (KMAIN), so a __SNAP section carrying
#           label + item names is enough; nothing here calls _pattern or _isPostChain.
# ─────────────────────────────────────────────────────────────────────────────
S_OLD = (
"      const aPost=labPost(r.p1,'Pull superset A');\n"
"      const bPost=labPost(r.p1,'Pull superset B');\n"
"      const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');\n"
"      if(!bothEnter) return;\n"
"      S.bothEnter++;\n"
"      // ── P2: expected survivor at p2. STAGE record, never the shipped card ──\n"
"      const exp=bPost?'B':'A';\n"
"      const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';\n"
"      bump(S.census,'enterPost='+((aPost?'A':'')+(bPost?'B':'')||'none')+' exp='+exp+' surv='+act);\n"
"      if(act!==exp){S.viol++;bump(S.violShape,'exp='+exp+' got='+act+' (Bpost='+bPost+')');}\n")
S_NEW = (
"      const aPost=labPost(r.p1,'Pull superset A');\n"
"      const bPost=labPost(r.p1,'Pull superset B');\n"
"      // D94: a Main-class section holding a posterior item at p1 SUPPRESSES the pre-pass.\n"
"      // SAME LENS BOTH SIDES, which is the pool/post-filter rule: the app tests KMAIN on the\n"
"      // section label and _isPostChain on the item name; this gate tests the same KMAIN (via\n"
"      // cls(), whose 'main' limb is label-only, so a __SNAP section suffices) and E_PAT on the\n"
"      // item name (via isPost()). Neither _pattern nor _isPostChain is called from this file.\n"
"      const mainPost=(r.p1||[]).some(s=>cls(s)==='main'&&(s.n||[]).some(isPost));\n"
"      const bothEnter=hasLab(r.p1,'Pull superset A')&&hasLab(r.p1,'Pull superset B');\n"
"      if(!bothEnter) return;\n"
"      S.bothEnter++;\n"
"      if(mainPost) S.mainPostCards++;\n"
"      // ── P2: expected survivor at p2. STAGE record, never the shipped card ──\n"
"      const exp=(bPost&&!mainPost)?'B':'A';\n"
"      const ep=((aPost?'A':'')+(bPost?'B':''))||'none';\n"
"      const act=((hasLab(r.p2,'Pull superset A')?'A':'')+(hasLab(r.p2,'Pull superset B')?'B':''))||'none';\n"
"      bump(S.census,'enterPost='+ep+(ep==='none'?'':' mainPost='+(mainPost?'yes':'no'))+' exp='+exp+' surv='+act);\n"
"      if(act!==exp){S.viol++;bump(S.violShape,'exp='+exp+' got='+act+' (Bpost='+bPost+' mainPost='+mainPost+')');}\n")
reps.append(('E1a sweep: Main clause + census key', S_OLD, S_NEW))

# EDIT 1b — the accumulator gains mainPostCards. merge() sums numbers, so this shards cleanly.
B_OLD = "  bothEnter:0,swapCards:0,"
B_NEW = "  bothEnter:0,mainPostCards:0,swapCards:0,"
reps.append(('E1b blank(): mainPostCards accumulator', B_OLD, B_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 2 — P4 flips from B to A on the shipped card.
# ─────────────────────────────────────────────────────────────────────────────
P4S_OLD = (
"      // ── P4: does B reach the SHIPPED card (past capRegionalFatigue and capSessionBudget)? ──\n"
"      const bItems=[].concat(...secOf(r.p1,'Pull superset B').map(s=>s.n));\n"
"      const intact=(ship||[]).some(s=>(s.l==='Pull superset B')\n"
"        ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>bItems.includes(n))));\n")
P4S_NEW = (
"      // ── P4 (D94): does A reach the SHIPPED card (past capRegionalFatigue and\n"
"      //    capSessionBudget)? The block D94 keeps is A, so A is the one tracked end to end. ──\n"
"      const aItems=[].concat(...secOf(r.p1,'Pull superset A').map(s=>s.n));\n"
"      const intact=(ship||[]).some(s=>(s.l==='Pull superset A')\n"
"        ||(s.l==='Pull'&&(s.n||[]).length&&s.n.every(n=>aItems.includes(n))));\n")
reps.append(('E2a sweep: P4 tracks A to the shipped card', P4S_OLD, P4S_NEW))

P4X_OLD = "          p1_B:bItems,p2:at2,p3:at3,"
P4X_NEW = "          p1_A:aItems,p2:at2,p3:at3,"
reps.append(('E2b P4 loss example records A items', P4X_OLD, P4X_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 4 (applied before the message rewrites so the anchors below stay unique) —
#        DELETE the licence: the REFUSED counter, refuse(), pinned(), D91_ERA, the
#        ia-version predicate and REFUSE_WHY. The 'REFUSED A2-P4' line at the anchor-miss
#        path is NOT part of this machinery and stays: it reports an instrument that could
#        not be placed, which is a genuine did-not-run and is not one of the four pins.
# ─────────────────────────────────────────────────────────────────────────────
L1_OLD = (
"let PASS=0,FAIL=0,REFUSED=0;\n"
"const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };\n"
"// REFUSAL MACHINERY, lifted from g197d_d84_base.js:133 (the E1h shape, ruled V198). A refused\n"
"// assertion was NOT put and is NOT a pass. gate.sh:85 greps ^REFUSED beside the summary and\n"
"// blocks on it, so a refusal here stops the suite even though the exit code stays 0.\n"
"const refuse=(n,why)=>{ REFUSED++; console.log('REFUSE '+n+'  -> '+why); };\n"
"// pinned() is the D94 re-pin predicate applied to ONE assertion: armed at or below\n"
"// ia-version 200, refused above it. The predicate itself is in section A, off the artifact.\n"
"const pinned=(code,c,m)=>{ if(D91_ERA) ok(c,m); else refuse(code+' (D91-era pull-shape pin)',REFUSE_WHY); };\n"
"const done=()=>{ if(REFUSED) console.log('REFUSED '+REFUSED+' assertion(s) — see the REFUSE lines above. A REFUSED assertion was NOT run and is NOT a pass.'); console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };\n")
L1_NEW = (
"let PASS=0,FAIL=0;\n"
"const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };\n"
"// THE ia-version LICENCE IS GONE (V201, D94). P2, P2c, P4 and P6 used to run through a\n"
"// licence wrapper that armed them at or below ia-version 200 and REFUSED them above it. That\n"
"// predicate did its one job: it fired on V201, the build D94 was ruled for, and forced this\n"
"// re-pin instead of letting D94 inherit a green pin. It is deleted rather than re-keyed to 201\n"
"// because no ruling is queued that reverses D94, and §10b keys an expiry to the artifact only\n"
"// when an era is known to END. A >= 201 arm was considered and rejected: a stray V200 candidate\n"
"// reading REFUSED is weaker than the same candidate reading FAIL by exactly 150, and that FAIL\n"
"// is the proof the rule wants. The four pins are plain ok() rows now, like P1 and the floor.\n"
"// The 'REFUSED A2-P4' line further down is NOT this machinery: it reports an instrument that\n"
"// could not be placed, which is a real did-not-run, and it stays.\n"
"const done=()=>{ console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };\n")
reps.append(('E4a delete refuse()/pinned()/REFUSED counter', L1_OLD, L1_NEW))

L2_OLD = (
"// ── THE D94 RE-PIN PREDICATE. This REPLACES the prose licence that used to sit above P2 ──\n"
"// Prose is not a licence. A comment saying \"a trip here is expected once D94 ships\" expires\n"
"// nothing and trips nothing; §10b rules that a licence is an equality that self-expires.\n"
"// D94 is unbuilt and its version number DOES NOT EXIST, so this predicate cannot key on \"the\n"
"// version D94 ships on\" — a predicate on a number that does not exist is prose with extra\n"
"// steps. It keys on the ARTIFACT instead:\n"
"//   ia-version <= 200 : arm the D91-era pull shape (P2, P2c 150, P4 150/150, P6 swing 150).\n"
"//   ia-version >  200 : REFUSE all four, loudly, in the g197d E1h shape. gate.sh greps\n"
"//                       ^REFUSED and blocks.\n"
"// CONSEQUENCE, RULED AND INTENDED: the FIRST V201 build is red whether or not D94 is in it.\n"
"// That is the point. D94 must bring its own after-grid and RE-PIN these four rather than\n"
"// inherit a green gate asserting a survivor coach has already ruled coaching-wrong.\n"
"const IAV_M=/<meta\\s+name=\"ia-version\"\\s+content=\"(\\d+)\"/.exec(RAW);\n"
"const IAV=IAV_M?parseInt(IAV_M[1],10):NaN;\n"
"const D91_ERA=Number.isFinite(IAV)&&IAV<=200;\n"
"const REFUSE_WHY=(IAV_M\n"
"  ?'NOT RUN: this candidate reads ia-version '+IAV+', past 200, and these four pins describe the D91-era pull shape only. '\n"
"  :'NOT RUN: this candidate carries no readable ia-version meta, so this gate cannot tell whether D94 has re-ruled the pull arbitration. ')\n"
"  +'P2, P2c, P4 and P6 pin the D91 pull shape: on a both-enter deload pull card the survivor is Pull superset B if and only if B holds an E_PAT posterior item at p1, the positive limb is exactly 150 cards, and one movement carries all of it. '\n"
"  +'Coach has ruled that direction COACHING-WRONG on pull days: the deload keeps a hinge drawn from the conditioning pool while the Main is already a deadlift variant, and deletes the day\\'s only vertical pull. D94 IS THE RULING THAT RE-PINS THESE FOUR. '\n"
"  +'D94 must re-rule and re-pin before this gate runs on V201 or later. A claim that did not run is NOT a pass.';\n"
"console.log('   ia-version read off the candidate: '+(IAV_M?IAV:'UNREADABLE')+'  ->  D91-era pins '+(D91_ERA?'ARMED':'REFUSED'));\n")
L2_NEW = (
"// D94 SHIPPED, SO THE PREDICATE THAT GUARDED THE D91-ERA PINS IS GONE, NOT RE-KEYED. What\n"
"// stood here read ia-version off the candidate and refused P2, P2c, P4 and P6 above 200. It\n"
"// fired exactly once, on V201, which is what forced this re-pin. Keeping a mirrored >= 201\n"
"// arm would only make a stray V200 candidate read REFUSED instead of FAIL, and FAIL by exactly\n"
"// 150 on the predecessor is strictly the better signal. The acceptance table at the head of\n"
"// this file is the replacement, and it is checked by running this gate on four artifacts.\n")
reps.append(('E4b delete the ia-version predicate', L2_OLD, L2_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 1c — P2's prose and its pinned() wrapper. NARROWED, not reversed.
# ─────────────────────────────────────────────────────────────────────────────
P2_OLD = (
"  // ── P2 SITS UNDER THE D94 RE-PIN PREDICATE, NOT UNDER A PROSE LICENCE ───────────────\n"
"  // What stood here was a comment telling a future reader that a trip after D94 was expected.\n"
"  // It expired nothing and it tripped nothing, and coach ruled that prose is not a licence.\n"
"  // The licence is now the ia-version predicate in section A, and P2 is put through pinned():\n"
"  // armed at or below 200, REFUSED above it. P2 is a correct description of the engine at V199\n"
"  // and it is NOT a coaching endorsement. Until D94 ships, a trip here is a real defect.\n"
"  //\n"
"  // Keyed on the p1/p2 STAGE record and never on the shipped card: g193_samecard.js:374 already\n"
"  // rules that the Pull superset A label is not asserted to survive to the card, and P2 must not\n"
"  // collide with that ruling. P4 below is the one that reads the shipped card, by design.\n"
"  pinned('P2',R.viol===0&&R.bothEnter===210&&R.swapCards>0,\n")
P2_NEW = (
"  // ── P2 IS NARROWED BY D94, NOT REVERSED ────────────────────────────────────────────\n"
"  // D91's iff is still here. D94 adds ONE conjunct to its positive limb: B wins only when no\n"
"  // Main-class section already holds a posterior item at p1. On a deload pull day the Main is\n"
"  // a deadlift variant by construction, so that conjunct is false on all 150 positive-limb\n"
"  // cards and every one of them keeps A. The else limb of D91 is untouched.\n"
"  //\n"
"  // Keyed on the p1/p2 STAGE record and never on the shipped card: g193_samecard.js:374 already\n"
"  // rules that the Pull superset A label is not asserted to survive to the card, and P2 must not\n"
"  // collide with that ruling. P4 below is the one that reads the shipped card, by design.\n"
"  ok(R.viol===0&&R.bothEnter===210&&R.swapCards>0,\n")
reps.append(('E1c P2 comment + ok() wrapper', P2_OLD, P2_NEW))

P2M_OLD = (
"    'P2 WHICH BLOCK SURVIVES (D93 amended, re-pinned by D94): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is B if and only if B holds an E_PAT posterior item on p1, else A. THAT WHICH-BLOCK RULE IS THE WHOLE OF WHAT P2 CLAIMS: it claims NOTHING about the FIRST-posterior-wins clause, for the measured reason in the SCOPE paragraph below. '\n"
"    + 'VIOLATIONS '+R.viol+' of '+R.bothEnter+' both-enter deload day builds (want 0 of 210). The denominator is stated because a zero with no denominator is the vacuity defect this repo has caught three times; surv=AB and surv=none are BOTH scored as violations, so the exactly-one-survives claim sits inside this same number. '\n"
"    + 'THE POSITIVE LIMB IS EXERCISED '+R.swapCards+' TIMES (want 150): '+R.swapCards+' of the '+R.bothEnter+' cards enter with B holding a posterior item, and the remaining '+(R.bothEnter-R.swapCards)+' enter with neither block holding one and must keep A. Both limbs are live here, which is precisely what was NOT true when these pins sat in g199 on a lattice where all 1,440 both-enter cards read enterPost=none. '\n"
"    + 'CENSUS '+JSON.stringify(R.census)+'. V198 reads {\"enterPost=B exp=B surv=A\":150,\"enterPost=none exp=A surv=A\":60} through this same gate, so P2 is RED on the predecessor with exactly 150 violations and the 60 no-posterior cards survive as A on BOTH versions: the oracle is not trivially satisfiable. '\n")
P2M_NEW = (
"    'P2 WHICH BLOCK SURVIVES (D93 amended, NARROWED by D94 V201): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is Pull superset B if and only if B holds an E_PAT posterior item on p1 AND no Main-class section holds one on p1; else Pull superset A. D94 ADDED THE SECOND CONJUNCT AND NOTHING ELSE: D91\\'s rule is narrowed, not reversed, and the else limb is byte-unchanged. THAT WHICH-BLOCK RULE IS THE WHOLE OF WHAT P2 CLAIMS: it claims NOTHING about the FIRST-posterior-wins clause, for the measured reason in the SCOPE paragraph below. '\n"
"    + 'VIOLATIONS '+R.viol+' of '+R.bothEnter+' both-enter deload day builds (want 0 of 210). The denominator is stated because a zero with no denominator is the vacuity defect this repo has caught three times; surv=AB and surv=none are BOTH scored as violations, so the exactly-one-survives claim sits inside this same number. '\n"
"    + 'THE MAIN CLAUSE FIRES ON '+R.mainPostCards+' of the '+R.bothEnter+' both-enter cards (want 210, i.e. ALL of them), which is the coaching fact D94 rests on: a deload PULL day draws its Main from the deadlift family by construction, so the day\\'s hip extension is already on the card and is the heaviest thing on it. Keeping a conditioning-pool swing on top of it and deleting the day\\'s only vertical pull is the defect D94 removes. '\n"
"    + 'THE POSITIVE LIMB OF D91 IS STILL EXERCISED '+R.swapCards+' TIMES (want 150): '+R.swapCards+' of the '+R.bothEnter+' cards enter with B holding a posterior item, and the remaining '+(R.bothEnter-R.swapCards)+' enter with neither block holding one. Under D94 all 210 keep A, but by TWO DIFFERENT ROUTES, and both routes are live: 150 by the Main clause and 60 by the plain no-posterior else limb. That is why P2 is not the same assertion as \"A always survives\" and why the 150 must stay visible in the census. '\n"
"    + 'CENSUS '+JSON.stringify(R.census)+' (want {\"enterPost=B mainPost=yes exp=A surv=A\":150,\"enterPost=none exp=A surv=A\":60}). SEPARATION, AND IT IS NOT SYMMETRIC: V200 and V199 both read enterPost=B surv=B on those 150 cards, so P2 FAILS on each of them with EXACTLY 150 violations, which is the whole re-pin proof. V198 predates D91, keeps A on all 210, and is GREEN here — correct and expected, not a hole: the suite separates V198 from the rest on g199_deload_arbitration.js, D91\\'s leg family. '\n")
reps.append(('E1d P2 message body', P2M_OLD, P2M_NEW))

P2T_OLD = (
"    + 'D94 REVERSES THE DIRECTION THIS PINS, and the ia-version predicate in section A REFUSES this assertion on any candidate past 200 rather than let D94 inherit a green pin.');\n")
P2T_NEW = (
"    + 'THERE IS NO LICENCE ON THIS ASSERTION ANY MORE. The ia-version predicate that refused it above 200 fired on V201, forced this re-pin, and was deleted rather than re-keyed. If a future ruling moves the pull arbitration again, re-derive this census from that ruling\\'s after-grid; do not adjust a number to make a red go green.');\n")
reps.append(('E1e P2 message tail', P2T_OLD, P2T_NEW))

reps.append(('E4c P2c through plain ok()', "  pinned('P2c',R.swapCards===150,\n", "  ok(R.swapCards===150,\n"))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 3 — P6. The NUMBER is unchanged and stays an equality. The PROSE flips: the swing is
#          no longer the movement that wins, it is the movement D94 declines to keep.
# ─────────────────────────────────────────────────────────────────────────────
P6_OLD = (
"  pinned('P6',P6OK,\n"
"    'P6 ONE-NAME LIMB CENSUS, AS AN EQUALITY: the E_PAT posterior-name census held by Pull superset B at p1 on this lattice == {\"Kettlebell swing\":150} — one name, that count, and nothing else in the object; got '+JSON.stringify(R.swapItems)+'. '\n"
"    + 'WHY THIS IS ITS OWN ASSERTION: the ENTIRE positive limb of P2 and P4 rests on a single movement, and until now it rested there silently. Pull superset B\\'s only posterior-capable slot is one draw off EXLIB.conditioning (index.html:1626) = [Ball slams, Kettlebell swing, Burpees, Broad jumps, Mountain climbers, Jump squats], of which EXACTLY ONE is E_PAT posterior. On bodyweight, _bwFlat (index.html:7922) substitutes six names of which ZERO are, which is why the bodyweight tier is excluded from this lattice. '\n"
"    + 'Over the wide lattice the same census reads {\"Kettlebell swing\":7200} — 7,200 of 7,200, 100%, one name — and no other posterior name appears anywhere in that section\\'s 15-name occupancy census. '\n")
P6_NEW = (
"  ok(P6OK,\n"
"    'P6 ONE-NAME LIMB CENSUS, AS AN EQUALITY: the E_PAT posterior-name census held by Pull superset B at p1 on this lattice == {\"Kettlebell swing\":150} — one name, that count, and nothing else in the object; got '+JSON.stringify(R.swapItems)+'. THE NUMBER IS UNCHANGED BY D94 AND THE MEANING IS INVERTED. '\n"
"    + 'THIS IS NOW THE MOVEMENT THE FIX DECLINES TO KEEP. Until D94 the swing was the movement that WON the arbitration: it was the posterior item that lifted Pull superset B over A and cost the day its vertical pull. D94 does not remove it from the pool and does not stop it being drawn; it stops it OUTSCORING the block it was beating, because the Main on that day is already a deadlift variant. So the 150 is still the exact population under discussion, and it is now the population where the swing loses. Read it beside P2\\'s Main-clause count, which is the reason it loses. '\n"
"    + 'WHY THIS IS ITS OWN ASSERTION: the entire positive limb of P2 rests on a single movement, and before this pin it rested there silently. Pull superset B\\'s only posterior-capable slot is one draw off EXLIB.conditioning (index.html:1626) = [Ball slams, Kettlebell swing, Burpees, Broad jumps, Mountain climbers, Jump squats], of which EXACTLY ONE is E_PAT posterior. On bodyweight, _bwFlat (index.html:7922) substitutes six names of which ZERO are, which is why the bodyweight tier is excluded from this lattice. '\n"
"    + 'Over the wide lattice the same census reads {\"Kettlebell swing\":7200} — 7,200 of 7,200, 100%, one name — and no other posterior name appears anywhere in that section\\'s 15-name occupancy census. '\n")
reps.append(('E3 P6 prose flip, number unchanged', P6_OLD, P6_NEW))

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 2c — P4's prose and wrapper.
# ─────────────────────────────────────────────────────────────────────────────
P4M_OLD = (
"  pinned('P4',R.p4Survive===150&&R.swapCards===150,\n"
"    'P4 END-TO-END (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): of the '+R.swapCards+' cards where Pull superset B holds the hinge at p1, '+R.p4Survive+' arrive at the SHIPPED card with Pull superset B or its bare rename intact (want 150 of 150, zero losses). '\n"
"    + 'This pin READS THE SHIPPED CARD BY DESIGN, which is what separates it from P2: P2 proves the arbitration selected B, P4 proves nothing downstream quietly took it back. '\n"
"    + 'V199 is 150 of 150 with zero losses at capRegionalFatigue and capSessionBudget. V198 is 0 of 150, every one of them in the single shape p2/p3/shipped = Pull superset A, because V198 never selected B at all. P4 is therefore RED on the predecessor with the whole population lost. '\n")
P4M_NEW = (
"  ok(R.p4Survive===150&&R.swapCards===150,\n"
"    'P4 END-TO-END, FLIPPED BY D94 (p1 -> shipped card, folding in capRegionalFatigue and capSessionBudget): of the '+R.swapCards+' cards where Pull superset B holds the hinge at p1, '+R.p4Survive+' arrive at the SHIPPED CARD with PULL SUPERSET A or its bare rename intact (want 150 of 150, zero losses). This pinned B before D94; A is now the block the arbitration keeps, so A is the block that has to survive the trip. '\n"
"    + 'This pin READS THE SHIPPED CARD BY DESIGN, which is what separates it from P2: P2 proves the arbitration kept A, P4 proves nothing downstream quietly took it back. The two are not redundant, and P4 is the only place in this file that reads a shipped card. '\n"
"    + 'COUNTERFACTUAL, MEASURED, NOT INFERRED: the revert is 150 of 150 and there are ZERO losses at capRegionalFatigue or capSessionBudget on the shipped card, so the block the arbitration selects is exactly the block the athlete reads. V200 and V199 are 0 of 150 here, every one of them in the single shape where A is gone by p2, because those artifacts select B. P4 is therefore RED on both predecessors with the whole population lost, and GREEN on V198, which never selected B at all. '\n")
reps.append(('E2c P4 prose + ok() wrapper', P4M_OLD, P4M_NEW))

# ── apply ────────────────────────────────────────────────────────────────────
for name, old, new in reps:
    n = src.count(old)
    if n != 1:
        sys.stderr.write('ABORT: anchor %r matched %d times, want 1. Nothing written.\n' % (name, n))
        sys.exit(1)
    src = src.replace(old, new, 1)

for bad in ('const pinned', "pinned('", 'D91_ERA', 'REFUSE_WHY', 'const refuse', 'IAV_M'):
    if bad in src:
        sys.stderr.write('ABORT: licence remnant %r still present. Nothing written.\n' % bad)
        sys.exit(1)

with io.open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(src)

print('g200_pull_arbitration.js: %d replacements applied, %d -> %d bytes' % (len(reps), orig_len, len(src)))
