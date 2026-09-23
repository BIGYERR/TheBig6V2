import sys
S=sys.argv[1]; src=open(S+'/pre_s6_208.html',encoding='utf-8').read()
old="""function _longRunTier(cardio){
  if(!cardio || !cardio.isNRC || !cardio.dose) return null;
  if(!/^long run/i.test(cardio.subtype||'')) return null;
  if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
  if(/rehearsal/i.test(cardio.detail||'')) return 'A';
"""
new="""function _longRunTier(cardio){
  if(!cardio || !cardio.dose) return null;
  if(cardio.isNRC){
    if(!/^long run/i.test(cardio.subtype||'')) return null;
    if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
    if(/rehearsal/i.test(cardio.detail||'')) return 'A';
  } else if(cardio.type!=='run' || cardio.dose.key!=='long') return null;
"""
assert src.count(old)==1, src.count(old)
open(S+'/cf_s6_208.html','w',encoding='utf-8').write(src.replace(old,new,1)); print('CF-OK')
