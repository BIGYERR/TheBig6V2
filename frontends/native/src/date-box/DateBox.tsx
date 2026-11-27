// The date box in the Expo app (MIGRATION.md phase 3, row 5, its third session): the iOS calendar with Reset and a
// check, over whatever asked for a date (Hurt?'s From, Traveling?'s From and Through, This Week's race date and
// Program Start). Today's app gets this from WebKit's date field; date-box.ts says what was seen of it and is held
// equal. A day picked is written at once and the box stays, as WebKit's stays, until the check or a tap outside it.
// Reset writes a blank field, the box stays, and the calendar goes back to the day it opened on (today for a blank
// field): seen again in the simulator's Safari with the wizard's start date, a field opened on the 21st, the 25th
// picked, and Reset showing the 21st on a day that was the 20th. A field whose value is an attribute (the wizard's
// race date) goes back to the day it was drawn with instead, and hands that day on (date-box.ts, `reset`). Reset and
// the check dim under the finger, as WebKit's own do: on a field already on today, Reset moves nothing else on the
// screen (Mario's phone on IA Next 127: "the reset button doesnt click").
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { DISPLAY, NIGHT, type Palette } from '../theme';
import { DATE_WORDS, type DateAsk, PRESSED_DIM, calendarDay, pickedValue, resetDay, resetWrites } from './date-box';

export function DateBox({ palette: p, ask, calm, onClose }: { palette: Palette; ask: DateAsk; calm: boolean; onClose: () => void }) {
  const s = styles;
  const opened = useRef(calendarDay(ask.value, new Date())).current;
  const [day, setDay] = useState(opened);
  const shown = useRef(new Animated.Value(calm ? 1 : 0)).current;
  useEffect(() => {
    if (!calm) Animated.timing(shown, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View testID="date-box" accessibilityViewIsModal style={[StyleSheet.absoluteFill, s.root, { opacity: shown }]}>
      <Pressable testID="date-box-out" accessibilityLabel="Close the calendar" onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(' + p.scrimRgb + ',0.45)' }]} />
      <View style={[s.card, { backgroundColor: p.surface, borderColor: p.border }]}>
        <DateTimePicker
          testID="date-box-calendar"
          mode="date"
          display="inline"
          value={day}
          themeVariant={p === NIGHT ? 'dark' : 'light'}
          accentColor={p.signal}
          onChange={(e, d) => { if (e.type !== 'set' || !d) return; setDay(d); ask.onChange(pickedValue(d)); }}
        />
        <View style={[s.foot, { borderTopColor: p.border }]}>
          <Pressable testID="date-box-reset" accessibilityRole="button" hitSlop={8} onPress={() => { ask.onChange(resetWrites(ask)); setDay(resetDay(ask, opened, new Date())); }} style={({ pressed }) => [s.btn, { backgroundColor: p.surface2 }, pressed && { opacity: PRESSED_DIM }]}>
            <Text style={[s.btnText, { color: p.text }]}>{DATE_WORDS.reset}</Text>
          </Pressable>
          <Pressable testID="date-box-done" accessibilityRole="button" accessibilityLabel={DATE_WORDS.done} hitSlop={8} onPress={onClose} style={({ pressed }) => [s.check, { backgroundColor: p.signal }, pressed && { opacity: PRESSED_DIM }]}>
            <Text style={[s.checkText, { color: p.onSignal }]}>✓</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 370, borderRadius: 24, borderWidth: 1, paddingHorizontal: 8, paddingTop: 8, overflow: 'hidden' },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16 },
  btnText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '500' },
  check: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  checkText: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '700' },
});
