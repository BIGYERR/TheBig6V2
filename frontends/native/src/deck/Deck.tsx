// The swipe deck in the Expo app (MIGRATION.md phase 3, the first screen; D275 P-DECK and D283 P-DECKFIT,
// docs/decisions/swipe-deck.md), drawn as today's deck draws it (frontends/app/src/app/screens/deck/deck.ts and
// deck.css, with the session sheet's cards from day-detail/session-sections.ts in deck mode): a day's lift work as a
// deck of cards, one card at a time in a fan, a sideways swipe to move on, the next card rising drawn in full under the
// finger (call 3), the dots, the session map, the RPE bubble (call 7), and each move's sets opening in place while
// the others fold (D283).
//
// READ ONLY (D287, until the session D289 names). Everything that writes is drawn with today's words and does
// nothing: Log, the steppers and the fields, the reuse pills, skip, Skip all, swap, put it back, remove, Done, next
// one, Mark the day done, the effort slider and the notes. Moving through the deck writes nothing, so it works: the
// swipe, the dots, the map's tiles, and Next one on a card that is already logged or skipped.
//
// Not here yet, with the session that builds logging: the opening out of the card (call 16), the done motion (call
// 10), the punch (call 5) and the up and down pager (call 1). The deck opens and closes as today's does under Reduce
// Motion: at once.
import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline, Rect, SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';

import type { ExCard, ExView, SetRow } from '../day-detail/session-sections-model';
import { DISPLAY, type Palette, TEXT } from '../theme';
import {
  CALL_IT_WORDS, type DeckCard, PIP_THRESHOLD, ctaText, numeral, openAfterSetsTap, restOpen, rpeBubble, rxLine, stateOf,
} from './deck-model';
import { type DeckView, toneColor } from './deck-screen';

/** A card's sizes (D283, Mario's "Auto"): Roomy on a screen 700 points tall or more, Tight below it. */
interface Sizes { num: number; title: number; meta: number; name: number; line: number; cue: number; ctl: number; ic: number; mic: number; pad: number; item: number; row: number; load: number }
const ROOMY: Sizes = { num: 30, title: 24, meta: 14, name: 17, line: 15, cue: 13, ctl: 44, ic: 36, mic: 32, pad: 18, item: 12, row: 8, load: 76 };
const TIGHT: Sizes = { num: 22, title: 20, meta: 13, name: 15, line: 13, cue: 12, ctl: 34, ic: 30, mic: 26, pad: 12, item: 6, row: 6, load: 66 };

const FAN = 3;
const SWIPE = 80;
const PEEK = 140;

