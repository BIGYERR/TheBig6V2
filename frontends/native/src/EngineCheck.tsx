// The engine check's row (D286 P-ENGINECHECK, docs/decisions/engine-check.md), in the Expo app: the same label, note,
// button and lines as today's Bugs tab, in today's row (bugs/rows.tsx). The check itself, and what it keeps, is
// engine-check-state.ts: the app holds the run and its line for its life, so a check still running when this screen
// comes back shows where it is, as today's. It reads and writes no stored key.
import { useEffect, useState } from 'react';

import { Note, Opt, Row, Seg } from './bugs/rows';
import { type EngineState, startEngineCheck } from './engine-check-state';
import type { Palette } from './theme';

export function EngineCheck({ palette: p, state }: { palette: Palette; state: EngineState }) {
  const [, setDraws] = useState(0);
  // Today's engineCheckListen: this screen hears each line while it is up, and nothing hears them once it is gone.
  useEffect(() => {
    state.listen = () => setDraws((n) => n + 1);
    return () => { state.listen = null; };
  }, [state]);
  const { line, running } = state;
  const start = (): void => startEngineCheck(state);

  return (
    <Row id="engine-row" label={'Engine'} palette={p}>
      <Note palette={p}>{'Builds the tested programs on this phone. Each one must match.'}</Note>
      <Seg>
        <Opt id="engine-check-run" label={running ? 'Checking' : 'Run the check'} palette={p} onPress={start} />
      </Seg>
      <Note id="engine-check-line" palette={p}>{line}</Note>
    </Row>
  );
}
