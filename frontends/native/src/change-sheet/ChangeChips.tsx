// The chips under This Week in the Expo app (MIGRATION.md phase 3, row 5, its third session), drawn as today's page
// draws them into #changeActiveWrap (overlays.ts renderOverlayChip over week-view.css .change-chip and look.css): a
// chip for each change still live, its title naming the span, its line saying what it does and when it ends, I'm
// back on an injury, and a ✕ that removes it; under an open injury's chip, two weeks on, the check in with its three
// answers. Every word is overlay-readers.ts's overlayChips, written from the page's own.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { CHIP_REMOVE, type ChangeChip, type CheckIn } from './overlay-readers';

export function ChangeChips({ palette: p, chips, onBack, onRemove, onAnswer }: {
  palette: Palette;
  chips: (ChangeChip | CheckIn)[];
  /** I'm back on an injury's chip. */
  onBack: (id: string) => void;
  /** A chip's ✕. */
  onRemove: (id: string) => void;
  /** Better, Same or Worse on the check in. */
  onAnswer: (id: string, ans: 'better' | 'same' | 'worse') => void;
}) {
  const s = styles;
  if (!chips.length) return null;
  return (
    <View testID="week-changes" style={s.wrap}>
      {chips.map((c, i) => (
        <View key={c.kind + c.id + i} testID={c.kind === 'chip' ? 'change-chip' : 'change-checkin'} style={[s.chip, { backgroundColor: p.surface, borderColor: p.border2, borderLeftColor: p.accent }]}>
          <View style={s.body}>
            <Text style={[s.ttl, { color: p.text }]}>{c.title}</Text>
            <Text style={[s.sub, { color: p.muted }]}>{c.sub}</Text>
            {c.kind === 'chip' && c.back && (
              <Pressable testID="change-chip-back" accessibilityRole="button" hitSlop={6} onPress={() => onBack(c.id)} style={({ pressed }) => [s.act, { borderColor: p.red }, pressed && s.pressed]}>
                <Text style={[s.actText, { color: p.red }]}>I’m back</Text>
              </Pressable>
            )}
            {c.kind === 'checkin' && (
              <View style={s.acts}>
                {c.answers.map((a) => (
                  <Pressable key={a.ans} testID={'change-checkin-' + a.ans} accessibilityRole="button" onPress={() => onAnswer(c.id, a.ans)} style={({ pressed }) => [s.ans, { backgroundColor: p.surface, borderColor: p.border2 }, pressed && s.pressed]}>
                    <Text style={[s.actText, { color: p.text }]}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {c.kind === 'chip' && (
            <Pressable testID="change-chip-x" accessibilityRole="button" accessibilityLabel={CHIP_REMOVE} hitSlop={10} onPress={() => onRemove(c.id)} style={s.x}>
              <Text style={[s.xText, { color: p.muted }]}>✕</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // .change-active-wrap:not(:empty): 8 above the first chip; the chips stand edge to edge.
  wrap: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderLeftWidth: 3, borderTopRightRadius: 16, borderBottomRightRadius: 16, paddingVertical: 11, paddingHorizontal: 13 },
  body: { flex: 1 },
  ttl: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', paddingBottom: 1.7 },
  sub: { fontFamily: TEXT, fontSize: 12, lineHeight: 17, marginTop: 3 },
  act: { alignSelf: 'flex-start', marginTop: 8, borderWidth: 1, borderRadius: 2, paddingVertical: 7, paddingHorizontal: 12 },
  actText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  acts: { flexDirection: 'row', gap: 6, marginTop: 8 },
  ans: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 4 },
  x: { padding: 2 },
  xText: { fontFamily: TEXT, fontSize: 15, lineHeight: 15 },
  pressed: { transform: [{ scale: 0.97 }] },
});
