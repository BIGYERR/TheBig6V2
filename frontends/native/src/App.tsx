// The Expo app (MIGRATION.md phases 2 and 3). Four tabs, as today's app names them: Programs (phase 3, row 5:
// program-list/Programs.tsx), the program list with its goal sheet and its mile pencil; This Week (phase 2, session 4),
// drawn from the stored state, whose Start lift opens the swipe deck (phase 3, its first screen), which logs into
// this app's own SQLite store (D289), with the pop-ups today's app raises over it (the completion pop-up after Mark
// the day done, the day-after reminder 600 ms after a launch, and its answer), and whose Reopen on a done lift opens the
// day's session sheet (phase 3, its second screen: day-detail/SessionSheet.tsx); and Bugs: the engine check under Hermes (session 1), the Backup row, a backup
// loaded into that store in place of everything in it (session 2), and one line saying whether the app's own Swift
// module answered (session 3, the native spike); and Progress (phase 3, row 4: progress/Progress.tsx), which reads
// the same store and writes to it on Restore and Delete Forever alone.
// The rest day sheet (rest-sheet/RestSheet.tsx: Move a session here, Log cardio, Clear) opens from This Week's rest
// card and from the session sheet's Edit cardio, and the coach's mile nudge (D274, mile-nudge/MileNudge.tsx) rises
// over This Week 700 ms after it shows again once a run's Log earned it; both write to this app's own store.
// Hurt? and Traveling? (change-sheet/ChangeSheet.tsx) open from This Week, whose chips carry I'm back, the ✕ and the
// check in; the race date and Program Start open the app's calendar (date-box/DateBox.tsx), as do the sheet's date
// boxes. Each writes ia_programs in this app's own store (change-sheet/overlay-writes.ts, week-dates/week-dates.ts).
// Build New Program on the Programs tab opens the wizard (wizard/Wizard.tsx) over the whole screen: its steps, the
// length's pop-up and the generating screen, which stores the new program (wizard/wizard-writes.ts) and lands on This
// Week's first week. The cardio goals' forms are the row's second session.
// The floating rest timer is not here: it comes back on the Dynamic Island (D295, phase 4).
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSION } from '@ia/core';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { readDayLogs } from '@ia/core/engine/state-day-log.ts';

import { BackupLoad } from './BackupLoad';
import { ChangeSheet } from './change-sheet/ChangeSheet';
import type { OverlayDraft } from './change-sheet/change-sheet-model';
import { type OverlayProgram, newOverlayDraft, openInjury, openTravel } from './change-sheet/overlay-readers';
import { type OverlayAct, type OverlaySession, type OverlayTap, imBackFromInjury, injReassess, injSnooze, removeOverlay } from './change-sheet/overlay-writes';
import { DateBox } from './date-box/DateBox';
import type { DateAsk } from './date-box/date-box';
import { SessionSheet } from './day-detail/SessionSheet';
import type { SheetOpen } from './day-detail/sheet-screen';
import { DeckOpening } from './deck/DeckOpening';
import type { DeckOpen, DeckProgram } from './deck/deck-screen';
import { EngineCheck } from './EngineCheck';
import { MileNudge } from './mile-nudge/MileNudge';
import { nudgeText } from './mile-nudge/mile-nudge-model';
import { NUDGE_DELAY_MS, type PendingNudge, afterLog, answer as answerNudge, update as nudgeMile } from './mile-nudge/nudge-screen';
import { MileSheet } from './mile-sheet/MileSheet';
import { SWIFT_ANSWER } from './native-spike';
import { PopUp } from './pop-up/PopUp';
import { Programs } from './program-list/Programs';
import { type MileOpen, newListState, refreshReport, tabRefused } from './program-list/list-screen';
import { Progress } from './progress/Progress';
import { newProgressState } from './progress/progress-screen';
import { RestSheet } from './rest-sheet/RestSheet';
import { type RestAsk, type RestDraft, type RestLogs, type RestProgram, openRest } from './rest-sheet/rest-sheet-model';
import type { PopView } from './pop-up/pop-up-model';
import { type PopSession, type Reminder, fireCompletionPopup, maybeShowReminder, popOf, resolveReminder } from './pop-up/pop-ups';
import { swiftLine } from './spike-line';
import { phoneStore } from './store/phone-store';
import { DAY, DISPLAY, NIGHT, type Palette } from './theme';
import { Bars, Bug, Calendar, Home } from './this-week/marks';
import { type DeckFrom, ThisWeek, type WeekAsk, type WeekHand } from './this-week/ThisWeek';
import { type DatedProgram, setProgRace, setProgStart, titleAfterDate } from './week-dates/week-dates';
import { Wizard } from './wizard/Wizard';
import { landingTitle } from './wizard/wizard-screen';
import { midnight, storedProgram } from './this-week/week-screen';

