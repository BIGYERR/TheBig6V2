// The rows of today's Bugs screen (shell.css .look-row, .look-lbl, .look-seg, .look-opt, .look-note, with look.css
// over them): a rule above, a small label, a line of equal buttons, a note. Look, Your data and Engine are each one.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DISPLAY, type Palette, TEXT } from '../theme';

export function Row({ id, label, palette: p, children }: { id: string; label: string; palette: Palette; children: ReactNode }) {
  return (
    <View testID={id} accessibilityLabel={label} style={[s.row, { borderTopColor: p.border }]}>
      <Text style={[s.label, { color: p.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

export function Note({ id, palette: p, children }: { id?: string; palette: Palette; children: string }) {
  // An empty note keeps its place in the row (the page's empty #backupMsg takes the row's gap and no height).
  if (!children) return <View testID={id} style={s.none} />;
  return <Text testID={id} accessibilityLiveRegion="polite" style={[s.note, { color: p.muted }]}>{children}</Text>;
}

export function Seg({ id, children }: { id?: string; children: ReactNode }) {
  return <View testID={id} style={s.seg}>{children}</View>;
}

/** One button of a row. `on` is the chosen look: ink ground, the type that sits on ink. */
export function Opt({ id, label, on = false, disabled = false, palette: p, onPress }: { id: string; label: string; on?: boolean; disabled?: boolean; palette: Palette; onPress: () => void }) {
  return (
    <Pressable testID={id} accessibilityRole="button" accessibilityState={{ selected: on, disabled }} disabled={disabled} onPress={onPress}
      style={[s.opt, { borderColor: on ? p.accent : p.border2, backgroundColor: on ? p.accent : 'transparent' }]}>
      <Text style={[s.optText, { color: on ? p.onInk : p.muted }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  // .look-row: a column, 8 between its parts, a rule above with 16 under it and 6 over it.
  row: { gap: 8, borderTopWidth: 1, paddingTop: 16, marginTop: 6 },
  // .look-lbl under look.css: 13, the weight WebKit draws for 600 (Bold). Its line is the face's own: WebKit lays
  // it at 17, iOS draws it 15.5, and the difference goes under it (measured on the simulator beside today's app).
  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  seg: { flexDirection: 'row', gap: 8 },
  // .look-opt under look.css: a pill, 11 above and below its word, a hairline of the second border.
  opt: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 11 },
  optText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  // .look-note: 12 on a line of 1.5. iOS sets the words 0.7 lower in that line than WebKit does, and what follows
  // a note stood a pixel low with all of it given back under the line.
  note: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginTop: -0.7, marginBottom: 0.35 },
  none: { height: 0 },
});
