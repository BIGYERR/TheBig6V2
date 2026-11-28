// The GPS recorder as this build holds it (MIGRATION.md phase 4): the Swift module IAGps (modules/ia-gps) behind
// today's calls (gps-bridge.ts), asked for once, when the bundle loads. A build without the module, or one whose
// lookup throws, has no recorder: no Run recorder row on Bugs and no Record run on a run card, as today's page has
// neither in a browser (run-recorder-model.ts recorderAvailable).
import { requireOptionalNativeModule } from 'expo';

import { type AppGps, type NativeGps, gpsOver } from './gps-bridge';

function find(): AppGps | null {
  try {
    const native = requireOptionalNativeModule<NativeGps>('IAGps');
    return native ? gpsOver(native) : null;
  } catch {
    return null;
  }
}

/** The recorder, or null where the module is not built in. */
export const GPS: AppGps | null = find();
