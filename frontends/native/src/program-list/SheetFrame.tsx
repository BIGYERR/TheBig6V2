// The frame of the goal sheet and of the mile pencil's two sheets in the Expo app (MIGRATION.md phase 3, row 5), as
// today's draws it (the .rand-overlay frame of overlays-components.css: the whole screen on the app's ground, a
// header with Back, a body that scrolls). It slides up and away as this app's other full sheets do, at once under
// Reduce Motion. The body is handed `leave`, which slides the sheet away once and then calls onClose.
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DISPLAY, type Palette } from '../theme';

/** motion.css: the overlay's slide, cubic-bezier(.32,.72,0,1), 400 ms in and 360 ms out. */
const SLIDE = Easing.bezier(0.32, 0.72, 0, 1);
const SLIDE_IN = 400;
const SLIDE_OUT = 360;

/** Slides the sheet away, running `before` first; a second call while it leaves does nothing. */
export type Leave = (before?: () => void) => void;

export function SheetFrame({ id, palette: p, calm, onClose, children }: {
  id: string; palette: Palette; calm: boolean;
  /** The sheet is gone. */
  onClose: () => void;
  children: (leave: Leave) => ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const y = useRef(new Animated.Value(calm ? 0 : 1)).current;
  const leaving = useRef(false);
  useEffect(() => {
    if (!calm) Animated.timing(y, { toValue: 0, duration: SLIDE_IN, easing: SLIDE, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leave: Leave = (before) => {
    if (leaving.current) return;
    leaving.current = true;
    if (before) before();
    if (calm) { onClose(); return; }
    Animated.timing(y, { toValue: 1, duration: SLIDE_OUT, easing: SLIDE, useNativeDriver: true }).start(() => onClose());
  };
  return (
    <Animated.View testID={id} accessibilityViewIsModal style={[StyleSheet.absoluteFill, { backgroundColor: p.bg, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12), borderBottomColor: p.border }]}>
        <Pressable testID={id + '-back'} accessibilityRole="button" hitSlop={10} onPress={() => leave()} style={[styles.back, { backgroundColor: p.surface, borderColor: p.border2 }]}>
          <Text style={[styles.backText, { color: p.text }]}>← Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 60 + insets.bottom }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
        {children(leave)}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  back: { borderWidth: 1, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14 },
  backText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '600' },
  body: { padding: 20 },
});
