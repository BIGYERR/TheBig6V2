// This Week in the Expo app (MIGRATION.md phase 2, session 4), read only. The screen is today's (D276 P-WEEKSCREEN,
// docs/decisions/this-week.md): the week titles in a strip of their own, 240 apart, the launch's glide to the title
// in view (D279); the race row or the Program start box, and the phase pill; the day strip, Sunday first; the picked
// day's run and lift cards (D272, D278) with their Skip pills as stored (D284); the rest card, the tip, the Wildcard
// tag and the tiles. What it shows comes from week-screen.ts (today's own model over the stored state); the sizes,
// weights, gaps and colours are today's computed styles, read off the Angular screen at 402 wide.
//
// Nothing here writes, and nothing opens yet: a tap on a week title or on a day works (they change what is shown,
// not what is stored). Every other control is drawn as today's and does nothing until its own screen exists: the
// cards' buttons (the recorder, the deck, the hand log), the Skip pills, Reopen, the rest card's links, Hurt?, the
// race date and the start date, Random Workout and Traveling?.
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StateStore } from '@ia/core/engine/state-store.ts';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { Bag, Calendar, Check, CoreIcon, Cross, Die, Dumbbell, Fade, Flag, Glow, Play, RecDot, Runner, WildcardMark } from './marks';
import { BLANK, drawWeek, launchTitle, liveProgram, pillParts, tokenOf } from './week-screen';
import { type StripClock, type StripEl, StripPlacer } from './week-strip';
import { type Column, type DayCard, type DaysView, TITLE_W, type WeekView } from './week-view-model';

/** The window's frames and timers, for the strip's placer (week-view.ts CLOCK). */
const CLOCK: StripClock = {
  frame: (fn) => requestAnimationFrame(fn),
  cancelFrame: (id) => cancelAnimationFrame(id),
  after: (ms, fn) => setTimeout(fn, ms) as unknown as number,
  cancelAfter: (id) => clearTimeout(id),
  now: () => performance.now(),
};

/** The strip's right inset, as the web's (week-view.css .tw-strip). */
const STRIP_PAD = 150;
/** Room under the last card for the floating tab bar (look.css .screen.with-tabbar). */
const TAB_ROOM = 96;

type Tint = keyof Pick<Palette, 'run' | 'bike' | 'swim' | 'lift' | 'signal' | 'dim'>;