/** Type and tints on a card: white at an alpha (rgba(var(--on-band-rgb), a)). */
const on = (a: number): string => 'rgba(255,255,255,' + a + ')';
/** Markup a name may carry, dropped: a card's words are plain here. */
const plain = (s: string): string => String(s).replace(/<[^>]*>/g, '').trim();

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}
function Tick({ size, color, width = 2.5 }: { size: number; color: string; width?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12" /></Svg>;
}
function Undo({ size, color }: { size: number; color: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 14L4 9l5-5" /><Path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>;
}

export function Deck({ palette: p, view, onClose }: { palette: Palette; view: DeckView; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const z = height >= 700 ? ROOMY : TIGHT;
  const cards = view.cards;
  const n = cards.length;

  const [i, setI] = useState(view.first);
  const [sheet, setSheet] = useState<'map' | null>(null);
  const [bubble, setBubble] = useState<number | null>(null);
  /** Per move, whether its sets are open; per card, the move kept whole while the others fold (D283); per move, its pip. */
  const [setsOpen, setSetsOpen] = useState<Record<string, boolean>>({});
  const [openMove, setOpenMove] = useState<Record<string, string | null>>({});
  const [pips, setPips] = useState<Record<string, number>>({});
  /** Which way the finger is going: the next card rises on a pull to the left, the one before on a pull to the right. */
  const [dir, setDir] = useState(1);
  const dirNow = useRef(1);
  const dx = useRef(new Animated.Value(0)).current;
  const at = useRef(i);
  at.current = i;

  const go = (k: number): void => {
    if (!n) return;
    dx.setValue(0);
    setI(((k % n) + n) % n);
  };
  const pan = useMemo(() => PanResponder.create({
    // A sideways drag moves the deck; an up and down one is the card's own scroll (deck.css touch-action: pan-y).
    onMoveShouldSetPanResponderCapture: (_e, g) => n > 1 && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_e, g) => {
      const d = g.dx < 0 ? 1 : -1;
      if (d !== dirNow.current) { dirNow.current = d; setDir(d); }
      dx.setValue(g.dx);
    },
    onPanResponderRelease: (_e, g) => {
      if (g.dx < -SWIPE) go(at.current + 1);
      else if (g.dx > SWIPE) go(at.current - 1);
      else Animated.timing(dx, { toValue: 0, duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1), useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => dx.setValue(0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [n]);

  // ── Sets open in place, the other moves fold (D283; deck.ts foldOf, setsTapped, foldTapped) ──
  const foldOf = (c: DeckCard): string | null => openMove[c.key] || restOpen(c);
  const setsTapped = (c: DeckCard, exKey: string): void => {
    const open = !setsOpen[exKey];
    setSetsOpen((m) => ({ ...m, [exKey]: open }));
    setOpenMove((m) => ({ ...m, [c.key]: openAfterSetsTap(c, exKey, open) }));
  };
  const foldTapped = (c: DeckCard, exKey: string): void => {
    const was = foldOf(c);
    if (was && setsOpen[was]) setSetsOpen((m) => ({ ...m, [was]: false, [exKey]: true }));
    setOpenMove((m) => ({ ...m, [c.key]: exKey }));
  };

  const top = cards[i];
  const isLogged = (c: DeckCard): boolean => !c.skipped && c.logged && (c.kind !== 'finish' || view.dayDone);
  const states = cards.map((c, k) => stateOf(c, k, i, c.kind === 'finish' && view.dayDone));
  const cta = top ? ctaText(top, false, view.dayDone) : '';
  const quiet = !!top && (top.kind === 'finish' ? view.dayDone : top.skipped || top.logged);
  // The big button moves on where moving on is all it does; where it would log or mark the day, it waits for logging.
  const ctaMoves = !!top && top.kind !== 'finish' && (top.skipped || top.logged);
  const ctaCloses = !!top && top.kind === 'finish' && view.dayDone;

  // ── Where each card sits (deck.ts cardStyle and faceStyle, sideways) ──
  const q = dx.interpolate({ inputRange: [-PEEK, 0, PEEK], outputRange: [1, 0, 1], extrapolate: 'clamp' });
  const peek = n > 1 ? (i + dir + n) % n : -1;
  const cardStyle = (k: number): object => {
    const pos = (k - i + n) % n;
    if (pos === 0) {
      return { zIndex: 20, transform: [{ translateX: dx }, { rotate: dx.interpolate({ inputRange: [-260, 260], outputRange: ['-10deg', '10deg'] }) }] };
    }
    if (k === peek) {
      const f = dir > 0 ? { x: 15, y: -7, s: 0.965, r: '1.6deg' } : { x: 0, y: 0, s: 0.92, r: '0deg' };
      const l = (a: number, b: number) => q.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
      return { zIndex: 15, transform: [{ translateX: l(f.x, 0) }, { translateY: l(f.y, 0) }, { scale: l(f.s, 1) }, { rotate: q.interpolate({ inputRange: [0, 1], outputRange: [f.r, '0deg'] }) }] };
    }
    if (pos >= 1 && pos <= FAN) {
      return { zIndex: 10 - pos, transform: [{ translateX: pos * 15 }, { translateY: pos * -7 }, { scale: 1 - pos * 0.035 }, { rotate: pos * 1.6 + 'deg' }] };
    }
    return { zIndex: 1, opacity: 0 };
  };
  const faceOpacity = (k: number): number | Animated.AnimatedInterpolation<number> =>
    (k === i ? 1 : k === peek ? q.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) : 0);

  const s = styles;
  return (
    <View testID="deck" accessibilityViewIsModal style={[StyleSheet.absoluteFill, { backgroundColor: p.bg, paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(14, insets.bottom) }]}>
      <View style={s.head}>
        <Pressable testID="deck-back" accessibilityRole="button" accessibilityLabel="Back to This Week" onPress={onClose} style={s.round44}>
          <Icon name="chevronLeft" size={22} color={p.text} />
        </Pressable>
        <Text testID="deck-title" numberOfLines={1} style={[s.title, { color: p.text }]}>{view.title}</Text>
        <Pressable testID="deck-map" accessibilityRole="button" accessibilityLabel="See the whole session" onPress={() => setSheet('map')} style={s.round44}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={p.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Rect x={4} y={4} width={6} height={6} rx={1.5} /><Rect x={14} y={4} width={6} height={6} rx={1.5} /><Rect x={4} y={14} width={6} height={6} rx={1.5} /><Rect x={14} y={14} width={6} height={6} rx={1.5} />
          </Svg>
        </Pressable>
      </View>

      <View testID="deck-stage" style={s.stage} {...pan.panHandlers}>
        {cards.map((c, k) => (
          <Animated.View
            key={c.key}
            testID={'deck-card-' + k}
            pointerEvents={k === i ? 'auto' : 'none'}
            accessibilityElementsHidden={k !== i}
            importantForAccessibility={k === i ? 'auto' : 'no-hide-descendants'}
            style={[s.card, { backgroundColor: toneColor(p, c.tone), transformOrigin: 'left bottom' },
              isLogged(c) && { boxShadow: '0 0 0 3px ' + p.signal + ', 0 14px 38px rgba(' + p.signalRgb + ',0.40), 0 8px 24px rgba(0,0,0,0.14)' },
              c.skipped && k === i && { opacity: 0.72 }, cardStyle(k)]}
          >
            <Animated.View style={[s.face, { opacity: faceOpacity(k) }]}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: z.pad, paddingBottom: z.pad - 2 }} showsVerticalScrollIndicator={false}>
                {isLogged(c) && <View pointerEvents="none" style={s.bigcheck}><Tick size={240} color={on(1)} /></View>}
                <View style={[s.top, { minHeight: z.ic }]}>
                  <View style={s.numRow}>
                    <Text style={[s.num, { fontSize: z.num, color: p.onBand }]}>{numeral(k, n).num}</Text>
                    <Text style={[s.numOf, { color: on(0.62) }]}>{numeral(k, n).of}</Text>
                    {isLogged(c) && <View style={[s.doneChip, { backgroundColor: on(0.2) }]}><Tick size={12} color={p.onBand} width={3.5} /><Text style={[s.doneText, { color: p.onBand }]}>Logged</Text></View>}
                  </View>
                  <View style={s.acts}>
                    {c.swap && <View accessibilityRole="button" accessibilityLabel="Swap this exercise" accessibilityState={{ disabled: true }} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: on(0.16) }]}><Icon name="swap" size={17} color={p.onBand} /></View>}
                    {c.skip && c.kind !== 'lift' && <View accessibilityRole="button" accessibilityLabel="Skip the whole card" accessibilityState={{ disabled: true }} style={[s.act, s.actAll, { height: z.ic, backgroundColor: on(0.16) }]}><Text style={[s.actAllText, { color: p.onBand }]}>Skip all</Text></View>}
                    {c.undo && <View accessibilityRole="button" accessibilityLabel="Put it back" accessibilityState={{ disabled: true }} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: p.onBand }]}><Undo size={18} color={p.band} /></View>}
                    {c.skip && c.kind === 'lift' && <View accessibilityRole="button" accessibilityLabel="Skip this card" accessibilityState={{ disabled: true }} style={[s.act, { width: z.ic, height: z.ic, backgroundColor: on(0.16) }]}><Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={p.onBand} strokeWidth={2.5} strokeLinecap="round"><Line x1={5} y1={12} x2={19} y2={12} /></Svg></View>}
                  </View>
                </View>
                <Text testID={'deck-name-' + k} style={[s.name, { fontSize: z.title, lineHeight: z.title * 1.12, color: p.onBand }, c.skipped && { textDecorationLine: 'line-through', textDecorationColor: on(0.5) }]}>{c.title}</Text>
                <Text testID={'deck-meta-' + k} style={[s.meta, { fontSize: z.meta, lineHeight: z.meta * 1.3, color: on(0.76) }]}>{c.meta}</Text>
                <View style={[s.rule, { backgroundColor: on(0.2) }]} />
                {!!c.cue && !c.skipped && <Text testID={'deck-cue-' + k} style={[s.cue, { fontSize: z.cue, lineHeight: z.cue * 1.35, color: on(0.8) }]}>{c.cue}</Text>}
                {c.swappedFrom && (
                  <View style={[s.from, { backgroundColor: on(0.16) }]}>
                    <Text style={[s.fromB, { color: p.onBand }]}>Swapped in</Text>
                    <Text numberOfLines={1} style={[s.fromText, { color: on(0.78) }]}>{'for ' + c.swappedFrom}</Text>
                    <View accessibilityRole="button" accessibilityLabel="Put it back" accessibilityState={{ disabled: true }} style={[s.fromBtn, { backgroundColor: p.onBand }]}><Undo size={15} color={p.band} /></View>
                  </View>
                )}
                {c.kind === 'finish' ? <CallIt p={p} rpe={view.rpe} notes={view.notes} /> : !c.skipped && (
                  <View>
                    {c.views.flatMap((v) => (v.kind === 'section' ? v.body.items : [])).map((x, xi, all) => (
                      <Move
                        key={xi} x={x} c={c} z={z} p={p} last={xi === all.length - 1}
                        open={x.kind === 'card' && !!setsOpen[x.exKey]}
                        folded={x.kind === 'card' && foldOf(c) !== null && foldOf(c) !== x.exKey}
                        pip={x.kind === 'card' ? pips[x.exKey] ?? 0 : 0}
                        onSets={(key) => setsTapped(c, key)} onFold={(key) => foldTapped(c, key)}
                        onPip={(key, n2) => setPips((m) => ({ ...m, [key]: n2 }))}
                        onRpe={() => setBubble(c.rpe ?? 7)}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>
            </Animated.View>
            {c.skipped && (
              <View pointerEvents="none" style={s.hole}>
                <Svg viewBox="0 0 220 220" width={200} height={200}>
                  <Path d={HOLE} fill="rgba(0,0,0,0.62)" transform="translate(5,7)" /><Path d={HOLE} fill={p.bg} />
                </Svg>
              </View>
            )}
          </Animated.View>
        ))}
      </View>

      <View testID="deck-dots" style={s.dots}>
        {cards.map((c, k) => (
          <Pressable key={c.key} testID={'deck-dot-' + k} accessibilityRole="button" accessibilityLabel={'Card ' + (k + 1) + ', ' + states[k]} hitSlop={8} onPress={() => go(k)}
            style={[s.dot, { backgroundColor: k === i ? p.text : states[k] === 'Logged' ? p.signal : p.border2 }, k === i && { width: 22 }]} />
        ))}
      </View>
      <View style={s.foot}>
        <Pressable
          testID="deck-cta" accessibilityRole="button" accessibilityState={{ disabled: !(ctaMoves || ctaCloses) }} disabled={!(ctaMoves || ctaCloses)}
          onPress={() => (ctaCloses ? onClose() : go(i + 1))}
          style={[s.cta, quiet ? { backgroundColor: p.text } : { backgroundColor: p.signal, boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.42)' }]}
        >
          <Text style={[s.ctaText, { color: quiet ? p.bg : p.onSignal }]}>{cta}</Text>
        </Pressable>
      </View>

      {sheet === 'map' && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable accessibilityLabel="Close" onPress={() => setSheet(null)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.5)' }]} />
          <View testID="deck-sheet" accessibilityLabel="The whole session" style={[s.sheet, { backgroundColor: p.bg, paddingBottom: Math.max(20, insets.bottom) }]}>
            <View style={s.sheetHead}>
              <Text numberOfLines={1} style={[s.sheetTitle, { color: p.text }]}>{view.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSheet(null)} style={[s.x, { backgroundColor: p.surface2 }]}><Text style={{ color: p.text, fontSize: 15 }}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={s.tiles}>
              {cards.map((c, k) => (
                <Pressable key={c.key} testID={'deck-tile-' + k} accessibilityRole="button" onPress={() => { go(k); setSheet(null); }}
                  style={[s.tile, { backgroundColor: toneColor(p, c.skipped ? 'skip' : c.tone) }, k === i && { boxShadow: '0 0 0 2px ' + p.text }, states[k] === 'Logged' && { boxShadow: '0 0 0 2px ' + p.signal }]}>
                  <Text style={[s.tileNum, { color: p.onBand }]}>{String(k + 1).padStart(2, '0')}</Text>
                  <Text style={[s.tileKick, { color: on(0.78) }]}>{c.kicker}</Text>
                  <Text style={[s.tileTitle, { color: p.onBand }]}>{c.title}</Text>
                  <Text style={[s.tileState, { color: on(0.84) }]}>{states[k]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {bubble !== null && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable accessibilityLabel="Close" onPress={() => setBubble(null)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.5)' }]} />
          <View testID="deck-bubble" accessibilityLabel="What RPE means" style={[s.bubble, { backgroundColor: p.surface }]}>
            <Text style={[s.bubbleK, { color: p.text }]}>{'RPE ' + bubble}</Text>
            <Text style={[s.bubbleLine, { color: p.text }]}>{rpeBubble(bubble).line}</Text>
            {rpeBubble(bubble).rows.map((r) => (
              <View key={r.range} style={[s.band, r.on && { backgroundColor: p.signal }]}>
                <Text style={[s.bandR, { color: r.on ? p.onSignal : p.muted }]}>{r.range}</Text>
                <Text style={[s.bandL, { color: r.on ? p.onSignal : p.text }]}>{r.label}</Text>
                <Text style={[s.bandD, { color: r.on ? p.onSignal : p.muted }]}>{r.detail}</Text>
              </View>
            ))}
            <Pressable testID="deck-gotit" accessibilityRole="button" onPress={() => setBubble(null)} style={[s.gotit, { backgroundColor: p.text }]}><Text style={[s.gotitText, { color: p.bg }]}>Got it</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

/** The punched hole of a skipped card (deck.ts, board V). */
const HOLE = 'M110,30 L122,52 L142,42 L140,66 L164,60 L154,82 L182,84 L164,102 L190,114 L166,124 L184,146 L158,144 L166,168 L142,158 L138,186 L118,166 L104,192 L96,164 L72,178 L74,152 L48,158 L60,136 L32,130 L52,112 L28,98 L54,88 L40,64 L66,68 L64,42 L88,54 Z';

/** Call it (call R): the day's effort and its word, the slider and the notes, drawn and not yet taking a touch. */
function CallIt({ p, rpe, notes }: { p: Palette; rpe: number; notes: string }) {
  const s = styles;
  const fill = ((rpe - 1) / 9) * 100;
  return (
    <View testID="deck-callit" style={s.callit}>
      <View style={s.rpeRead}>
        <Text style={[s.rpeN, { color: p.onBand }]}>{rpe}</Text>
        <Text style={[s.rpeW, { color: on(0.84) }]}>{CALL_IT_WORDS[rpe] || ''}</Text>
      </View>
      <View accessibilityRole="adjustable" accessibilityLabel="How hard was the whole session, 1 to 10" accessibilityState={{ disabled: true }} style={s.slider}>
        <View style={[s.track, { backgroundColor: on(0.18) }]} />
        <View style={[s.track, { width: (fill + '%') as `${number}%`, right: undefined, backgroundColor: p.signal }]} />
        <View style={[s.thumb, { left: (fill + '%') as `${number}%`, backgroundColor: p.signal, borderColor: p.onBand }]} />
      </View>
      <Text style={[s.notesLbl, { color: on(0.78) }]}>Notes</Text>
      <View style={[s.notes, { backgroundColor: on(0.1) }]}><Text style={[s.notesText, { color: p.onBand }]}>{notes}</Text></View>
    </View>
  );
}

interface MoveProps {
  x: ExView; c: DeckCard; z: Sizes; p: Palette; last: boolean; open: boolean; folded: boolean; pip: number;
  onSets: (exKey: string) => void; onFold: (exKey: string) => void; onPip: (exKey: string, s: number) => void; onRpe: () => void;
}

/** One move on a card: the session sheet's exercise card in deck mode (session-sections.ts with deck.css over it). */
function Move({ x, c, z, p, last, open, folded, pip, onSets, onFold, onPip, onRpe }: MoveProps) {
  const s = styles;
  if (x.kind === 'skipped') {
    return (
      <View style={s.skipped}>
        <Text style={[s.skippedLbl, { color: on(0.72) }]}>Skipped</Text>
        <Text numberOfLines={1} style={[s.skippedName, { color: on(0.72) }]}>{plain(x.name)}</Text>
        <Text accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.skippedUndo, { color: on(0.72) }]}>Put it back</Text>
      </View>
    );
  }
  const line = rxLine(String(x.rxDetail || x.detail || ''));
  const lift = c.kind === 'lift', cool = c.kind === 'cool';
  const sets = x.log ? x.log.sets : null, load = x.log ? x.log.load : null;
  const edge = [{ paddingVertical: z.item }, !last && !lift && { borderBottomWidth: 1, borderBottomColor: on(0.14) }, (last || lift) && { paddingBottom: 0 }];
  if (folded) {
    return (
      <Pressable testID={'deck-move-' + x.exKey} accessibilityRole="button" accessibilityLabel={'Open ' + plain(x.name)} onPress={() => onFold(x.exKey)} style={[s.foldRow, edge, { paddingVertical: z.item - 2 }]}>
        <Text numberOfLines={1} style={[s.moveName, { flex: 1, fontSize: z.name - 1, color: p.onBand }]}>{plain(x.name)}</Text>
        {sets && <Text style={[s.foldVal, { color: on(0.72) }]}>{sets.head}</Text>}
        {x.logged && <Text style={[s.badge, { color: p.onBand }]}>✓</Text>}
      </Pressable>
    );
  }
  const logBtn = x.log && (
    <View accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.log, { height: z.ctl, backgroundColor: p.onBand }]}><Text style={[s.logText, { color: p.band }]}>Log</Text></View>
  );
  if (cool) {
    return (
      <View testID={'deck-move-' + x.exKey} style={[s.coolRow, edge]}>
        <View style={{ flex: 1 }}>
          <NameRow x={x} z={z} p={p} controls={false} />
          {!!line.dose && <Text style={[s.dose, { fontSize: z.line, lineHeight: z.line * 1.25, color: p.onBand }]}>{line.dose}</Text>}
          {!!line.cue && <Text style={[s.moveCue, { fontSize: z.cue, lineHeight: z.cue * 1.3, color: on(0.76) }]}>{line.cue}</Text>}
        </View>
        {logBtn}
      </View>
    );
  }
  const setLine = sets && (
    <View style={s.setLine}>
      <Pressable testID={'deck-sets-' + x.exKey} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => onSets(x.exKey)} style={s.setHead}>
        <Text style={[s.setVal, { fontSize: z.line, color: p.onBand }]}>{sets.head}</Text>
        {!!line.rpe && <Text style={[s.setRpe, { fontSize: z.line, color: on(0.76) }]}>{'· ' + line.rpe}</Text>}
        {sets.varied && <Text style={[s.vary, { color: p.onBand, borderColor: on(0.35) }]}>Varied</Text>}
        <View style={[s.caret, { backgroundColor: open ? p.onBand : on(0.16) }, open && { transform: [{ rotate: '180deg' }] }]}><Icon name="chevronDown" size={14} color={open ? p.band : p.onBand} /></View>
      </Pressable>
      {lift && c.rpe !== null && !!line.rpe && (
        <Pressable testID="deck-rpeinfo" accessibilityRole="button" accessibilityLabel="What RPE means" hitSlop={10} onPress={onRpe} style={s.rpeInfo}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={on(0.85)} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={12} r={9.5} /><Line x1={12} y1={11} x2={12} y2={16.5} /><Circle cx={12} cy={7.6} r={0.6} fill={on(0.85)} /></Svg>
        </Pressable>
      )}
    </View>
  );
  return (
    <View testID={'deck-move-' + x.exKey} style={edge}>
      {!lift && <NameRow x={x} z={z} p={p} controls />}
      {load ? setLine : (
        <View style={s.lineLog}><View style={{ flex: 1 }}>{setLine}</View>{logBtn}</View>
      )}
      {!lift && !!line.cue && <Text style={[s.moveCue, { fontSize: z.cue, lineHeight: z.cue * 1.3, color: on(0.76) }]}>{line.cue}</Text>}
      {!lift && x.added && <Text style={[s.chip, { color: on(0.76) }]}><Text style={{ color: p.onBand, fontWeight: '700' }}>You added this</Text>{' · not in the plan  '}<Text style={{ color: p.onBand }}>remove</Text></Text>}
      {!lift && x.swappedFrom && <Text style={[s.chip, { color: on(0.76) }]}><Text style={{ color: p.onBand, fontWeight: '700' }}>Swapped in</Text>{' for ' + x.swappedFrom + '  '}<Text style={{ color: p.onBand }}>put it back</Text></Text>}
      {sets && open && <Rows x={x} rows={sets.rows} foot={sets.foot} pip={pip} p={p} onPip={(n2) => onPip(x.exKey, n2)} />}
      {load && (
        <View style={[s.weightRow, { marginTop: z.row }]}>
          {!open && (
            <View style={s.weight}>
              <View style={[s.winput, { width: z.load, height: z.ctl, backgroundColor: on(0.1), borderColor: on(0.26) }]}>
                <Text style={[s.wval, { color: p.onBand }]}>{load.value}</Text><Text style={[s.wunit, { color: on(0.72) }]}>{load.unit}</Text>
              </View>
              {load.reuse && (
                <View accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.reuse, { height: z.ctl - 6, backgroundColor: load.reuse.stale ? 'transparent' : on(0.16) }, load.reuse.stale && { borderWidth: 1, borderStyle: 'dashed', borderColor: on(0.26) }]}>
                  <Text style={[s.reuseIco, { color: p.onBand }]}>↺</Text>
                  <Text numberOfLines={1} style={[s.reuseTxt, { color: p.onBand }]}>{load.reuse.text}<Text style={[s.reuseRec, { color: on(0.76) }]}>{' · ' + load.reuse.rec}</Text></Text>
                </View>
              )}
            </View>
          )}
          <View style={{ flex: 1 }} />
          {logBtn}
        </View>
      )}
      {load && load.warn && <View style={s.warn}><Text style={[s.warnIco, { color: p.onBand }]}>△</Text><Text style={[s.warnTxt, { color: on(0.84) }]}>{load.warn}</Text></View>}
      {load && load.fill && open && (
        <View accessibilityRole="button" accessibilityState={{ disabled: true }} style={[s.fill, { backgroundColor: load.fill.stale ? 'transparent' : on(0.16) }, load.fill.stale && { borderWidth: 1, borderStyle: 'dashed', borderColor: on(0.26) }]}>
          <Text style={[s.reuseIco, { color: p.onBand }]}>↺</Text>
          <Text style={[s.reuseTxt, { color: p.onBand }]}>{load.fill.text}<Text style={[s.reuseRec, { color: on(0.76) }]}>{'  ' + load.fill.rec}</Text></Text>
        </View>
      )}
    </View>
  );
}

/** A move's name, with its swap and its minus (drawn, not yet taking a touch) and its check once logged. */
function NameRow({ x, z, p, controls }: { x: ExCard; z: Sizes; p: Palette; controls: boolean }) {
  const s = styles;
  return (
    <View style={s.nameRow}>
      <Text style={[s.moveName, { flex: 1, fontSize: z.name, lineHeight: z.name * 1.22, color: p.onBand }]}>{plain(x.name)}</Text>
      {controls && x.swap && <View accessibilityRole="button" accessibilityLabel="Swap this exercise" accessibilityState={{ disabled: true }} style={[s.mic, { width: z.mic, height: z.mic, backgroundColor: on(0.14) }]}><Icon name="swap" size={16} color={p.onBand} /></View>}
      {controls && x.skip && <View accessibilityRole="button" accessibilityLabel="Skip this exercise" accessibilityState={{ disabled: true }} style={[s.mic, { width: z.mic, height: z.mic, backgroundColor: on(0.14) }]}><Icon name="minus" size={16} color={p.onBand} /></View>}
      {x.logged && <Text style={[s.badge, { color: p.onBand }]}>✓</Text>}
    </View>
  );
}

/** A move's set rows, open: past four sets one at a time behind the pips (board P), the top set marked, the foot. */
function Rows({ x, rows, foot, pip, p, onPip }: { x: ExCard; rows: SetRow[]; foot: string | null; pip: number; p: Palette; onPip: (s: number) => void }) {
  const s = styles;
  const pipped = rows.length > PIP_THRESHOLD;
  // The page's markTopSet: each set's load, the largest of them, and which rows hold it when the loads differ.
  const loads = rows.map((r) => (r.weight ? parseFloat(r.weight.value) : NaN)).filter((v) => !isNaN(v));
  const max = loads.length ? Math.max(...loads) : 0;
  const vary = loads.length > 1 && loads.some((v) => v !== loads[0]);
  const unit = rows[0] && rows[0].weight ? rows[0].weight.unit : '';
  return (
    <View testID={'deck-rows-' + x.exKey} style={s.rows}>
      {pipped && (
        <View accessibilityLabel="Sets" style={s.pips}>
          {rows.map((r) => (
            <Pressable key={r.s} accessibilityRole="button" accessibilityLabel={'Set ' + (r.s + 1)} accessibilityState={{ selected: r.s === pip }} onPress={() => onPip(r.s)} style={[s.pip, { backgroundColor: r.s === pip ? p.onBand : on(0.16) }]}>
              <Text style={[s.pipText, { color: r.s === pip ? p.band : p.onBand }]}>{r.s + 1}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {rows.filter((r) => !pipped || r.s === pip).map((r, ri, shown) => {
        const isTop = vary && !!r.weight && parseFloat(r.weight.value) === max;
        return (
          <View key={r.s} style={[s.row, ri < shown.length - 1 && { borderBottomWidth: 1, borderBottomColor: on(0.14) }]}>
            <Text style={[s.rowNum, { color: on(0.72) }]}>{r.s + 1}</Text>
            <View style={[s.ctl, { borderColor: on(0.26), backgroundColor: on(0.1) }]}>
              <View style={[s.step, { backgroundColor: on(0.16) }]}><Text style={[s.stepText, { color: p.onBand }]}>−</Text></View>
              <View style={s.val}>
                <Text style={[s.valText, { color: r.value === '' ? on(0.72) : p.onBand }]}>{r.value === '' ? r.placeholder : r.value}</Text>
                {!!r.suffix && <Text style={[s.suf, { color: on(0.72) }]}>{r.suffix}</Text>}
                {!!r.deltaText && <Text style={[s.delta, { color: p.onBand }]}>{r.deltaText}</Text>}
              </View>
              <View style={[s.step, { backgroundColor: on(0.16) }]}><Text style={[s.stepText, { color: p.onBand }]}>+</Text></View>
            </View>
            {r.weight && (
              <View style={[s.wcell, { borderColor: isTop ? p.onBand : on(0.26), backgroundColor: on(0.1) }]}>
                {isTop && <Text style={[s.toppip, { backgroundColor: p.onBand, color: p.band }]}>Top</Text>}
                <Text style={[s.wcellVal, { color: p.onBand }]}>{r.weight.value}</Text><Text style={[s.wcellU, { color: on(0.72) }]}>{r.weight.unit}</Text>
              </View>
            )}
          </View>
        );
      })}
      {foot && (
        <View style={[s.rowFoot, { borderTopColor: on(0.14) }]}>
          <Text style={[s.footLbl, { color: on(0.72) }]}>{vary ? 'Top set' : 'Every set'}</Text>
          <Text style={[s.footVal, { color: p.onBand }]}>{max > 0 ? max + ' ' + unit : '—'}</Text>
        </View>
      )}
    </View>
  );
}

// Weights: every 600 and 800 of today's CSS is 700 here, as on This Week (ThisWeek.tsx): Helvetica Neue has neither.
const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4, paddingRight: 14, paddingBottom: 2, paddingLeft: 10 },
  round44: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', letterSpacing: -0.72, lineHeight: 26.4 },
  stage: { flex: 1, marginTop: 16, marginHorizontal: 20 },
  card: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 28px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)' },
  face: { flex: 1 },
  bigcheck: { position: 'absolute', top: 88, right: -46, opacity: 0.18 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  numRow: { flexDirection: 'row', alignItems: 'baseline' },
  num: { fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -1.2 },
  numOf: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  doneChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999 },
  doneText: { fontFamily: TEXT, fontSize: 12, fontWeight: '700', lineHeight: 12 },
  acts: { flexDirection: 'row', gap: 6 },
  act: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  actAll: { paddingHorizontal: 13 },
  actAllText: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  name: { marginTop: 10, fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -0.6 },
  meta: { marginTop: 4, fontFamily: TEXT, fontWeight: '700' },
  rule: { height: 1, marginTop: 12 },
  cue: { paddingTop: 10, fontFamily: TEXT },
  from: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 4, paddingRight: 4, paddingLeft: 12, borderRadius: 999 },
  fromB: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  fromText: { flex: 1, fontFamily: TEXT, fontSize: 12 },
  fromBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hole: { position: 'absolute', left: '50%', top: '46%', marginLeft: -100, marginTop: -100, transform: [{ rotate: '-13deg' }] },

  // A move (deck.css .deck-work .exercise-item.ex-deck).
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moveName: { fontFamily: DISPLAY, fontWeight: '700', letterSpacing: -0.17 },
  mic: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badge: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
  dose: { marginTop: 2, fontFamily: DISPLAY, fontWeight: '700' },
  moveCue: { marginTop: 3, fontFamily: TEXT },
  chip: { marginTop: 2, fontFamily: TEXT, fontSize: 12, lineHeight: 15.6 },
  setLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28 },
  setVal: { fontFamily: DISPLAY, fontWeight: '700' },
  setRpe: { fontFamily: TEXT, fontWeight: '700' },
  vary: { fontFamily: TEXT, fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 },
  caret: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rpeInfo: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  lineLog: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  log: { minWidth: 64, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  logText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  weightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  weight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  winput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10 },
  wval: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700' },
  wunit: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  reuse: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 999 },
  reuseIco: { fontSize: 15, fontWeight: '700', lineHeight: 15 },
  reuseTxt: { flexShrink: 1, fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  reuseRec: { fontFamily: TEXT, fontSize: 12, fontWeight: '700' },
  warn: { flexDirection: 'row', gap: 6, marginTop: 8 },
  warnIco: { fontSize: 12 },
  warnTxt: { flex: 1, fontFamily: TEXT, fontSize: 12, lineHeight: 16 },
  fill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 9, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  foldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foldVal: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  coolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skipped: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, paddingHorizontal: 14, marginVertical: 4, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.22)' },
  skippedLbl: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700' },
  skippedName: { flex: 1, fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', textDecorationLine: 'line-through' },
  skippedUndo: { fontFamily: TEXT, fontSize: 11, textDecorationLine: 'underline' },

  // The set rows (the session sheet's .exset-row, under deck.css).
  rows: { marginTop: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.16)' },
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8 },
  pip: { minWidth: 34, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pipText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  rowNum: { width: 16, textAlign: 'center', fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  ctl: { flex: 1, flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  step: { width: 38, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700', lineHeight: 24 },
  val: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5 },
  valText: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700' },
  suf: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  delta: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  wcell: { width: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, borderWidth: 1, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 7, minHeight: 36 },
  wcellVal: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  wcellU: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  toppip: { position: 'absolute', top: -7, right: 6, fontFamily: TEXT, fontSize: 8, fontWeight: '700', paddingVertical: 1, paddingHorizontal: 4, borderRadius: 2, overflow: 'hidden' },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 9, paddingBottom: 8, borderTopWidth: 1 },
  footLbl: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  footVal: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },

  // Call it.
  callit: { marginTop: 22, gap: 10 },
  rpeRead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  rpeN: { fontFamily: DISPLAY, fontSize: 48, fontWeight: '700', lineHeight: 48 },
  rpeW: { flexShrink: 1, fontFamily: TEXT, fontSize: 16, fontWeight: '700' },
  slider: { height: 40 },
  track: { position: 'absolute', left: 0, right: 0, top: 17, height: 6, borderRadius: 3 },
  thumb: { position: 'absolute', top: 6, width: 28, height: 28, marginLeft: -14, borderRadius: 14, borderWidth: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.45)' },
  notesLbl: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  notes: { minHeight: 84, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  notesText: { fontFamily: TEXT, fontSize: 16, lineHeight: 20 },

  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 14, paddingHorizontal: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  foot: { paddingTop: 12, paddingHorizontal: 20 },
  cta: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: DISPLAY, fontSize: 17, fontWeight: '700', letterSpacing: -0.17 },

  // The session map and the RPE bubble.
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%', paddingTop: 18, paddingHorizontal: 16, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 12 },
  sheetTitle: { flex: 1, fontFamily: DISPLAY, fontSize: 20, fontWeight: '700' },
  x: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 2 },
  tile: { width: '48.8%', minHeight: 98, padding: 12, borderRadius: 16, gap: 2 },
  tileNum: { fontFamily: DISPLAY, fontSize: 20, fontWeight: '700' },
  tileKick: { fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  tileTitle: { fontFamily: TEXT, fontSize: 15, fontWeight: '700', lineHeight: 18 },
  tileState: { marginTop: 'auto', fontFamily: TEXT, fontSize: 11, fontWeight: '700' },
  bubble: { position: 'absolute', left: 24, right: 24, top: 170, padding: 20, borderRadius: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.35), 0 4px 14px rgba(0,0,0,0.12)' },
  bubbleK: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700' },
  bubbleLine: { fontFamily: TEXT, fontSize: 16, fontWeight: '700', lineHeight: 21.6, paddingTop: 6, paddingBottom: 12 },
  band: { flexDirection: 'row', alignItems: 'baseline', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  bandR: { width: 40, fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  bandL: { width: 76, fontFamily: TEXT, fontSize: 14, fontWeight: '700', lineHeight: 18 },
  bandD: { flex: 1, fontFamily: TEXT, fontSize: 14, lineHeight: 18 },
  gotit: { marginTop: 14, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gotitText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700' },
});
