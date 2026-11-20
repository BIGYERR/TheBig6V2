// The exercise swap sheet in the Expo app (MIGRATION.md phase 3, the deck's third session), drawn as today's draws it
// (frontends/app/src/app/screens/swap-sheet/swap-sheet.ts over detail-sheet.css, session-sheet.css and look.css): the
// lift going out on the header band with its tags and the dose a pick keeps, then "Same job", then "Different job,
// same day", each row a pick. Every word is today's: what the sheet shows is today's own swap-sheet-model.ts, held to
// the byte, over the list deck-swaps.ts reads. A full sheet over the deck, sliding up in 400 ms and away in 360
// (motion.css), at once under Reduce Motion.
//
// It writes nothing itself: a pick is handed to the deck, which swaps the lift (deck-writes.ts swapMove) and draws
// the day again while the sheet slides away, as today's closes its sheet and draws the card under it.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';

import { DISPLAY, type Palette, TEXT } from '../theme';
import type { SwapRow, SwapSheetView } from './swap-sheet-model';

/** motion.css: the overlay's slide, cubic-bezier(.32,.72,0,1), 400 ms in and 360 ms out. */
const SLIDE = Easing.bezier(0.32, 0.72, 0, 1);
const SLIDE_IN = 400;
const SLIDE_OUT = 360;

/** Type on the header band: white at an alpha (rgba(var(--on-band-rgb), a)). */
const on = (a: number): string => 'rgba(255,255,255,' + a + ')';

export function SwapSheet({ palette: p, view: v, calm, onPick, onClose }: {
  palette: Palette; view: SwapSheetView; calm: boolean;
  /** A row was picked: the deck swaps the lift and draws the day again. The sheet then slides away. */
  onPick: (name: string) => void;
  /** The sheet is gone, by Back or after a pick. */
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // The sheet's place is this one moving value from its first frame to its last, never a plain number.
  const y = useRef(new Animated.Value(calm ? 0 : 1)).current;
  const leaving = useRef(false);
  useEffect(() => {
    if (!calm) Animated.timing(y, { toValue: 0, duration: SLIDE_IN, easing: SLIDE, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** The sheet slides away once, then is gone. A second tap while it leaves does nothing. */
  const leave = (before?: () => void): void => {
    if (leaving.current) return;
    leaving.current = true;
    if (before) before();
    if (calm) { onClose(); return; }
    Animated.timing(y, { toValue: 1, duration: SLIDE_OUT, easing: SLIDE, useNativeDriver: true }).start(() => onClose());
  };
  const s = styles;
  const row = (r: SwapRow, k: number, kind: string) => (
    <Pressable
      key={kind + k} testID={'swap-cand-' + kind + '-' + k} accessibilityRole="button" onPress={() => leave(() => onPick(r.name))}
      style={({ pressed }) => [s.cand, { backgroundColor: pressed ? p.surface2 : p.surface, borderColor: r.caution ? 'rgba(' + p.signalRgb + ',0.35)' : 'transparent' }, pressed && { transform: [{ scale: 0.99 }] }]}
    >
      <Text style={[s.candName, { color: p.text }]}>{r.name}</Text>
      {!!r.note && <Text style={[s.candNote, { color: p.signal }]}>{r.note}</Text>}
    </Pressable>
  );
  return (
    <Animated.View
      testID="swap-sheet" accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, { backgroundColor: p.bg, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}
    >
      <View style={[s.header, { backgroundColor: p.bandHeader, borderBottomColor: p.border, paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.toprow}>
          <Pressable testID="swap-back" accessibilityRole="button" hitSlop={12} onPress={() => leave()}>
            <Text style={[s.back, { color: on(0.6) }]}>‹ Back</Text>
          </Pressable>
        </View>
        <Text style={[s.over, { color: p.onBand }]}>Swap out</Text>
        <Text testID="swap-out-name" style={[s.title, { color: p.onBand }]}>{v.outName}</Text>
        <View testID="swap-tags" style={s.tags}>
          <Text style={[s.tag, { color: on(0.78), backgroundColor: on(0.1), borderColor: on(0.22) }]}>{v.kindTag}</Text>
          <Text style={[s.tag, { color: on(0.78), backgroundColor: on(0.1), borderColor: on(0.22) }]}>{v.regionTag}</Text>
          {!!v.slotTag && <Text style={[s.tag, { color: on(0.78), backgroundColor: on(0.1), borderColor: on(0.22) }]}>{v.slotTag}</Text>}
          {!!v.keeps && <Text testID="swap-keeps" style={[s.keeps, { color: on(0.6) }]}>{'Whatever you pick keeps ' + v.keeps + '.'}</Text>}
        </View>
      </View>
      <ScrollView testID="swap-body" style={{ flex: 1 }} contentContainerStyle={[s.body, { paddingBottom: 40 + insets.bottom }]}>
        {v.sameJob.length > 0 && (
          <View>
            <Text style={[s.secLbl, { color: p.muted }]}>Same job</Text>
            <Text style={[s.secSub, { color: p.muted }]}>These do the same work. Your week keeps its shape.</Text>
            {!!v.flowNote && <Text style={[s.secSub, { color: p.muted }]}>{v.flowNote}</Text>}
            {v.sameJob.map((r, k) => row(r, k, 'same'))}
          </View>
        )}
        {v.otherJob.length > 0 && (
          <View>
            <View style={s.cautionLbl}>
              <SvgXml xml={asyIcon('warning', 13).replace(/ style="[^"]*"/, '')} color={p.signal} width={13} height={13} />
              <Text style={[s.secLbl, { color: p.signal, paddingBottom: 0 }]}>Different job, same day</Text>
            </View>
            <Text style={[s.secSub, { color: p.muted }]}>{'Still ' + v.otherRegion + ' work. You give up the ' + v.givenUp + ' for today.'}</Text>
            {v.otherJob.map((r, k) => row(r, k, 'other'))}
          </View>
        )}
        {!v.sameJob.length && !v.otherJob.length
          ? <Text testID="swap-empty" style={[s.empty, { color: p.muted, backgroundColor: p.surface }]}>Nothing else in your kit does this job. Keep it, or drop it with the minus and move on.</Text>
          : <Text testID="swap-foot" style={[s.foot, { color: p.muted, borderTopColor: p.border }]}>Swaps hold for this session only. Next week says what it always said.</Text>}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 13, borderBottomWidth: 1 },
  toprow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  back: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  over: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  title: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', lineHeight: 28, marginTop: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  tag: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', borderWidth: 1, borderRadius: 2, paddingVertical: 3, paddingHorizontal: 7, overflow: 'hidden' },
  keeps: { width: '100%', marginTop: 4, fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  body: { paddingTop: 14, paddingHorizontal: 20 },
  secLbl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingHorizontal: 2, paddingBottom: 3 },
  cautionLbl: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 18, paddingBottom: 3 },
  secSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 12 * 1.4, paddingHorizontal: 2, paddingBottom: 9 },
  cand: { borderWidth: 1, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  candName: { fontFamily: TEXT, fontSize: 15, fontWeight: '500' },
  candNote: { fontFamily: TEXT, fontSize: 12, lineHeight: 12 * 1.35, marginTop: 3 },
  empty: { fontFamily: TEXT, borderRadius: 24, padding: 14, fontSize: 13, lineHeight: 13 * 1.5, overflow: 'hidden' },
  foot: { fontFamily: TEXT, fontSize: 12, lineHeight: 12 * 1.45, paddingTop: 14, paddingHorizontal: 2, borderTopWidth: 1, marginTop: 14 },
});