/** Which JavaScript engine runs this bundle: Hermes sets HermesInternal on the global object. */
function engineName(): string {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal === 'object' ? 'Hermes' : 'another engine';
}

type Tab = 'home' | 'week' | 'progress' | 'bugs';

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
  // One toast carries a mark before its words (the wizard's floor of training days), as the page writes it.
  const [toast, setToast] = useState<{ text: string; icon: string | null; n: number } | null>(null);
  const say = (text: string, icon?: string): void => setToast((t) => ({ text, icon: icon || null, n: t ? t.n + 1 : 1 }));
  // What Progress keeps between its draws (the program asked for, the delete armed, the estimator's lift), for the
  // app's life, and a count of the taps on its tab: each is the page's showProgressScreen, a screen opened afresh.
  const progress = useRef(newProgressState()).current;
  const [progressTaps, setProgressTaps] = useState(0);
  // What the program list keeps between its draws (the open cards, the rename, the confirmation), for the app's life,
  // and a count of the taps on its tab: each is the page's tabGo, the list drawn afresh from the store.
  const list = useRef(newListState()).current;
  const [homeTaps, setHomeTaps] = useState(0);
  // A sheet the Programs tab hands up to be drawn over the whole screen and the tab bar (the goal sheet, the mile
  // pencil's two), under the toast, or none.
  const [cover, setCover] = useState<React.ReactNode>(null);
  const go = (t: Tab): void => {
    // Today's tab bar: This Week and Progress do not open with no active program, and say why (tabGo).
    const refused = tabRefused(phoneStore, t);
    if (refused) { say(refused); return; }
    if (t === 'week' && tab !== 'week') { setTick((n) => n + 1); setHeld(null); }
    if (t === 'progress') setProgressTaps((n) => n + 1);
    if (t === 'home') setHomeTaps((n) => n + 1);
    setTab(t);
  };
  // The program Make the change handed back (the coach's nudge), which This Week holds until its next launch.
  const [held, setHeld] = useState<DeckProgram | null>(null);
  // A card the deck hands up to be drawn over the toast (the coach's nudge), or none.
  const [over, setOver] = useState<React.ReactNode>(null);

  // ── The rest day sheet (rest-day-shell.ts; ./rest-sheet) ──
  // The sheet open over the whole screen, and what to draw again under it once it wrote (the session sheet, on a
  // day that holds a session and a jog). A count redraws This Week, which reads the store and the grid at each draw.
  const [rest, setRest] = useState<{ prog: RestProgram; draft: RestDraft; wrote: (() => void) | null; n: number } | null>(null);
  const [, setWrites] = useState(0);
  const askRest = (ask: RestAsk, wrote: (() => void) | null = null): void => {
    const r = openRest(ask.prog, readDayLogs(phoneStore, ask.prog.id) as unknown as RestLogs, ask.week, ask.dayKey, ask.view, new Date());
    if ('toast' in r) { say(r.toast); return; }
    setRest((was) => ({ prog: ask.prog, draft: r.draft, wrote, n: was ? was.n + 1 : 1 }));
  };

  // ── The coach's mile nudge (D274; ./mile-nudge) ──
  // Judged after each tap of the cardio card's Log. An offer waits until This Week shows again (the session sheet
  // going or gone), then 700 ms, and rises over it; a sheet opened in the wait starts the wait again.
  const pending = useRef<PendingNudge | null>(null);
  const [waits, setWaits] = useState(0);
  const [going, setGoing] = useState(false);
  const [nudge, setNudge] = useState<PendingNudge | null>(null);
  const [mile, setMile] = useState<MileOpen | null>(null);
  const logged = (progId: string, week: number, dayKey: string): void => {
    const offer = afterLog(phoneStore, progId, week, dayKey, new Date());
    if (!offer) return;
    pending.current = offer;
    setWaits((n) => n + 1);
  };
  const onWeek = tab === 'week' && (!sheet || going);
  useEffect(() => {
    if (!pending.current || !onWeek) return;
    const t = setTimeout(() => { const p = pending.current; pending.current = null; if (p) setNudge(p); }, NUDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [waits, onWeek]);
  /** Either answer leaves the record on the program; Update mile time then opens the mile pencil on the offer. */
  const answered = (open: boolean): void => {
    const n = nudge;
    setNudge(null);
    if (!n) return;
    answerNudge(phoneStore, n);
    if (open) setMile(nudgeMile(phoneStore, n, new Date()));
  };

  // ── The pop-ups (popups-streaks-reminders.ts; ./pop-up/pop-ups.ts) ──
  const [calm, setCalm] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setCalm, () => {}); }, []);
  // The pop-up on screen, the reminder it asks about when it is one, and a count so each is a card of its own.
  // `acts` is what each button does on a card with more than the one that closes it (the check in's Good sign).
  const [pop, setPop] = useState<{ view: PopView; s: PopSession; ask: Reminder | null; acts: OverlayAct[] | null; n: number } | null>(null);
  const popN = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  const raise = (s: PopSession, view: PopView, ask: Reminder | null, acts: OverlayAct[] | null = null): void => setPop({ view, s, ask, acts, n: ++popN.current });
  /** A day just marked done: the season on the program's last day, a streak milestone, or the workout line. */
  const complete = (s: PopSession, week: number, dayKey: string): void => {
    const now = new Date();
    raise(s, popOf(s, fireCompletionPopup(s, week, dayKey, now), now, Math.random), null);
  };
  /** Each launch: 600 ms on, the day-after reminder, once a calendar day, when a past day stands unmarked. */
  const launched = useCallback((prog: DeckProgram | null): void => {
    if (quiet.current) { quiet.current = false; return; }
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
    if (was && was.acts) {
      // The check in's Good sign: I'm back, or More time (the page's popClose, then the call).
      const a = was.acts[index], s = session();
      if (a && s) took(s, a.kind === 'back' ? imBackFromInjury(s, a.id, Date.now(), report) : injSnooze(s, a.id, Date.now()));
      return;
    }
    if (!was || !was.ask) return;
    const done = index === 0, ask = was.ask;
    say(resolveReminder(was.s, ask.week, ask.dayKey, ask.title, done ? 'complete' : 'skipped', Date.now()));
    if (done) timers.current.push(setTimeout(() => complete(was.s, ask.week, ask.dayKey), 380));
  };

  // ── Hurt?, Traveling?, the chips and the two dates (overlays.ts, programs.ts; ./change-sheet, ./week-dates) ──
  // The program in hand is This Week's (today's activeProg), read where the tap lands, so a second date picked in
  // an open calendar writes on the program the first one handed back.
  const hand = useRef<WeekHand>({ prog: null, own: null }).current;
  // ── The wizard (wizard.ts, wizard-generate.ts; ./wizard) ──
  // Open over the whole screen, a count so each Build New Program is a wizard of its own with a draft of its own.
  // EVERY KEYED CHILD OF THE ROOT NAMES ITS KIND IN ITS KEY. Each is counted from one, and they are siblings: keyed by
  // the bare count, the first wizard and the first calendar were both "1", and closing the calendar made React build
  // the wizard again, on its first step with a new draft (seen on the simulator after a race date's pick, Reset and
  // check; once the session before after a start date's).
  const [wizard, setWizard] = useState<number | null>(null);
  const wizardN = useRef(0);
  // After Generate This Week shows the new program with no launch's reminder: the page makes no launch there.
  const quiet = useRef(false);
  // The page's _ovDraft: one draft for the app's life, so Traveling? opens on the dates it last held.
  const ovDraft = useRef<OverlayDraft>(newOverlayDraft());
  const [change, setChange] = useState<{ session: OverlaySession; draft: OverlayDraft; n: number } | null>(null);
  const changeN = useRef(0);
  const [dateAsk, setDateAsk] = useState<{ ask: DateAsk; n: number } | null>(null);
  const dateN = useRef(0);
  const openDate = (ask: DateAsk): void => setDateAsk({ ask, n: ++dateN.current });
  const [resets, setResets] = useState(0);
  const report = refreshReport(say);
  const session = (): OverlaySession | null => (hand.prog ? { store: phoneStore, prog: hand.prog as unknown as OverlayProgram } : null);
  /** What a chip's tap left, in today's order: the program in hand, This Week drawn, the toast or the pop-up. */
  function took(s: OverlaySession, r: OverlayTap | null): void {
    if (!r) return;
    if (r.prog) setHeld(r.prog as unknown as DeckProgram);
    setWrites((n) => n + 1);
    if (r.toast) say(r.toast);
    if (r.pop) {
      const ps = { store: phoneStore, prog: r.prog || s.prog } as unknown as PopSession, now = new Date();
      raise(ps, popOf(ps, r.pop, now, Math.random), null, r.acts || null);
    }
  }
  /** A date picked for This Week's row: stored, the program in hand, the title back on today's when the page's is. */
  const dated = (which: 'race' | 'start', iso: string): void => {
    const prog = hand.prog as unknown as DatedProgram | null, now = Date.now();
    const r = which === 'race' ? setProgRace(phoneStore, prog, iso, now, report) : setProgStart(phoneStore, prog, iso, now, report);
    if (!r) return;
    if (r.set) {
      setHeld(r.prog as unknown as DeckProgram);
      const t = titleAfterDate(hand.own, r.prog, midnight(new Date(now)));
      hand.own = t.own;
      if (t.reset) setResets((n) => n + 1);
    }
    setWrites((n) => n + 1);
    say(r.toast);
  };
  const asked = (ask: WeekAsk): void => {
    const s = session();
    if (!s) return;
    const now = new Date();
    if (ask.kind === 'hurt' || ask.kind === 'travel') {
      const draft = ask.kind === 'hurt' ? openInjury(ovDraft.current, s.prog, now) : openTravel(ovDraft.current, now);
      ovDraft.current = draft;
      setChange({ session: s, draft, n: ++changeN.current });
    } else if (ask.kind === 'remove') took(s, removeOverlay(s, ask.id, now.getTime(), report));
    else if (ask.kind === 'back') took(s, imBackFromInjury(s, ask.id, now.getTime(), report));
    else if (ask.kind === 'answer') took(s, injReassess(s, ask.id, ask.ans, now.getTime()));
    else openDate({ value: ask.value, min: null, onChange: (iso) => dated(ask.which, iso) });
  };

  return (
    <View style={[styles.root, { backgroundColor: p.bg }]}>
      <StatusBar style={p === NIGHT ? 'light' : 'dark'} />
      {tab === 'home' ? (
        <Programs key={'programs' + homeTaps} palette={p} store={phoneStore} state={list} calm={calm} say={say} onSwitch={() => go('week')} onGone={(id) => { if (progress.viewId === id) progress.viewId = null; }} onCover={setCover} onBuild={() => setWizard(++wizardN.current)} />
      ) : tab === 'week' ? (
        <Animated.View testID="week-under" style={{ flex: 1, transform: [{ scale: under }] }}>
          <ThisWeek palette={p} store={phoneStore} tick={tick} held={held} hand={hand} resets={resets} onAsk={asked} onDeck={(open, from) => setDeck({ open, from })} onSheet={(s) => { setGoing(false); setSheet(s); }} onRest={(ask) => askRest(ask)} onLaunch={launched} />
        </Animated.View>
      ) : tab === 'progress' ? <Progress key={'progress' + progressTaps} palette={p} store={phoneStore} state={progress} say={say} /> : <Bugs palette={p} />}
      <View testID="tab-bar" style={[styles.tabbar, { bottom: Math.max(12, insets.bottom), backgroundColor: p.nav, borderColor: p.navEdge }]}>
        <TabButton id="tab-home" label="Programs" on={tab === 'home'} palette={p} onPress={() => go('home')} icon={(c) => <Home color={c} />} />
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
          onRest={askRest} onLogged={(week, dayKey) => logged(sheet.prog.id, week, dayKey)} onGoing={() => setGoing(true)}
          onDone={(prog, week, dayKey) => { setSheet(null); complete({ store: phoneStore, prog } as unknown as PopSession, week, dayKey); }} />
      )}
      {cover}
      {wizard !== null && (
        <Wizard key={'wizard' + wizard} palette={p} store={phoneStore} say={say} report={report} onDate={openDate} onClose={() => setWizard(null)}
          onDone={(prog) => {
            // The page's doGenerate: the current week is 1, then This Week is shown and drawn.
            hand.land = landingTitle(prog, midnight(new Date()));
            quiet.current = true;
            setWizard(null); setHeld(null); setTick((n) => n + 1); setTab('week');
          }} />
      )}
      {rest && (
        <RestSheet key={'rest' + rest.n} palette={p} session={{ store: phoneStore, prog: rest.prog }} draft={rest.draft} calm={calm} say={say} onClose={() => setRest(null)}
          onWrote={() => { setWrites((n) => n + 1); if (rest.wrote) rest.wrote(); }} />
      )}
      {mile && (
        <MileSheet palette={p} store={phoneStore} open={mile} calm={calm} say={say} onClose={() => setMile(null)}
          report={refreshReport(say)}
          onDone={(o) => { if (o.prog) setHeld(o.prog as unknown as DeckProgram); if (o.toast) say(o.toast); }} />
      )}
      {change && (
        <ChangeSheet key={'change' + change.n} palette={p} session={change.session} draft={change.draft} calm={calm} say={say} report={report}
          onDraft={(d) => { ovDraft.current = d; }} onDate={openDate} onClose={() => setChange(null)}
          onDone={(r) => { if (r.prog) setHeld(r.prog as unknown as DeckProgram); setWrites((n) => n + 1); }} />
      )}
      {dateAsk && <DateBox key={'date' + dateAsk.n} palette={p} ask={dateAsk.ask} calm={calm} onClose={() => setDateAsk(null)} />}
      {toast && <Toast key={'toast' + toast.n} text={toast.text} icon={toast.icon} palette={p} bottom={96 + insets.bottom} onDone={() => setToast((t) => (t && t.n === toast.n ? null : t))} />}
      {over}
      {nudge && <MileNudge palette={p} text={nudgeText(nudge.offer)} calm={calm} onUpdate={() => answered(true)} onKeep={() => answered(false)} />}
      {pop && <PopUp key={'pop' + pop.n} palette={p} view={pop.view} calm={calm} onAct={answer} onClose={() => setPop(null)} />}
    </View>
  );
}

/** The toast (overlays-components.css .toast with look.css): the run colour, ink type, fading in and out over 0.2 s. */
function Toast({ text, icon, palette: p, bottom, onDone }: { text: string; icon: string | null; palette: Palette; bottom: number; onDone: () => void }) {
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
        {/* Today's toast is one line that may run past the screen's edges; here a long one takes a second line, so its words are read whole. */}
        {icon !== null && <SvgXml xml={asyIcon(icon, 13).replace(/ style="[^"]*"/, '')} color="#0a0a0a" width={13} height={13} />}
        <Text numberOfLines={2} style={[styles.toastText, icon !== null && styles.toastWords]}>{(icon !== null ? ' ' : '') + text}</Text>
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
  // The label's line is WebKit's 16, iOS's own 14.3 and 1.7 under it (Programs.tsx has the measure): the bar was 1.7 short.
  tabLabel: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', paddingBottom: 1.7 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4, maxWidth: '92%' },
  toastWords: { flexShrink: 1 },
  toastText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', color: '#0a0a0a', textAlign: 'center' },
});
