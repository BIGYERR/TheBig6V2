/**
 * @ia/core's engine (architecture phase D, docs/architecture-migration.md): the app's engine files, moved here as
 * TypeScript one group at a time, in the order their imports allow. Each one is also a piece of the app's page:
 * frontends/app/src/legacy/src/order.json lists it as engine/<name>.ts, and the build strips its types to spaces, so the
 * page runs the tokens it ran before (tools/same-script.mjs). This entry re-exports the engine's public face once
 * buildProgram's own file has moved; until then a consumer imports a moved file itself (@ia/core/engine/<name>.ts).
 * It is never a piece of the page.
 */
export {};
