#!/usr/bin/env python3
# V211 slice B consequence — g199 and g200 instrument anchors follow the call site.
# D155 needs recoveryDeload to read the day's long-run tier, so the week-assembly call site now
# passes cardio: recoveryDeload(_s) -> recoveryDeload(_s,cardio). Both gates split that exact line
# (A_PIPE -> A_PIPE_R) to see the deload's input and output; with the old text they REFUSE (anchor
# count 0). This script adds pipeFor(RAW), which picks whichever call-site form the artifact
# carries, and whose V211 split passes cardio too, so the instrumented copy stays inert (A2).
# The A_PIPE / A_PIPE_R declarations stay byte-identical (measure scripts regex them), and no
# oracle, pin, lattice or expectation line changes. THREE edits per file.
import io, sys
R = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

HELPER = (
 "// V211 (D155): recoveryDeload reads the day's long-run tier, so the call site passes cardio. The\n"
 "// instrument follows whichever call-site form the artifact carries; the V211 split passes cardio\n"
 "// too, so the instrumented copy stays inert (A2). A_PIPE and A_PIPE_R above are unchanged.\n"
 "const A_PIPE_D155=A_PIPE.replace('recoveryDeload(_s):_s','recoveryDeload(_s,cardio):_s');\n"
 "const A_PIPE_R_D155=A_PIPE_R.replace('recoveryDeload(__p1):__p1','recoveryDeload(__p1,cardio):__p1');\n"
 "function pipeFor(RAW){ return RAW.split(A_PIPE_D155).length-1===1?[A_PIPE_D155,A_PIPE_R_D155]:[A_PIPE,A_PIPE_R]; }\n")

def edits(snap_anchor):
    return [
     ("helper after SNAP_FN, before instrument()",
      "function instrument(art,tag){\n  const RAW=fs.readFileSync(art,'utf8');\n  const n=RAW.split(A_PIPE).length-1;\n",
      HELPER + "function instrument(art,tag){\n  const RAW=fs.readFileSync(art,'utf8');\n  const [AP,APR]=pipeFor(RAW);\n  const n=RAW.split(AP).length-1;\n"),
     ("instrument() replaces the form it found",
      "  fs.writeFileSync(out,RAW.replace(A_PIPE,A_PIPE_R));\n",
      "  fs.writeFileSync(out,RAW.replace(AP,APR));\n"),
     ("A1 counts the form the artifact carries",
      "const anchorN=RAW.split(A_PIPE).length-1;\n",
      "const anchorN=RAW.split(pipeFor(RAW)[0]).length-1;\n"),
    ]

for f in ['g199_deload_arbitration.js', 'g200_pull_arbitration.js']:
    p = R + f
    src = io.open(p, encoding='utf-8').read()
    E = edits(None)
    for tag, a, b in E:
        n = src.count(a)
        if n != 1:
            print('ABORT:', f, tag, 'count', n); sys.exit(1)
    # the two literal fragments pipeFor rewrites must exist exactly once in each declaration
    if src.count("recoveryDeload(_s):_s") != 1 or src.count("recoveryDeload(__p1):__p1") != 1:
        print('ABORT:', f, 'call-site fragments not unique'); sys.exit(1)
for f in ['g199_deload_arbitration.js', 'g200_pull_arbitration.js']:
    p = R + f
    src = io.open(p, encoding='utf-8').read()
    for tag, a, b in edits(None):
        src = src.replace(a, b, 1); print('applied', f, '|', tag)
    io.open(p, 'w', encoding='utf-8').write(src)
print('instrument follow-up written: 3 edits x 2 files')
