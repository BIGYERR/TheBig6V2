# V202 slice 8 / D108-E13 — the touched-set reads all four stores.
# ia-version is ALREADY 202 and is NOT touched by this script.
import io, sys

P = 'index.html'
src = io.open(P, encoding='utf-8').read()

def rep(old, new, label):
    n = src.count(old)
    print('anchor %-22s count==%d' % (label, n))
    assert n == 1, 'ANCHOR MISS %s: count=%d' % (label, n)
    return src.replace(old, new, 1)

# ── E13 ──────────────────────────────────────────────────────────────────────
OLD = """        // "Touched" = any completion OR any log in that week. Both stores use the
        // same 'w<N>_<day>' key shape. Checking logs too is deliberately
        // conservative: a logged-but-unmarked day still counts as trained.
        const _touched = {};
        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_comp_'+prog.id)||'{}')); }catch(e){}
        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_logs_'+prog.id)||'{}')); }catch(e){}
"""

NEW = """        // "Touched" = a day the athlete has SEEN, proved by ANY of the four stores
        // (V202 D108). It used to read ia_comp_ and ia_logs_ only, and the cut derived
        // from those two alone. Two stores that also prove the day happened were left
        // out: ia_exw_ is a load the athlete wrote against a prescription, and ia_hist_
        // is the snapshot of the prescription they were shown. Measured on the 11->5
        // compression fixture with weeks 1-3 logged: with only ia_exw_ present, 7 of 15
        // logged days were REWRITTEN, and with only ia_hist_ present, the same 7 of 15.
        // ia_hist_ was doubly wrong: it is consulted only INSIDE the w < _cut loop, so a
        // snapshot could not save its own day. The exw-only path is reachable in the
        // shipped app — selectKBSize calls logExerciseWeight and nothing else, so tapping
        // a kettlebell size kept the load and left the prescription rewritable.
        // selectKBSize is deliberately NOT changed: tapping a bell size must not have to
        // write a completion record to be safe.
        //
        // KEY SHAPE. ia_comp_, ia_logs_ and ia_hist_ all key 'w<N>_<day>', so they merge
        // directly. ia_exw_ does NOT: it keys by exercise SLUG (exStoreKey), and each
        // entry carries {week, day, ...}, so its day keys are DERIVED from the entries
        // through entryDay() — the app's single reader of an entry's day, which falls
        // back to the timestamp's weekday for pre-V117 rows. An entry that yields no day
        // at all still contributes 'w<N>_', which raises _maxTouched (the regex below
        // matches it) but can never equal a real _dk(w,d) key, so it moves the frontier
        // without ever falsely freezing a named day.
        const _touched = {};
        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_comp_'+prog.id)||'{}')); }catch(e){}
        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_logs_'+prog.id)||'{}')); }catch(e){}
        try{ Object.assign(_touched, JSON.parse(localStorage.getItem('ia_hist_'+prog.id)||'{}')); }catch(e){}
        try{
          const _exw = JSON.parse(localStorage.getItem('ia_exw_'+prog.id)||'{}');
          Object.keys(_exw).forEach(_slug=>{
            const _ents = (_exw[_slug] && _exw[_slug].entries) || [];
            _ents.forEach(_e=>{
              const _wn = +(_e && _e.week);
              if(!(_wn > 0)) return;
              _touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;
            });
          });
        }catch(e){}
"""
src = rep(OLD, NEW, 'E13/touched-set')

io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE', P)
