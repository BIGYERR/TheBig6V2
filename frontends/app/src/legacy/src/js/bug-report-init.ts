import { getActiveProgId, getPrograms } from './storage.ts';
import { activeProg, currentWeek, showScreen, showToast } from './rest-day-shell.ts';
import { foldExAliasKeys } from '../../../../../../core/src/engine/exercise-library.ts';
import { renderWeekView } from './week-view-sections.ts';
import { getExWeights, saveExWeights } from './log-entries.ts';
import { _ruIsland } from './rest-timer.ts';
import { renderProgList } from './programs.ts';
import { loadActiveProgram } from './program-manage.ts';
import { maybeShowReminder } from './popups-streaks-reminders.ts';
import { IA_VERSION, iaVersionLabel } from './update-check.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// BUG REPORT — posts to Web3Forms (static-site friendly; no backend).
// Set BUG_FORM_KEY to your free Web3Forms access key (web3forms.com → enter your
// email → key is emailed to you). Submissions arrive at that email. The key being
// visible in page source is expected/safe for Web3Forms.
const BUG_FORM_KEY='0d660f2b-c9d3-4a37-b944-21150f8fb40c';
async function submitBug(){
  const ta=document.getElementById('bugText');
  const status=document.getElementById('bugStatus');
  const btn=document.getElementById('bugSubmit');
  if(!ta||!status) return;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const txt=(ta.value||'').trim();
  if(!txt){status.style.color='var(--muted)';status.textContent='Type what went wrong first.';return;}
  // @ts-expect-error TS2367 This comparison appears to be unintentional because the types '"0d660f2b-c9d3-4a37-b944-21150f8fb40c"' 
  if(BUG_FORM_KEY==='YOUR_WEB3FORMS_ACCESS_KEY'){status.style.color='var(--red)';status.textContent='Bug form not configured yet — add your Web3Forms key.';return;}
  let ctx='';
  try{
    const ap=activeProg;
    ctx='\n\n— context —\n'
      +'build: '+iaVersionLabel(IA_VERSION)+'\n'
      +'time: '+new Date().toISOString()+'\n'
      +'ua: '+navigator.userAgent+'\n'
      +'viewport: '+window.innerWidth+'x'+window.innerHeight+'\n'
      +'standalone: '+((window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)?'yes':'no')+'\n'
      +'url: '+location.href+'\n'
      +(ap?('program: '+(ap.name||'?')+' / goal '+(ap.goal||'?')+' / wk '+currentWeek+' / id '+(ap.id||'?')):'program: none');
  }catch(e){}
  const _lbl=btn?btn.textContent:'';
  // @ts-expect-error TS2339 Property 'disabled' does not exist on type 'HTMLElement'.
  if(btn){btn.disabled=true;btn.textContent='Sending…';btn.style.opacity='0.6';}
  status.style.color='var(--muted)';status.textContent='';
  try{
    const r=await fetch('https://api.web3forms.com/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({access_key:BUG_FORM_KEY,subject:'The Asylum — Bug Report',from_name:'Asylum Bug Reporter',message:txt+ctx})
    });
    let j={};try{j=await r.json();}catch(e){}
    // @ts-expect-error TS2339 Property 'success' does not exist on type '{}'.
    if(r.ok&&j&&j.success){ta.value='';status.style.color='var(--green)';status.textContent='Sent ✓ — thanks, I got it.';showToast('Bug sent ✓');}
    else{status.style.color='var(--red)';status.textContent='Could not send — try again in a sec.';}
  }catch(e){
    status.style.color='var(--red)';status.textContent='Network error — try again.';
  }finally{
    // @ts-expect-error TS2339 Property 'disabled' does not exist on type 'HTMLElement'.
    if(btn){btn.disabled=false;btn.textContent=_lbl;btn.style.opacity='1';}
  }
}

// INIT
function init(){
  // V239 (D233 R3): boot ends every island activity the app owns, so a reload and the island agree. First, so no
  // later throw in init can skip it; the stopwatch holds its initials here, so this is end() in the native app
  // and a no-op on the PWA (no window.iaIsland).
  _ruIsland();
  const _bv=document.getElementById('bugVersion'); if(_bv) _bv.textContent='BUILD '+iaVersionLabel(IA_VERSION);
  renderProgList();
  const aid=getActiveProgId();const programs=getPrograms();
  // V221 D178: boot switches through the loader, so a fallback pick is written back to ia_active.
  // The alias fold rides in as the loader's pre-refresh step: after activeProgId, before refreshProgram.
  // @ts-expect-error TS7006 Parameter 'p' implicitly has an 'any' type.
  if(aid&&programs.length){const stored=programs.find(p=>p.id===aid&&!p.archived)||programs.find(p=>!p.archived);if(stored&&loadActiveProgram(stored.id,()=>{try{const _x=getExWeights();if(foldExAliasKeys(_x))saveExWeights(_x);}catch(e){}})){showScreen('screenWeek');renderWeekView();setTimeout(maybeShowReminder,600);return;}}
  // V221 D178: a pointer that resolved to nothing loadable (every program archived, or none
  // stored) is cleared through the loader before Home, so ia_active never names a program that
  // is not loaded. No pointer at all: this line is skipped and nothing is written, as before.
  if(aid)loadActiveProgram(null);
  showScreen('screenHome');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { init };
