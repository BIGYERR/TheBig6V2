import { getActiveProgId, getPrograms, iaStore, savePrograms, setActiveProgId } from './storage.ts';
import {
  _setActiveProg, _setActiveProgId, _setConfirmProgId, _setConfirmTier, _setCurrentDayKey, _setCurrentWeek,
  _setEditProgId, _setProgressViewId, activeProg, activeProgId, progressViewId, showScreen, showToast,
} from './rest-day-shell.ts';
import { refreshStoredProgram } from '../../../../../../core/src/engine/state-refresh.ts';
import { calcCurrentWeek, renderWeekView } from './week-view-sections.ts';
import { renderProgList } from './programs.ts';
import { renderProgressScreen } from './lift-ledger-progress-screen.ts';
import { markPastAsked } from './popups-streaks-reminders.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// What a launch hands back for a stored program: core's refreshStoredProgram (state-refresh.ts, v0.262.2) holds the
// rules: the seed put back, the test week pinned, the rebuild, the overlays spliced, the freeze, and the moves, swaps
// and edits laid back. The page hands it its store and the instant, and says what a failure does here. An injury or
// travel plan silently not applying is a safety failure, not a log line, so the athlete is told the plan change did
// not take; the toast is wrapped because this can run at boot before the DOM is ready. A freeze or a rebuild that
// fails is logged, and the launch goes on with what it has.
function refreshProgram(prog: any){
  return refreshStoredProgram(iaStore, prog, Date.now(), {
    overlay: (ov: any, e: any)=>{
      console.error('overlay apply failed', ov && ov.id, e);
      try{ showToast('A plan change failed to apply. Flag it in Bugs.'); }catch(_e){}
    },
    freeze: (e: any)=>{ console.error('week freeze failed; showing fully rebuilt weeks', e); },
    rebuild: (e: any)=>{ console.error('refreshProgram failed; using stored program', e); },
  });
}
// V221 D178: the one loader. Every switch of the active program writes ia_active and the
// three globals together, so ia_active === activeProgId === activeProg.id holds after it.
// Archived never loads (restore first); an unknown id is refused. It does not render or
// navigate; callers do. currentWeek is computed as boot computes it.
// S4: loadActiveProgram(null) is the one clear (ia_active removed, both globals null, week 1,
// no day). It is checked before the lookup, so the archived and unknown refusals cannot fire
// on it. beforeRefresh, when given, runs once the globals name the new id and before
// refreshProgram (boot passes its ex-weight alias fold there, the order boot always had).
function loadActiveProgram(id: any,beforeRefresh?: any){if(id===null){iaStore.remove('ia_active');_setActiveProgId(null);_setActiveProg(null);_setCurrentDayKey(null);_setCurrentWeek(1);return true;}const stored=getPrograms().find(p=>p.id===id);if(!stored)return false;if(stored.archived){showToast('Restore this program first');return false;}setActiveProgId(id);_setActiveProgId(id);if(beforeRefresh)beforeRefresh();_setActiveProg(refreshProgram(stored));_setCurrentWeek(calcCurrentWeek());_setCurrentDayKey(null);return true;}
// V221 D178: Set Active is the one switch; a switch is complete when This Week shows the new block.
// v0.240.1 (D238): a switch marks the new program's past unmarked days as asked (markPastAsked).
function setActive(id: any){if(!loadActiveProgram(id))return;markPastAsked();renderProgList();showScreen('screenWeek');renderWeekView();showToast('Active program updated');}
// @ts-expect-error TS2551 Property 'select' does not exist on type 'HTMLElement'. Did you mean 'onselect'?
function startRename(id: any){_setEditProgId(id);renderProgList();const inp=document.getElementById('renameInput_'+id);if(inp){inp.focus();inp.select();}}
function cancelRename(){_setEditProgId(null);renderProgList();}
function commitRename(id: any){
  const inp=document.getElementById('renameInput_'+id);
  const programs=getPrograms();const p=programs.find(x=>x.id===id);
  if(inp&&p){
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    const nn=(inp.value||'').trim().slice(0,40);
    if(nn&&nn!==p.name){
      p.name=nn;savePrograms(programs);
      if(activeProgId===id&&activeProg)activeProg.name=nn;
      showToast('Renamed ✓');
    }
  }
  _setEditProgId(null);renderProgList();
  if(activeProgId===id&&activeProg)renderWeekView();
}
function purgeProgData(id: any){['ia_logs_','ia_comp_','ia_parts_','ia_hist_','ia_wild_','ia_exw_','ia_moves_','ia_swaps_','ia_swapct_','ia_edits_','ia_pop_dismiss_','ia_pop_idx_','ia_season_shown_','ia_reminded_','ia_remind_last_'].forEach(p=>iaStore.remove(p+id));}
// ── V156: ARCHIVE vs DELETE (D1b ruling) ──────────────────────────────────
// Archive = the program leaves the home list but every store survives; its history
// stays viewable under Progress and feeds the wizard seed. purgeProgData fires ONLY
// from the second confirm tier. Archiving the active program hands active to the
// first non-archived program, exactly as delete always did.
function _handoffActiveFrom(id: any,programs: any){
  if(getActiveProgId()===id||activeProgId===id){
    // @ts-expect-error TS7006 Parameter 'p' implicitly has an 'any' type.
    const nx=programs.find(p=>p.id!==id&&!p.archived);
    // V221 D178: both arms switch through the loader. Next program: the loader sets
    // currentWeek=calcCurrentWeek() and currentDayKey=null, the values this arm set. None left:
    // the loader's null clear removes ia_active and nulls activeProgId and activeProg.
    // v0.240.1 (D238): handing active on is a switch, so the next program's past unmarked days are marked as asked.
    if(nx){ if(loadActiveProgram(nx.id)) markPastAsked(); }
    else loadActiveProgram(null);
  }
}
function archiveProg(id: any){
  const programs=getPrograms();const p=programs.find(x=>x.id===id);if(!p)return;
  p.archived=true;p.archivedAt=Date.now();savePrograms(programs);
  _handoffActiveFrom(id,programs);
  _setConfirmProgId(null);_setConfirmTier(0);
  if(progressViewId===id)_setProgressViewId(null);
  renderProgList();showToast('Program archived');
}
function unarchiveProg(id: any){
  const programs=getPrograms();const p=programs.find(x=>x.id===id);if(!p)return;
  delete p.archived;delete p.archivedAt;savePrograms(programs);
  renderProgList();showToast('Program restored');
}
function askArchive(id: any){_setConfirmProgId(id);_setConfirmTier(1);renderProgList();}
function askPurge(id: any){_setConfirmProgId(id);_setConfirmTier(2);renderProgList();}
function cancelConfirm(){_setConfirmProgId(null);_setConfirmTier(0);renderProgList();}
// fromProgress is optional: the Programs-list call site passes nothing, so its
// behaviour is byte-identical to V168.
function deleteProg(id: any,fromProgress?: any){
  let programs=getPrograms();
  // V221 D178: save before the handoff (archiveProg's order). The loader persists the next
  // program's backfill; saving the stale array after it would overwrite that write.
  programs=programs.filter(p=>p.id!==id);savePrograms(programs);
  _handoffActiveFrom(id,programs);
  purgeProgData(id);
  _setConfirmProgId(null);_setConfirmTier(0);
  if(progressViewId===id)_setProgressViewId(null);
  if(fromProgress)renderProgressScreen();else renderProgList();
  showToast('Program deleted');
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { loadActiveProgram, refreshProgram };
