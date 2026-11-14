// The Expo app's one screen for now (MIGRATION.md phase 2): the engine check, run under Hermes (session 1), and the
// Backup row, a backup loaded read only into the app's own SQLite store (session 2), and one line saying whether the
// app's own Swift module answered (session 3, the native spike).
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { VERSION } from '@ia/core';

import { BackupLoad } from './BackupLoad';
import { EngineCheck } from './EngineCheck';
import { SWIFT_ANSWER } from './native-spike';
import { swiftLine } from './spike-line';
import { DAY, NIGHT } from './theme';

/** Which JavaScript engine runs this bundle: Hermes sets HermesInternal on the global object. */
function engineName(): string {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal === 'object' ? 'Hermes' : 'another engine';
}

export default function App() {
  const p = useColorScheme() === 'dark' ? NIGHT : DAY;
  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <StatusBar style={p === NIGHT ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: p.text }]}>Bugs</Text>
        <Text testID="runtime-line" style={[styles.meta, { color: p.muted }]}>
          {'Runs on ' + engineName() + '. Version ' + VERSION + '.'}
        </Text>
        <Text testID="swift-line" style={[styles.meta, styles.second, { color: p.muted }]}>
          {swiftLine(SWIFT_ANSWER)}
        </Text>
        <EngineCheck palette={p} />
        <BackupLoad palette={p} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 72, paddingHorizontal: 16, paddingBottom: 48 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  meta: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  second: { marginTop: -16 },
});
