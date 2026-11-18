// The Expo app (MIGRATION.md phases 2 and 3). Three tabs, as today's app names them: This Week (phase 2, session 4),
// drawn from the stored state, whose Start lift opens the swipe deck (phase 3, its first screen), which logs into
// this app's own SQLite store (D289), with the pop-ups today's app raises over it (the completion pop-up after Mark
// the day done, the day-after reminder 600 ms after a launch, and its answer), and whose Reopen on a done lift opens the
// day's session sheet (phase 3, its second screen: day-detail/SessionSheet.tsx); and Bugs: the engine check under Hermes (session 1), the Backup row, a backup
// loaded into that store in place of everything in it (session 2), and one line saying whether the app's own Swift
// module answered (session 3, the native spike); and Progress (phase 3, row 4: progress/Progress.tsx), which reads
// the same store and writes to it on Restore and Delete Forever alone. Programs is today's app's still (phase 3).
// The floating rest timer is not here: it comes back on the Dynamic Island (D295, phase 4).
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSION } from '@ia/core';

import { BackupLoad } from './BackupLoad';
import { SessionSheet } from './day-detail/SessionSheet';
import type { SheetOpen } from './day-detail/sheet-screen';
import { DeckOpening } from './deck/DeckOpening';
import type { DeckOpen, DeckProgram } from './deck/deck-screen';
import { EngineCheck } from './EngineCheck';
import { SWIFT_ANSWER } from './native-spike';
import { PopUp } from './pop-up/PopUp';
import { Progress } from './progress/Progress';
import { newProgressState } from './progress/progress-screen';
import type { PopView } from './pop-up/pop-up-model';
import { type PopSession, type Reminder, fireCompletionPopup, maybeShowReminder, popOf, resolveReminder } from './pop-up/pop-ups';
import { swiftLine } from './spike-line';
import { phoneStore } from './store/phone-store';
import { DAY, DISPLAY, NIGHT, type Palette } from './theme';
import { Bars, Bug, Calendar } from './this-week/marks';
import { type DeckFrom, ThisWeek } from './this-week/ThisWeek';
import { storedProgram } from './this-week/week-screen';

/** Which JavaScript engine runs this bundle: Hermes sets HermesInternal on the global object. */
function engineName(): string {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal === 'object' ? 'Hermes' : 'another engine';
}

