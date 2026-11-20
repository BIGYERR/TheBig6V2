// A wheel of the cardio's log (MIGRATION.md phase 3, row 3; V182 D1 to D6). Its rules are wheels.ts, the page's own:
// the face it opens on, when a rest writes, the string a face stores. This file is how it moves: one column of rows
// under a band per digit group, each snapping to a row, read 90 ms after it last moved, as the page's is. The motion is
// built once for Mario's phone to judge (MIGRATION.md section 6, decision 14).
import { type ComponentRef, memo, useEffect, useMemo, useRef } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DISPLAY, type Palette } from '../theme';
import type { WheelCol, WheelView } from './cardio-fields-model';
import { WHEEL_ROW, WHEEL_SETTLE_MS, type WheelMoved, wheelRecentre, wheelRest, wheelSeed, wheelSel } from './wheels';

/** The wheels of a sheet that are still settling: each rests at once when a tap is about to read the form (the page's iaWheelFlush). */
export interface WheelFlushers { list: (() => void)[] }

const tint = (hex: string, a: number): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

/** One column's rows. They never change while the wheel stands, so they are drawn once. */
const Rows = memo(function Rows({ col, color }: { col: WheelCol; color: string }) {
  return (
    <>
      <View style={styles.pad} />
      {col.items.map((it, i) => (
        <View key={i} style={styles.row}><Text style={[it.nil ? styles.nil : styles.face, { color }]}>{it.face}</Text></View>
      ))}
      <View style={styles.pad} />
    </>
  );
});

export function Wheel({ w, p, held, onWrite, flushers }: {
  w: WheelView; p: Palette;
  /** What the wheel's field holds now. */
  held: () => string;
  /** A rest on a new face: the string for the field. */
  onWrite: (id: string, value: string) => void;
  flushers: WheelFlushers;
}) {
  const seed = useMemo(() => wheelSeed(w), [w]);
  const moved = useRef<WheelMoved>({ moved: false, seedFace: seed.face });
  const offsets = useRef<number[]>(seed.rows.map((r) => r * WHEEL_ROW));
  const timers = useRef<(ReturnType<typeof setTimeout> | null)[]>(w.cols.map(() => null));
  const cols = useRef<(ComponentRef<typeof ScrollView> | null)[]>([]);
  const now = useRef({ held, onWrite });
  now.current = { held, onWrite };

  /** A column at rest: jumped back toward its middle when it wraps, then the wheel's face read (the page's settle). */
  const settle = (ci: number): void => {
    timers.current[ci] = null;
    const col = w.cols[ci]!;
    const y = offsets.current[ci]!, back = wheelRecentre(col, y);
    if (back !== y) { offsets.current[ci] = back; const el = cols.current[ci]; if (el) el.scrollTo({ y: back, animated: false }); }
    const vals = w.cols.map((c, i) => wheelSel(c, offsets.current[i]!));
    const r = wheelRest(w.kind, moved.current, vals, now.current.held());
    moved.current = r.st;
    if (r.write !== null) now.current.onWrite(w.hiddenId, r.write);
  };
  const scrolled = (ci: number, e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    offsets.current[ci] = e.nativeEvent.contentOffset.y;
    const t = timers.current[ci];
    if (t) clearTimeout(t);
    timers.current[ci] = setTimeout(() => settle(ci), WHEEL_SETTLE_MS);
  };
  useEffect(() => {
    const flush = (): void => { timers.current.forEach((t, ci) => { if (t) { clearTimeout(t); settle(ci); } }); };
    flushers.list.push(flush);
    return () => { flushers.list = flushers.list.filter((f) => f !== flush); timers.current.forEach((t) => { if (t) clearTimeout(t); }); };
    // The wheel is drawn afresh (a new key) whenever its fields are, so its first values stand for its life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.cell, { flex: w.ncols }]}>
      <Text style={[styles.cap, { color: p.muted }]}>{w.cap}</Text>
      <View testID={'wheel-' + w.hiddenId} style={[styles.wheel, { backgroundColor: p.surface2, borderColor: p.border2 }]}>
        {w.cols.map((col, ci) => (
          <ScrollView
            key={ci}
            ref={(el) => { cols.current[ci] = el; }}
            testID={'wheel-' + w.hiddenId + '-' + ci}
            style={styles.col}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            snapToInterval={WHEEL_ROW}
            decelerationRate="fast"
            scrollEventThrottle={16}
            contentOffset={{ x: 0, y: seed.rows[ci]! * WHEEL_ROW }}
            onScroll={(e) => scrolled(ci, e)}
          >
            <Rows col={col} color={p.text} />
          </ScrollView>
        ))}
        {/* The rows above and below the band recede, and the band marks the row that counts. */}
        <View pointerEvents="none" style={[styles.shade, { top: 0, backgroundColor: tint(p.surface2, 0.55) }]} />
        <View pointerEvents="none" style={[styles.shade, { top: WHEEL_ROW * 2, backgroundColor: tint(p.surface2, 0.55) }]} />
        <View pointerEvents="none" style={[styles.band, { borderColor: p.border2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { minWidth: 0 },
  // look.css draws the caption at 12 (detail-sheet.css's 10 is the component sheet's); its line is WebKit's 16, iOS's
  // own 14.3 and 1.7 under it.
  cap: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', paddingBottom: 1.7, marginBottom: 5 },
  wheel: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', height: WHEEL_ROW * 3 + 2 },
  col: { flex: 1, height: WHEEL_ROW * 3 },
  pad: { height: WHEEL_ROW },
  row: { height: WHEEL_ROW, alignItems: 'center', justifyContent: 'center' },
  face: { fontFamily: 'Menlo', fontSize: 19 },
  nil: { fontFamily: DISPLAY, fontSize: 15 },
  shade: { position: 'absolute', left: 0, right: 0, height: WHEEL_ROW },
  band: { position: 'absolute', left: 0, right: 0, top: WHEEL_ROW, height: WHEEL_ROW, borderTopWidth: 1, borderBottomWidth: 1 },
});
