import os
ROOT='/Users/CanasBangin/Desktop/TheBig6V2'
OUT='/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/e2775cc4-23d3-42ee-be47-389563c47890/scratchpad/mutants'
src=open(os.path.join(ROOT,'index.html'),encoding='utf-8').read()
probes=[
 ('P1_mark_render_broken_tokens_kept',
  "else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);",
  "else if(wildcardOn(currentWeek,d)) center=(false?wildcardMarkHTML(14):dnum);"),
 ('P2_weekview_tag_dropped_from_innerHTML',
  "list.innerHTML=strip+hero+_wcTag+stats+leg;",
  "list.innerHTML=strip+hero+stats+leg;"),
 ('P3_detail_tag_dropped',
  "const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(_wcTag) html=_wcTag+html;",
  "const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(false) html=_wcTag+html;"),
 ('P4_round_to_floor',
  "const diff=Math.round((d.getTime()-mon.getTime())/86400000);",
  "const diff=Math.floor((d.getTime()-mon.getTime())/86400000);"),
]
for tag,a,b in probes:
    n=src.count(a)
    p=os.path.join(OUT,tag+'.html')
    if n!=1:
        print('%-42s anchor count=%d  NOT-APPLIED'%(tag,n)); continue
    open(p,'w',encoding='utf-8').write(src.replace(a,b))
    print('%-42s anchor count=1  written'%tag)
