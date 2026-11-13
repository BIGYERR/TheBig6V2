// The engine check's row (D286 P-ENGINECHECK, docs/decisions/engine-check.md), in the Expo app: the same label, note,
// button and lines as today's Bugs tab, from core's engine-check.ts as it is, with buildProgram as the engine. Slices
// of 40 ms (core's default), a zero timer between them so the screen draws, timed on performance.now() (never the
// date). It reads and writes no stored key; the result lives in this component only.
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildProgram } from '@ia/core/engine/budget-engine-d.ts';
import {
  engineCheckBegin, engineCheckCases, engineCheckLine, engineCheckSlice,
} from '@ia/core/engine/engine-check.ts';
import type { EngineCheckRun } from '@ia/core/engine/engine-check.ts';

import type { Palette } from './theme';

export function EngineCheck({ palette: p }: { palette: Palette }) {
  const [line, setLine] = useState('');
  const [running, setRunning] = useState(false);
  const runRef = useRef<EngineCheckRun | null>(null);

  const start = useCallback(() => {
    if (runRef.current && runRef.current.endedAt === null) return;
    const run = engineCheckBegin(engineCheckCases(), performance.now());
    runRef.current = run;
    setRunning(true);
    setLine(engineCheckLine(run));
    const step = () => {
      const done = engineCheckSlice(run, buildProgram, () => performance.now());
      setLine(engineCheckLine(run));
      if (done) setRunning(false);
      else setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
      <Text style={[styles.label, { color: p.text }]}>Engine</Text>
      <Text style={[styles.note, { color: p.muted }]}>Builds the tested programs on this phone. Each one must match.</Text>
      <Pressable
        testID="engine-check-run"
        accessibilityRole="button"
        disabled={running}
        onPress={start}
        style={({ pressed }) => [styles.button, { backgroundColor: p.accent, opacity: running ? 0.5 : pressed ? 0.8 : 1 }]}
      >
        <Text style={[styles.buttonText, { color: p.onInk }]}>{running ? 'Checking' : 'Run the check'}</Text>
      </Pressable>
      {line !== '' && <Text testID="engine-check-line" style={[styles.line, { color: p.text }]}>{line}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  label: { fontSize: 17, fontWeight: '700' },
  note: { fontSize: 15, marginTop: 4, lineHeight: 20 },
  button: { marginTop: 14, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  line: { fontSize: 15, marginTop: 12, lineHeight: 20 },
});
