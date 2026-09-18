import io
P='IRON_ASYLUM_HANDOFF_1_1.md'
s=io.open(P,encoding='utf-8').read()
def rep(old,new,label):
    global s
    n=s.count(old); assert n==1,'ANCHOR %s count==%d (want 1)'%(label,n)
    s=s.replace(old,new)

# 1. One-line D-code registry, directly under the working-file line so session-start reads it.
rep('\n\n- **Most recent work (V198): D85',
    '\n\n- **D-CODE REGISTRY (read before issuing any D-code): highest assigned = D90. Next free = D91.** Keep this line current in the same edit that issues a number. Three collisions happened in one session at V198 (D86/D87 already shipped in V197, then D90 proposed twice) and the V192 D41/D45 collision in this file is the same failure.\n\n- **Most recent work (V198): D85','registry')

# 2. Record Mario's ruling on REFUSED, and mark the three as the next tooling pass, in order.
rep("- **`gate.sh` cannot see a REFUSED assertion (V198).** The runner greps only `^PASS [0-9]+ FAIL [0-9]+`, so `g197d`'s new `REFUSED n` bucket is honest in the gate's own output and invisible to the exit code. **Two-line fix: have `gate.sh` grep `^REFUSED` and echo it beside the summary.** Whether a refusal should also BLOCK is unruled and is Mario's.",
    "- **NEXT TOOLING PASS, ITEM 1 of 3 — `gate.sh` cannot see a REFUSED assertion (V198).** The runner greps only `^PASS [0-9]+ FAIL [0-9]+`, so `g197d`'s `REFUSED n` bucket is honest in the gate's own output and invisible to the exit code. Have `gate.sh` grep `^REFUSED` and echo it beside the summary. **RULED (Mario, V198): a refusal BLOCKS. A claim that did not run is not a pass.** That is the whole reason the refusal was built loud rather than silent.",'refused')
rep('- **`g193_budget_floor` B4g will fail V199 by construction (V198 gatekeeper).**',
    '- **NEXT TOOLING PASS, ITEM 2 of 3 — `g193_budget_floor` B4g will fail V199 by construction (V198 gatekeeper).**','b4g')
rep('- **`g197d_d84_base` still carries ZERO mutation coverage, and the cheap fix is now one step away (V198).**',
    '- **NEXT TOOLING PASS, ITEM 3 of 3 — `g197d_d84_base` still carries ZERO mutation coverage, and the cheap fix is now one step away (V198).**','g197d')

io.open(P,'w',encoding='utf-8').write(s)
print('registry + tooling queue OK')
