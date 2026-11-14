// The native spike's JavaScript side (MIGRATION.md phase 2): the app asks its own Swift module, IASpike
// (modules/ia-spike), one question, once, when the bundle loads. The module does nothing else. A build without the
// module, or one whose call throws, reads as no answer, never as a crash. The words are in spike-line.ts.
import { requireOptionalNativeModule } from 'expo';

interface Spike { answer(): string }

function ask(): string | null {
  try {
    return requireOptionalNativeModule<Spike>('IASpike')?.answer() ?? null;
  } catch {
    return null;
  }
}

/** What Swift answered when the bundle loaded: asked once, never again. */
export const SWIFT_ANSWER: string | null = ask();
