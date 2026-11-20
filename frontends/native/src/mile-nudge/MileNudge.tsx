// The coach's mile nudge in the Expo app (MIGRATION.md phase 3, row 5, its second session; D274 P-ANCHORNUDGE): the
// sheet today's app raises over This Week once two easy runs in a row were logged off the plan the same way (the
// Angular MileNudge, mile-nudge.css). Its words are today's model's (mile-nudge-model.ts nudgeText, a copy held to
// the byte); its two answers are nudge-screen.ts's. This file only draws it, and writes nothing.
//
// It rises from the foot of the screen over 360 ms, its scrim fading in over 240, both still under Reduce Motion, and
// goes at once on either answer, as today's. A tap on the scrim does nothing: the sheet is answered by a button.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISPLAY, type Palette, TEXT } from '../theme';
import type { NudgeText } from './mile-nudge-model';

export function MileNudge({ palette: p, text, calm, onUpdate, onKeep }: { palette: Palette; text: NudgeText; calm: boolean; onUpdate: () => void; onKeep: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scrim = useRef(new Animated.Value(calm ? 1 : 0)).current;
  const rise = useRef(new Animated.Value(calm ? 0 : 1)).current;
  useEffect(() => {
    if (calm) return;
    Animated.timing(scrim, { toValue: 1, duration: 240, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start();
    Animated.timing(rise, { toValue: 0, duration: 360, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View testID="mile-nudge" accessibilityViewIsModal style={[StyleSheet.absoluteFill, s.overlay]}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: scrim }]} />
      <Animated.View testID="mile-nudge-sheet" style={[s.sheet, { backgroundColor: p.surface, paddingBottom: 18 + insets.bottom, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}>
        <Text style={[s.label, { color: p.signal }]}>{text.label}</Text>
        <Text testID="mile-nudge-title" accessibilityRole="header" style={[s.title, { color: p.text }]}>{text.title}</Text>
        <Text testID="mile-nudge-body" style={[s.body, { color: p.text }]}>{text.body}</Text>
        <Pressable testID="mile-nudge-update" accessibilityRole="button" onPress={onUpdate} style={({ pressed }) => [s.btn, s.glow, { backgroundColor: p.signal, boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.35)' }, pressed && s.pressed]}>
          <Text style={[s.glowText, { color: p.onSignal }]}>{text.update}</Text>
        </Pressable>
        <Pressable testID="mile-nudge-keep" accessibilityRole="button" onPress={onKeep} style={({ pressed }) => [s.btn, { borderColor: p.border2 }, pressed && s.pressed]}>
          <Text style={[s.btnText, { color: p.text }]}>{text.keep}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.42)' },
  sheet: { gap: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingHorizontal: 20, boxShadow: '0 -12px 40px rgba(0,0,0,0.18)' },
  label: { fontFamily: TEXT, fontSize: 13, fontWeight: '700', letterSpacing: 0.78, textTransform: 'uppercase', paddingBottom: 1.5 },
  // WebKit lays a line whose height the CSS sets at whole points: 28 at 1.05 is drawn 29, 15 at 1.45 is drawn 21.
  title: { fontFamily: DISPLAY, fontSize: 28, fontWeight: '700', letterSpacing: -0.56, lineHeight: 29 },
  body: { fontFamily: TEXT, fontSize: 15, lineHeight: 21, marginTop: 4, marginBottom: 6 },
  // This Week's buttons (week-view.css .tw-btn, 4 above each inside this sheet), the glow on the one live control (D263).
  btn: { marginTop: 4, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  glow: { height: 56, borderRadius: 28, borderWidth: 0 },
  btnText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700' },
  glowText: { fontFamily: DISPLAY, fontSize: 19, fontWeight: '700' },
  pressed: { transform: [{ scale: 0.97 }] },
});
