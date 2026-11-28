// The engine check as the Expo app holds it (D286 P-ENGINECHECK, docs/decisions/engine-check.md): today's
// engineCheckRun, engineCheckNow and engineCheckListen with the page's globals as one object the app keeps for its
// life. The check runs on in the page behind the other tabs, so here it runs on with no screen up: a screen that
// comes back reads where it is, and hears each line from then on. Core's check and engine, as they are: slices of
// 40 ms (core's default), a zero timer between them so the screen draws, timed on performance.now() (never the
// date). This file imports nothing of React's, so the tests in tests/ run it as it is.
import { buildProgram } from '@ia/core/engine/budget-engine-d.ts';
import {
  engineCheckBegin, engineCheckCases, engineCheckLine, engineCheckSlice,
} from '@ia/core/engine/engine-check.ts';
import type { EngineCheckRun } from '@ia/core/engine/engine-check.ts';

/** The check as the app holds it: the run, its line, whether it is still going, and the screen to tell while one is up. */
export interface EngineState { run: EngineCheckRun | null; line: string; running: boolean; listen: (() => void) | null }
export const newEngineState = (): EngineState => ({ run: null, line: '', running: false, listen: null });

type Cases = ReturnType<typeof engineCheckCases>;
type Build = Parameters<typeof engineCheckSlice>[1];
/**
 * Today's engineCheckRun: one run at a time, built in slices, each line handed to the screen while one is
 * listening. The cases and the engine are core's unless a test hands in its own.
 */
export function startEngineCheck(state: EngineState, cases: Cases = engineCheckCases(), build: Build = buildProgram): void {
  if (state.run && state.run.endedAt === null) return;
  const run = engineCheckBegin(cases, performance.now());
  state.run = run;
  state.running = true;
  state.line = engineCheckLine(run);
  if (state.listen) state.listen();
  const step = (): void => {
    const done = engineCheckSlice(run, build, () => performance.now());
    state.line = engineCheckLine(run);
    if (done) state.running = false;
    else setTimeout(step, 0);
    if (state.listen) state.listen();
  };
  setTimeout(step, 0);
}
