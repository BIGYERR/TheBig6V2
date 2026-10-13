// The legacy reads the cardio fields make, kept apart from Angular so the tests drive the same reads against the booted
// single-file app.
import type { FieldReads, WheelSpec } from './cardio-fields-model.ts';
import type { BridgeLike } from './session-sections-reads.ts';

/** The wheel spec, the session code and the pace format, through the bridge. */
export function fieldReads(b: BridgeLike): FieldReads {
  return {
    spec: b.global<Record<string, WheelSpec>>('_IAW_SPEC'),
    sessionCode: (sub, key, sport) => b.call<string>('runSessionCode', sub, key, sport),
    pace: (sec) => b.call<string | null>('_fmtPaceMi', sec),
  };
}