export function ThisWeek({ palette: p, store, tick }: { palette: Palette; store: StateStore; tick: number }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // ── What is shown: the program as stored, the title in view, the day picked in each title ──
  const prog = useMemo(() => liveProgram(store), [store, tick]);
  const [shownPick, setShown] = useState<number | null>(null);
  const picks = useRef(new Map<number, number>());
  const [, redraw] = useState(0);
  const progId = prog ? prog.id : null;
  const lastProg = useRef<string | null>(null);
  const placed = useRef(false);
  if (lastProg.current !== progId) {
    // Another program (a backup loaded): the launch's own title and picks again, and the strip placed anew.
    lastProg.current = progId;
    picks.current.clear();
    placed.current = false;
    if (shownPick !== null) setShown(null);
  }
  // The title in view is the launch's own until one is picked; the day picked in each title is kept under its number.
  // Record run is offered, as on today's iOS app (D272 item 6): the recorder is this app's to grow (phase 4).
  const now = new Date();
  const shownNow = prog ? (shownPick === null ? launchTitle(prog, now) : shownPick) : 1;
  const screen = prog ? drawWeek(store, prog, now, { shown: shownNow, picked: picks.current.get(shownNow) ?? null }, true) : null;
  const shown = screen ? screen.shown : 1;
  const view: WeekView = screen ? screen.view : BLANK;

  // ── The week titles: the strip, its launch glide (D279) and where it settles ──
  const strip = useRef<ComponentRef<typeof ScrollView>>(null);
  const left = useRef(0);
  const box = useRef({ w: 0, content: 0 });
  const [lit, setLit] = useState<number | null>(null);
  const calm = useRef(false);
  const placer = useRef<StripPlacer | null>(null);
  if (!placer.current) placer.current = new StripPlacer(CLOCK, (n) => setLit(n));
  const el = useRef<StripEl | null>(null);
  if (!el.current) {
    el.current = {
      get clientWidth() { return box.current.w; },
      get scrollWidth() { return box.current.content; },
      get scrollLeft() { return left.current; },
      set scrollLeft(x: number) {
        const end = Math.max(0, box.current.content - box.current.w);
        left.current = Math.min(end, Math.max(0, x));
        strip.current?.scrollTo({ x: left.current, animated: false });
      },
      // The web lifts the strip's scroll snap while it glides. Here the glide moves the strip itself, and the snap
      // only acts on a finger's swipe, so there is nothing to lift.
      style: { scrollSnapType: '' },
    };
  }
  // The strip is placed once per program, as soon as it has a width, its titles and the phone's motion setting.
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const hasProg = useRef(false);
  hasProg.current = !!screen;
  const motionKnown = useRef(false);
  const place = useCallback(() => {
    if (placed.current || !motionKnown.current || !hasProg.current || box.current.w <= 0 || box.current.content <= box.current.w) return;
    placed.current = true;
    placer.current!.place(el.current!, shownRef.current, calm.current);
  }, []);
  useEffect(() => {
    let live = true;
    const known = (on: boolean): void => { if (live) { calm.current = on; motionKnown.current = true; place(); } };
    AccessibilityInfo.isReduceMotionEnabled().then(known, () => known(false));
    return () => { live = false; placer.current?.cancel(); };
  }, [place]);
  useEffect(() => { place(); }, [place, progId]);

  const titleCount = view.titles.length;
  const stripEnd = Math.max(0, titleCount * TITLE_W + STRIP_PAD - width);
  const snaps = useMemo(() => Array.from({ length: titleCount }, (_, i) => Math.min(i * TITLE_W, stripEnd)), [titleCount, stripEnd]);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toTitle = useCallback((n: number, scroll: boolean) => {
    if (!screen) return;
    const t = Math.min(Math.max(1, n), screen.totalWeeks + 1);
    if (scroll) {
      const x = Math.min(stripEnd, (t - 1) * TITLE_W);
      left.current = x;
      strip.current?.scrollTo({ x, animated: !calm.current });
    }
    if (t !== shown) setShown(t);
  }, [screen, shown, stripEnd]);
  /** Where the strip settles is the week: round(left / 240) + 1, once the scroll has stopped (week-view.ts settle). */
  const scrolled = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (placer.current!.busy) return;
    left.current = e.nativeEvent.contentOffset.x;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      const n = Math.round(left.current / TITLE_W) + 1;
      if (n !== shown) toTitle(n, false);
    }, 120);
  }, [shown, toTitle]);
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);
  const isOn = (t: { n: number; active: boolean }): boolean => (lit === null ? t.active : lit === t.n);

  const pickDay = (col: number): void => {
    picks.current.set(shown, col);
    redraw((n) => n + 1);
  };

  // ── The draw ──
  const [headH, setHeadH] = useState(0);
  const [stripH, setStripH] = useState(0);
  const pill = pillParts(view.pill.html);
  const pillInk = view.pill.cls.includes('recovery');
  const s = styles;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ flexGrow: 1, paddingBottom: TAB_ROOM + insets.bottom }} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
      <View testID="week-header" onLayout={(e: LayoutChangeEvent) => setHeadH(e.nativeEvent.layout.height)} style={{ backgroundColor: p.bg, overflow: 'hidden' }}>
        <Glow width={width} height={headH} top={0} rgb={p.signalRgb} alpha={view.injuryWeek ? 0 : p.glowAlpha} />
        {view.injuryWeek && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.redRgb + ',0.07)', borderTopWidth: 3, borderTopColor: p.red }]} />}
        <View style={{ paddingTop: insets.top, paddingBottom: 6 }}>
        <Text testID="week-overline" numberOfLines={1} style={[s.over, { color: p.muted }]}>{view.overline}</Text>
        <View style={s.titles} onLayout={(e: LayoutChangeEvent) => setStripH(e.nativeEvent.layout.height)}>
          <ScrollView
            ref={strip}
            testID="week-strip"
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityLabel="Choose a week"
            decelerationRate="fast"
            snapToOffsets={snaps}
            scrollEventThrottle={16}
            onScroll={scrolled}
            onTouchStart={() => placer.current!.stop()}
            onLayout={(e: LayoutChangeEvent) => { box.current.w = e.nativeEvent.layout.width; place(); }}
            onContentSizeChange={(w: number) => { box.current.content = w; place(); }}
            contentContainerStyle={{ paddingRight: STRIP_PAD }}
          >
            {view.titles.map((t) => (
              <Pressable key={t.n} testID={'week-title-' + t.n} accessibilityRole="button" accessibilityState={{ selected: t.active }} onPress={() => toTitle(t.n, true)} style={s.title}>
                <Text numberOfLines={1} style={[s.titleText, { color: isOn(t) ? p.text : 'rgba(' + p.inkRgb + ',0.11)' }]}>{t.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Fade width={STRIP_PAD} height={stripH} color={p.bg} />
          <View testID="week-hurt" accessibilityRole="button" accessibilityLabel="Report or manage an injury" accessibilityState={{ disabled: true }} style={[s.hurt, { top: Math.max(0, (stripH - 40) / 2), backgroundColor: p.bg, borderColor: view.hurt.injured ? p.red : p.border2 }]}>
            <Text style={[s.hurtText, { color: view.hurt.injured ? p.red : p.text }]}>{view.hurt.label}</Text>
          </View>
        </View>
        </View>
      </View>

      {/* The days take what height is left, so Random Workout and Traveling? sit at the screen's foot on a short day. */}
      <View style={{ flexGrow: 1 }}>
        <Glow width={width} height={Math.max(0, 200 - headH)} top={headH} rgb={p.signalRgb} alpha={p.glowAlpha} />
        <View style={[s.row, view.injuryWeek && { backgroundColor: 'rgba(' + p.redRgb + ',0.07)' }]}>
          {view.row.kind === 'race' ? (
            <View testID="week-race" accessibilityLabel="Race date" style={s.race}>
              <Flag color={p.text} />
              <View style={s.raceStack}>
                <Text numberOfLines={1} style={[s.raceBig, { color: p.text }]}>{view.row.big}</Text>
                <Text numberOfLines={1} style={[s.raceSmall, { color: p.muted }]}>{view.row.small}</Text>
              </View>
            </View>
          ) : (
            <View testID="week-start" accessibilityLabel="Program start date" style={s.start}>
              <Calendar color={p.accent} />
              <View style={s.startStack}>
                <Text style={[s.startLbl, { color: p.muted }]}>Program Start</Text>
                <Text numberOfLines={1} style={[s.startTxt, { color: view.row.shown ? p.text : p.muted, fontWeight: view.row.shown ? '700' : '500' }]}>{view.row.shown || 'Set date'}</Text>
              </View>
            </View>
          )}
          {pill.text !== '' && (
            <View testID="week-pill" style={[s.pill, { borderColor: p.signal }, pillInk && { backgroundColor: p.accent }]}>
              {pill.icon && <CoreIcon xml={pill.icon} color={p.signal} />}
              <Text numberOfLines={1} style={[s.pillText, { color: p.signal }]}>{pill.text}</Text>
            </View>
          )}
        </View>

        <View style={s.days}>
          {view.days && <Days d={view.days} p={p} onPick={pickDay} />}
        </View>

        <View style={s.settings}>
          <View testID="week-random" accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.action, { borderColor: p.border2 }]}>
            <Die color={p.signal} />
            <Text style={[s.actionText, { color: p.text }]}>Random Workout</Text>
          </View>
          <View testID="week-travel" accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.action, { borderColor: p.border2, justifyContent: 'center' }]}>
            <Bag color={p.text} />
            <Text style={[s.actionText, { color: p.text }]}>Traveling?</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Days({ d, p, onPick }: { d: DaysView; p: Palette; onPick: (col: number) => void }) {
  const s = styles;
  const first = d.cards[0];
  return (
    <>
      <View testID="week-days" accessibilityLabel="Pick a day" style={[s.week, { backgroundColor: p.surface }]}>
        {d.strip.map((c, i) => <Col key={i} c={c} i={i} p={p} onPick={onPick} />)}
      </View>
      {d.cards.map((k) => <Card key={k.kind} k={k} p={p} />)}
      {d.rest && (
        <View testID="week-card-rest" style={[s.card, s.cardFirst, { backgroundColor: p.surface }]}>
          <View style={s.head}><Text numberOfLines={1} style={[s.label, { color: p.muted }]}>{d.rest.when}</Text></View>
          <Text style={[s.name, { color: p.text }]}>Rest day</Text>
          <Text style={[s.blurb, { color: p.muted }]}>Recovery is where the work sets in. Move easy, refuel, sleep.</Text>
          {d.rest.lines.map((l, i) => <Text key={i} style={[s.restLogged, { color: p.run }]}>{l}</Text>)}
          <View style={s.links}>
            {d.rest.anyway && <Text accessibilityRole="button" style={[s.link, { color: p.muted, textDecorationColor: p.border2 }]}>Training anyway?</Text>}
            <Text accessibilityRole="button" style={[s.link, { color: p.muted, textDecorationColor: p.border2 }]}>{d.rest.logLabel}</Text>
          </View>
        </View>
      )}
      {!first && !d.rest && (
        <View style={[s.card, s.cardFirst, { backgroundColor: p.surface }]}>
          <Text style={[s.name, { color: p.text }]}>No sessions</Text>
          <Text style={[s.blurb, { color: p.muted }]}>This week has no scheduled training.</Text>
        </View>
      )}
      {d.tip && (
        <View testID="week-tip" style={[s.tip, { backgroundColor: p.surface2, borderLeftColor: p.accent }]}>
          <Text style={[s.tipLbl, { color: p.accent }]}>{d.tip.label}</Text>
          <Text style={[s.tipTxt, { color: p.text }]}>{d.tip.text}</Text>
          <Text style={[s.tipSrc, { color: p.muted }]}>{'— ' + d.tip.src}</Text>
        </View>
      )}
      {d.wildcard !== null && (
        <View testID="week-wildcard" style={[s.wcTag, { backgroundColor: p.surface, borderLeftColor: p.signal }]}>
          <WildcardMark color={p.signal} size={16} />
          <View style={{ flexShrink: 1 }}>
            <Text style={[s.wcLbl, { color: p.signal }]}>Wildcard done</Text>
            <Text style={[s.wcSub, { color: p.muted }]}>{d.wildcard}</Text>
          </View>
        </View>
      )}
      <View testID="week-stats" style={[s.stats, { backgroundColor: p.surface }]}>
        <Text style={[s.statsTitle, { color: p.text }]}>This week</Text>
        <View style={s.stat}>
          <Text style={[s.statLbl, { color: p.muted }]}>Done</Text>
          <Text style={[s.statNum, { color: p.text }]}>{d.stats.done}<Text style={[s.statDen, { color: p.dim }]}>{'/' + d.stats.of}</Text></Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statLbl, { color: p.muted }]}>Miles</Text>
          <Text style={[s.statNum, { color: p.run }]}>{d.stats.miles}</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statLbl, { color: p.muted }]}>Day streak</Text>
          <Text style={[s.statNum, { color: p.accent }]}>{d.stats.streak}</Text>
        </View>
      </View>
    </>
  );
}