type Tab = 'week' | 'progress' | 'bugs';

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
  const [deck, setDeck] = useState<{ open: DeckOpen; from: DeckFrom | null } | null>(null);
  // The day open as its session sheet, over the whole screen and the tab bar, or none.
  const [sheet, setSheet] = useState<SheetOpen | null>(null);
  // This Week's size under the deck (D275 call 16): 96% while the deck is open, its own again as it closes.
  const under = useRef(new Animated.Value(1)).current;
  // Today's toast (rest-day-shell.ts showToast): one line over everything, gone after 2.2 s.
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);
  const say = (text: string): void => setToast((t) => ({ text, n: t ? t.n + 1 : 1 }));
  // What Progress keeps between its draws (the program asked for, the delete armed, the estimator's lift), for the
  // app's life, and a count of the taps on its tab: each is the page's showProgressScreen, a screen opened afresh.
  const progress = useRef(newProgressState()).current;
  const [progressTaps, setProgressTaps] = useState(0);
  const go = (t: Tab): void => {
    if (t === 'week' && tab !== 'week') { setTick((n) => n + 1); setHeld(null); }
    if (t === 'progress') setProgressTaps((n) => n + 1);
    setTab(t);
  };
  // The program Make the change handed back (the coach's nudge), which This Week holds until its next launch.
  const [held, setHeld] = useState<DeckProgram | null>(null);
  // A card the deck hands up to be drawn over the toast (the coach's nudge), or none.
  const [over, setOver] = useState<React.ReactNode>(null);

  // ── The pop-ups (popups-streaks-reminders.ts; ./pop-up/pop-ups.ts) ──
  const [calm, setCalm] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setCalm, () => {}); }, []);
  // The pop-up on screen, the reminder it asks about when it is one, and a count so each is a card of its own.
  const [pop, setPop] = useState<{ view: PopView; s: PopSession; ask: Reminder | null; n: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const raise = (s: PopSession, view: PopView, ask: Reminder | null): void => setPop((was) => ({ view, s, ask, n: was ? was.n + 1 : 1 }));
  /** A day just marked done: the season on the program's last day, a streak milestone, or the workout line. */
  const complete = (s: PopSession, week: number, dayKey: string): void => {
    const now = new Date();
    raise(s, popOf(s, fireCompletionPopup(s, week, dayKey, now), now, Math.random), null);
  };
  /** Each launch: 600 ms on, the day-after reminder, once a calendar day, when a past day stands unmarked. */
  const launched = useCallback((prog: DeckProgram | null): void => {
    if (!prog) return;
    timers.current.push(setTimeout(() => {
      const s = { store: phoneStore, prog } as unknown as PopSession, now = new Date();
      const ask = maybeShowReminder(s, now, Math.random);
      if (ask) raise(s, popOf(s, ask.call, now, Math.random), ask);
    }, 600));
  }, []);
  /** A button of the card: the reminder's Done or Skip, or the one that closes it. */
  const answer = (index: number): void => {
    const was = pop;
    setPop(null);
    if (!was || !was.ask) return;
    const done = index === 0, ask = was.ask;
    say(resolveReminder(was.s, ask.week, ask.dayKey, ask.title, done ? 'complete' : 'skipped', Date.now()));
    if (done) timers.current.push(setTimeout(() => complete(was.s, ask.week, ask.dayKey), 380));
  };
  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <StatusBar style={p === NIGHT ? 'light' : 'dark'} />
      {tab === 'week' ? (
        <Animated.View testID="week-under" style={{ flex: 1, transform: [{ scale: under }] }}>
          <ThisWeek palette={p} store={phoneStore} tick={tick} held={held} onDeck={(open, from) => setDeck({ open, from })} onSheet={setSheet} onLaunch={launched} />
        </Animated.View>
      ) : tab === 'progress' ? <Progress key={progressTaps} palette={p} store={phoneStore} state={progress} say={say} /> : <Bugs palette={p} />}
      <View testID="tab-bar" style={[styles.tabbar, { bottom: Math.max(12, insets.bottom), backgroundColor: p.nav, borderColor: p.navEdge }]}>
        <TabButton id="tab-week" label="This Week" on={tab === 'week'} palette={p} onPress={() => go('week')} icon={(c) => <Calendar color={c} size={22} />} />
        <TabButton id="tab-progress" label="Progress" on={tab === 'progress'} palette={p} onPress={() => go('progress')} icon={(c) => <Bars color={c} />} />
        <TabButton id="tab-bugs" label="Bugs" on={tab === 'bugs'} palette={p} onPress={() => go('bugs')} icon={(c) => <Bug color={c} />} />
      </View>
      {deck && (
        <DeckOpening palette={p} store={phoneStore} open={deck.open} from={deck.from} calm={calm} under={under} onClose={() => setDeck(null)} onProgram={setHeld} onOver={setOver} say={say}
          onDone={(prog, week, dayKey) => { setDeck(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey); }} />
      )}
      {sheet && (
        <SessionSheet palette={p} store={phoneStore} open={sheet} calm={calm} onClose={() => setSheet(null)} onProgram={setHeld} onOver={setOver} say={say}
          onDone={(prog, week, dayKey) => { setSheet(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey); }} />
      )}
      {toast && <Toast key={toast.n} text={toast.text} palette={p} bottom={96 + insets.bottom} onDone={() => setToast((t) => (t && t.n === toast.n ? null : t))} />}
      {over}
      {pop && <PopUp key={pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}
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
