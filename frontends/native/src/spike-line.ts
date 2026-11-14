// The words the Bugs screen shows for the native spike (MIGRATION.md phase 2). This file imports nothing of Expo's, so
// the tests in tests/ read it without the Expo app's packages; native-spike.ts does the asking.

/** The word IASpikeModule.swift answers with (modules/ia-spike/ios). */
export const SWIFT_WORD = 'swift';

/** The line for what Swift answered: its own word, or anything else, which is no answer. */
export function swiftLine(answer: string | null): string {
  return answer === SWIFT_WORD ? 'Swift answers.' : 'Swift does not answer.';
}