function Col({ c, i, p, onPick }: { c: Column; i: number; p: Palette; onPick: (col: number) => void }) {
  const s = styles;
  if (c.empty) {
    return (
      <View style={s.col}>
        <Text style={[s.letter, { color: p.muted }]}>{c.letter}</Text>
        <View style={s.circle}><Text style={[s.num, { color: p.muted, opacity: 0.45 }]}>{c.num}</Text></View>
        <View style={s.wordBox} />
      </View>
    );
  }
  const numColor = c.filled ? p.text : p.muted;
  return (
    <Pressable testID={'week-day-' + i} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{ selected: c.picked }} onPress={() => onPick(i)} style={s.col}>
      <Text style={[s.letter, { color: c.today ? p.signal : c.picked ? p.text : p.muted }]}>{c.letter}</Text>
      <View style={[s.circle, c.filled && { backgroundColor: p.surface2 }, c.picked && { borderColor: p.text }]}>
        {c.mark === 'check' ? <Check color={p.green} />
          : c.mark === 'wild' ? <WildcardMark color={p.signal} />
            : <Text style={[s.num, { color: numColor }]}>{c.mark === 'skip' ? '✕' : c.num}</Text>}
      </View>
      <View style={s.wordBox}><Text numberOfLines={1} style={[s.word, { color: p[tokenOf(c.wordColor) as Tint] ?? p.dim }]}>{c.word}</Text></View>
    </Pressable>
  );
}

