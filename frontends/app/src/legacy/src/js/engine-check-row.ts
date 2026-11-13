import { buildProgram } from '../../../../../../core/src/engine/budget-engine-d.ts';
import {
  engineCheckBegin, engineCheckCases, engineCheckLine, engineCheckSlice,
} from '../../../../../../core/src/engine/engine-check.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// D286 P-ENGINECHECK (docs/decisions/engine-check.md): the Bugs page's Engine row. Run the check builds HALF_MANNY and
// the 864 lattice configs with this page's engine, on this phone, in slices of about 40 ms with a zero timer between
// them so the screen answers, and prints how many digests equal the ones CI pins. The cases, the digest and the lines
// are core's (core/src/engine/engine-check.ts); this file holds the timers and the row. It reads and writes no stored
// key, and keeps its result in memory only.
import type { EngineCheckRun } from '../../../../../../core/src/engine/engine-check.ts';

type EngineCheckListener=(line: string,running: boolean)=>void;
let _engineCheck: EngineCheckRun|null=null;
let _engineCheckListener: EngineCheckListener|null=null;

// The Angular Bugs screen listens; with no listener the legacy page's row (#engineCheckRun, #engineCheckMsg) shows it.
function engineCheckListen(fn: EngineCheckListener|null){_engineCheckListener=fn;}
function _engineCheckShow(run: EngineCheckRun){
  const line=engineCheckLine(run),running=run.endedAt===null;
  if(_engineCheckListener){_engineCheckListener(line,running);return;}
  const m=document.getElementById('engineCheckMsg'),b=document.getElementById('engineCheckRun');
  if(m) m.textContent=line;
  if(b) b.textContent=running?'Checking':'Run the check';
}
// What the row shows now: the last check's line and whether it still runs, or null before the first.
function engineCheckNow(): {line: string;running: boolean}|null{
  return _engineCheck?{line:engineCheckLine(_engineCheck),running:_engineCheck.endedAt===null}:null;
}
// Starts a check. A tap while one runs does nothing (false). Time is performance.now(), which runs on when the date
// is frozen (the e2e freezes it): timed on Date.now() a frozen clock never ends a slice, and the whole check ran as
// one block with the screen still.
function engineCheckRun(): boolean{
  if(_engineCheck&&_engineCheck.endedAt===null) return false;
  const run=engineCheckBegin(engineCheckCases(),performance.now());
  _engineCheck=run;
  _engineCheckShow(run);
  const tick=()=>{
    const done=engineCheckSlice(run,buildProgram,()=>performance.now());
    _engineCheckShow(run);
    if(!done) setTimeout(tick,0);
  };
  setTimeout(tick,0);
  return true;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { engineCheckListen, engineCheckNow, engineCheckRun };
