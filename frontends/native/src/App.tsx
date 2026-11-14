// The Expo app (MIGRATION.md phase 2). Two tabs, as today's app names them: This Week (session 4), drawn read only
// from the stored state, and Bugs: the engine check under Hermes (session 1), the Backup row, a backup loaded read
// only into the app's own SQLite store (session 2), and one line saying whether the app's own Swift module answered
// (session 3, the native spike). Programs and Progress are today's app's still (phase 3).
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSION } from '@ia/core';

import { BackupLoad } from './BackupLoad';
import { EngineCheck } from './EngineCheck';
import { SWIFT_ANSWER } from './native-spike';
import { swiftLine } from './spike-line';
import { phoneStore } from './store/phone-store';
import { DAY, DISPLAY, NIGHT, type Palette } from './theme';
import { Bug, Calendar } from './this-week/marks';
import { ThisWeek } from './this-week/ThisWeek';
import { liveProgram } from './this-week/week-screen';

/** Which JavaScript engine runs this bundle: Hermes sets HermesInternal on the global object. */
function engineName(): string {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal === 'object' ? 'Hermes' : 'another engine';
}

type Tab = 'week' | 'bugs';

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

function Shell() {
  const p = useColorScheme() === 'dark' ? NIGHT : DAY;
  const insets = useSafeAreaInsets();
  // This Week when the store holds a program, as today's app opens; Bugs, where a backup is loaded, until it does.
  const [tab, setTab] = useState<Tab>(() => (liveProgram(phoneStore) ? 'week' : 'bugs'));
  // Counts the visits to This Week, so it reads the store again after a backup is loaded on Bugs.
  const [tick, setTick] = useState(0);
  const go = (t: Tab): void => {
    if (t === 'week' && tab !== 'week') setTick((n) => n + 1);
    setTab(t);
  };
  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <StatusBar style={p === NIGHT ? 'light' : 'dark'} />
      {tab === 'week' ? <ThisWeek palette={p} store={phoneStore} tick={tick} /> : <Bugs palette={p} />}
      <View testID="tab-bar" style={[styles.tabbar, { bottom: Math.max(12, insets.bottom), backgroundColor: p.nav, borderColor: p.navEdge }]}>
        <TabButton id="tab-week" label="This Week" on={tab === 'week'} palette={p} onPress={() => go('week')} icon={(c) => <Calendar color={c} size={22} />} />
        <TabButton id="tab-bugs" label="Bugs" on={tab === 'bugs'} palette={p} onPress={() => go('bugs')} icon={(c) => <Bug color={c} />} />
      </View>
    </View>
  );
}

function TabButton({ id, label, on, palette: p, onPress, icon }: { id: string; label: string; on: boolean; palette: Palette; onPress: () => void; icon: (color: string) => React.ReactNode }) {
  const color = on ? p.signal : p.muted;
  return (
    <Pressable testID={id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.tab, on && { backgroundColor: p.navOn }]}>
      {icon(color)}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function Bugs({ palette: p }: { palette: Palette }) {
  return (
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: 72, paddingHorizontal: 16, paddingBottom: 140 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  meta: { fontSize: 13, marginTop: 4, marginBottom: 20 },
  second: { marginTop: -16 },
  // The floating tab bar (look.css .tabbar, D263): 12 from the sides, above the home indicator.
  tabbar: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', padding: 6, borderRadius: 34, borderWidth: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.18)' },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 9, paddingHorizontal: 4, paddingBottom: 8, borderRadius: 28 },
  tabLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
});