function Card({ k, p }: { k: DayCard; p: Palette }) {
  const s = styles;
  const off = !!(k.skip && k.skip.on);
  const bt = k.button;
  const btColor = bt ? (bt.sunk ? p.muted : bt.glow ? p.onSignal : p.text) : p.text;
  return (
    <View testID={'week-card-' + k.kind} style={[s.card, k.first ? s.cardFirst : s.cardSecond, { backgroundColor: off ? p.cardOff : p.surface }]}>
      {k.skip && (
        <View
          testID={'week-skip-' + k.kind}
          accessibilityRole="button"
          accessibilityLabel={k.skip.on ? 'Skipped. Tap to bring it back' : k.skip.label}
          accessibilityState={{ selected: k.skip.on, disabled: true }}
          style={[s.skip, { top: k.first ? 20 : 18, borderColor: k.skip.on ? p.text : p.border2, backgroundColor: k.skip.on ? p.text : p.surface }]}
        >
          {k.skip.on && <Cross color={p.bg} />}
          <Text style={[s.skipText, { color: k.skip.on ? p.bg : p.muted }]}>{k.skip.on ? 'Skipped' : k.skip.label}</Text>
        </View>
      )}
      <View style={[{ gap: k.first ? 10 : 8 }, off && { opacity: 0.5 }]}>
        <View style={[s.head, k.skip && s.headSkip]}>
          {!k.first && (k.kind === 'lift' ? <Dumbbell color={p.signal} broken={off} /> : <Runner color={p.signal} />)}
          <Text numberOfLines={1} style={[s.label, { color: p.muted }]}>{k.label}</Text>
        </View>
        <Text style={[k.first ? s.name : s.nameSecond, { color: p.text }]}>{k.title}</Text>
        {k.meta !== '' && <Text style={[s.meta, { color: p.text }]}>{k.meta}</Text>}
        {k.blurb !== '' && <Text numberOfLines={k.first ? undefined : 1} style={[s.blurb, { color: p.muted }]}>{k.blurb}</Text>}
        {k.done && (
          <View style={[s.done, { backgroundColor: p.bg }]}>
            <Check color={p.green} size={20} />
            <View style={s.doneTxt}>
              <Text numberOfLines={1} style={[s.doneTitle, { color: p.text }]}>{k.done.title}</Text>
              <Text numberOfLines={1} style={[s.doneLine, { color: p.muted }]}>{k.done.line}</Text>
            </View>
            <Text accessibilityRole="button" style={[s.reopen, { color: p.signal }]}>Reopen</Text>
          </View>
        )}
        {bt && (
          <View
            testID={'week-button-' + k.kind}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            style={[
              s.btn, { borderColor: p.border2 },
              bt.glow && [s.btnGlow, { backgroundColor: p.signal, boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.35)' }],
              bt.sunk && { backgroundColor: p.surface2, borderColor: 'transparent', transform: [{ translateY: 1 }, { scale: 0.985 }], boxShadow: 'inset 0 2px 6px rgba(0,0,0,' + p.sinkAlpha + ')' },
            ]}
          >
            {bt.act === 'record' ? <RecDot color={btColor} /> : bt.act === 'deck' ? <Play color={btColor} /> : null}
            <Text style={[bt.glow ? s.btnGlowText : s.btnText, { color: btColor }]}>{bt.text}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Weights: today's CSS asks Helvetica Neue for 600 and 800, which it does not have, and WebKit draws both with its Bold.
// Asked for 800 here, iOS answers with Condensed Black. So every 600 and 800 of today's is 700 here, and 500 stays 500.
const styles = StyleSheet.create({
  // The header: the program's name, the week titles, Hurt?
  over: { paddingHorizontal: 20, fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', letterSpacing: 0.78, textTransform: 'uppercase', lineHeight: 16 },
  titles: { marginTop: 4 },
  title: { width: TITLE_W, paddingVertical: 4, paddingLeft: 20 },
  titleText: { fontFamily: DISPLAY, fontSize: 56, fontWeight: '700', letterSpacing: -1.68, lineHeight: 56 },
  hurt: { position: 'absolute', right: 20, height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center' },
  hurtText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },

  // The race row, or the Program start box, and the phase pill
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 6 },
  race: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  raceStack: { gap: 1, flexShrink: 1 },
  raceBig: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  raceSmall: { fontFamily: TEXT, fontSize: 13, lineHeight: 16 },
  start: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  startStack: { gap: 2 },
  startLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '500' },
  startTxt: { fontFamily: TEXT, fontSize: 17 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: 999 },
  pillText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },

  // The day strip
  days: { flexGrow: 1, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  week: { flexDirection: 'row', gap: 2, paddingTop: 16, paddingHorizontal: 8, paddingBottom: 14, borderRadius: 24 },
  col: { flex: 1, alignItems: 'center', gap: 8, minHeight: 44 },
  letter: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', lineHeight: 16 },
  circle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  wordBox: { height: 11, justifyContent: 'center' },
  word: { fontFamily: DISPLAY, fontSize: 9, fontWeight: '700', letterSpacing: 0.36, lineHeight: 11 },

  // The cards
  card: { borderRadius: 24 },
  cardFirst: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 18, gap: 10 },
  cardSecond: { padding: 18, paddingHorizontal: 20, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  headSkip: { minHeight: 32, paddingRight: 118 },
  label: { flex: 1, fontFamily: TEXT, fontSize: 15, fontWeight: '700' },
  name: { fontFamily: DISPLAY, fontSize: 34, fontWeight: '700', letterSpacing: -0.68, lineHeight: 34.68 },
  nameSecond: { fontFamily: DISPLAY, fontSize: 26, fontWeight: '700', letterSpacing: -0.52, lineHeight: 27.3 },
  meta: { fontFamily: TEXT, fontSize: 15, fontWeight: '700' },
  blurb: { fontFamily: TEXT, fontSize: 14, lineHeight: 19.6 },
  btn: { marginTop: 8, height: 48, borderRadius: 24, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnGlow: { height: 56, borderRadius: 28, borderWidth: 0 },
  btnText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700' },
  btnGlowText: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  done: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingRight: 8, paddingLeft: 14, borderRadius: 14 },
  doneTxt: { flex: 1, gap: 1 },
  doneTitle: { fontFamily: TEXT, fontSize: 14, fontWeight: '700' },
  doneLine: { fontFamily: TEXT, fontSize: 13, fontVariant: ['tabular-nums'] },
  reopen: { paddingVertical: 10, paddingHorizontal: 6, fontFamily: TEXT, fontSize: 15, fontWeight: '700' },
  restLogged: { fontFamily: TEXT, fontSize: 12, fontWeight: '500', marginTop: 8 },
  links: { flexDirection: 'row', gap: 26, marginTop: -2 },
  link: { paddingVertical: 10, fontFamily: TEXT, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },

  // The Skip pill (D284)
  skip: { position: 'absolute', right: 20, zIndex: 1, height: 32, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  skipText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },

  // The tip, the Wildcard tag, the tiles
  tip: { borderLeftWidth: 3, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 13, paddingHorizontal: 15 },
  tipLbl: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  tipTxt: { fontFamily: TEXT, fontSize: 14, lineHeight: 21.7 },
  tipSrc: { fontFamily: TEXT, fontSize: 10, fontStyle: 'italic', marginTop: 7 },
  wcTag: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: 3, borderRadius: 16 },
  wcLbl: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  wcSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  stats: { flexDirection: 'row', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderRadius: 24 },
  statsTitle: { position: 'absolute', left: 20, top: 18, fontFamily: DISPLAY, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  stat: { flex: 1 },
  statLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '500', lineHeight: 16, marginBottom: 4 },
  statNum: { fontFamily: DISPLAY, fontSize: 30, fontWeight: '700', letterSpacing: -1.2, lineHeight: 30 },
  statDen: { fontSize: 17 },

  // Random Workout and Traveling?
  settings: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 24 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 14 },
  actionText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
});
