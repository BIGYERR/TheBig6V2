import io
def edit(path, old, new, label):
    s=io.open(path,encoding='utf-8').read()
    n=s.count(old); assert n==1, 'ANCHOR %s in %s count==%d (want 1)'%(label,path,n)
    io.open(path,'w',encoding='utf-8').write(s.replace(old,new))
    print('ok', path, label)

edit('.claude/agents/builder.md',
 '## Shell discipline\n',
 '## Shell discipline\n**Never run the full `gate.sh` or a full sabotage sweep.** Run `node --check` and the single gate you are editing. The suite is gatekeeper\'s. **Do not set `SABOTAGE_JOBS` or `GATE_JOBS`; the defaults are ruled.**\n',
 'shell')

edit('CLAUDE.md',
 '## Token discipline\n',
 '## Token discipline\n**The orchestrator does not run commands longer than a minute in the main session; delegate them.** **Subagents already have CLAUDE.md in context; do not `Read` it.**\n',
 'token')
