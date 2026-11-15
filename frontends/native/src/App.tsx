// The Expo app (MIGRATION.md phases 2 and 3). Two tabs, as today's app names them: This Week (phase 2, session 4),
// drawn from the stored state, whose Start lift opens the swipe deck (phase 3, its first screen), which logs into
// this app's own SQLite store (D289); and Bugs: the engine check under Hermes (session 1), the Backup row, a backup
// loaded into that store in place of everything in it (session 2), and one line saying whether the app's own Swift
// module answered (session 3, the native spike). Programs and Progress are today's app's still (phase 3).
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSION } from '@ia/core';

import { BackupLoad } from './BackupLoad';
import { Deck } from './deck/Deck';
import type { DeckOpen } from './deck/deck-screen';
import { EngineCheck } from './EngineCheck';
import { SWIFT_ANSWER } from './native-spike';
import { swiftLine } from './spike-line';
import { phoneStore } from './store/phone-store';
import { DAY, DISPLAY, NIGHT, type Palette } from './theme';
import { Bug, Calendar } from './this-week/marks';
import { ThisWeek } from './this-week/ThisWeek';
import { storedProgram } from './this-week/week-screen';

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
  // Asked of the stored program, not of a launch: the screen makes the one launch when it mounts.
  const [tab, setTab] = useState<Tab>(() => (storedProgram(phoneStore) ? 'week' : 'bugs'));
  // Counts the visits to This Week, so it reads the store again after a backup is loaded on Bugs.
  const [tick, setTick] = useState(0);
  // The day open as a swipe deck, over the whole screen and the tab bar (deck.css: above the tab bar), or none.
  const [deck, setDeck] = useState<DeckOpen | null>(null);
  // Today's toast (rest-day-shell.ts showToast): one line over everything, gone after 2.2 s.
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const say = (text: string): void => setToast((t) => ({ text, n: t ? t.n + 1 : 1 }));
  const go = (t: Tab): void => {
    if (t === 'week' && tab !== 'week') setTick((n) => n + 1);
    setTab(t);
  };
  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <StatusBar style={p === NIGHT ? 'light' : 'dark'} />
      {tab === 'week' ? <ThisWeek palette={p} store={phoneStore} tick={tick} onDeck={setDeck} /> : <Bugs palette={p} />}
      <View testID="tab-bar" style={[styles.tabbar, { bottom: Math.max(12, insets.bottom), backgroundColor: p.nav, borderColor: p.navEdge }]}>
        <TabButton id="tab-week" label="This Week" on={tab === 'week'} palette={p} onPress={() => go('week')} icon={(c) => <Calendar color={c} size={22} />} />
        <TabButton id="tab-bugs" label="Bugs" on={tab === 'bugs'} palette={p} onPress={() => go('bugs')} icon={(c) => <Bug color={c} />} />
      </View>
      {deck && <Deck palette={p} store={phoneStore} open={deck} onClose={() => setDeck(null)} say={say} />}
      {toast && <Toast key={toast.n} text={toast.text} palette={p} bottom={96 + insets.bottom} onDone={() => setToast((t) => (t && t.n === toast.n ? null : t))} />}
    </View>
  );
}

/** The toast (overlays-components.css .toast with look.css): the run colour, ink type, fading in and out over 0.2 s. */
function Toast({ text, palette: p, bottom, onDone }: { text: string; palette: Palette; bottom: number; onDone: () => void }) {
  const shown = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(shown, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const out = setTimeout(() => Animated.timing(shown, { toValue: 0, duration: 200, useNativeDriver: true }).start(onDone), 2200);
    return () => clearTimeout(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View pointerEvents="none" style={[styles.toastWrap, { bottom }]}>
      <Animated.View testID="toast" accessibilityLiveRegion="polite" style={[styles.toast, { backgroundColor: p.run, opacity: shown }]}>
        <Text numberOfLines={1} style={styles.toastText}>{text}</Text>
      </Animated.View>
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
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4, maxWidth: '92%' },
  toastText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
