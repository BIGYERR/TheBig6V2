/**
 * @ia/core's engine (architecture phase D, docs/architecture-migration.md): the app's 17 engine files, moved here as
 * strict TypeScript and typed without a change to the code. Each one is also a piece of the app's page:
 * frontends/app/src/legacy/src/order.json lists it as engine/<name>.ts, and the build takes its types out, so the page
 * carries the JavaScript it always ran (tools/same-script.mjs, tools/engine-move.mjs). This entry is the engine's public
 * face for the other consumers (the tests now, the Angular screens in phase E); it is never a piece of the page.
 */
export { buildProgram } from './budget-engine-d.ts';
export type { EngineCfg, CardioSchedule, PaceRow, RunAnchorInfo } from './cardio-progression.ts';
export type { CardioSession } from './nsw-cardio.ts';
