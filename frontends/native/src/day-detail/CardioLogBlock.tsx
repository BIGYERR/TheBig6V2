// The cardio's hand log inside the session sheet's log (MIGRATION.md phase 3, row 3): the Angular app's
// cardio-fields.ts and the cardio part of session-log.ts, drawn from the same models (cardio-fields-model.ts,
// session-log-model.ts). On a planned run its plan strip, the fixed dimension's wheel showing the plan and the free
// one's, or the reps stepper with the rep clock or the work miles; the plain run's miles and pace; the ride's clock
// under its strip; the swim's yards. Then Did a different activity? with its sport chips and note, and Log. Every
// word is today's. What a tap writes is cardio-log.ts.
import { asyIcon } from '@ia/core/engine/icons.ts';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { DISPLAY, type Palette, TEXT } from '../theme';
import type { PlanStrip, RepStepper, WheelView } from './cardio-fields-model';
import { type CardioLog, doseReadout } from './cardio-log';
import type { SessionLogView } from './session-log-model';
import { cardioLogLabel } from './sheet-readers';
import { Wheel, type WheelFlushers } from './Wheel';

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}
const rgba = (hex: string, a: number): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

/** What the block's taps call. */
export interface CardioTaps {
  /** What a field holds now, by its id. */
  held: (id: string) => string;
  /** A wheel rested on a new face, or the swim's box typed into. */
  set: (id: string, value: string) => void;
  step: (delta: number) => void;
  log: () => void;
  picker: () => void;
  chip: (sport: string) => void;
}

export function CardioLogBlock({ p, card, c, nodes, active, logged, drawn, flushers, on }: {
  p: Palette;
  /** The cardio of the log as drawn: the planned sport and the three chips. */
  card: NonNullable<SessionLogView['cardio']>;
  c: CardioLog;
  nodes: Record<string, string>;
  /** The sport the card is on. */
  active: string;
  /** The stored entry holds a number for that sport (D218). */
  logged: boolean;
  /** Counts the fields' draws: each draw starts its wheels afresh, as the page's iaWheelInit does. */
  drawn: number;
  flushers: WheelFlushers;
  on: CardioTaps;
}) {
  const s = styles;
  const f = c.fields;
  const wheel = (w: WheelView) => <Wheel key={w.hiddenId + ':' + drawn} w={w} p={p} held={() => on.held(w.hiddenId)} onWrite={on.set} flushers={flushers} />;
  const strip = (x: PlanStrip) => (
    <View testID="cardio-strip" style={[s.strip, x.bike ? { backgroundColor: rgba(p.bike, 0.12), borderColor: rgba(p.bike, 0.3) } : { backgroundColor: rgba(p.run, 0.15), borderColor: rgba(p.run, 0.3) }]}>
      <Text style={[s.stripLbl, { color: x.bike ? p.bike : p.run }]}>{x.label}</Text>
      <Text style={[s.stripVal, { color: p.text }]}>{x.value}</Text>
    </View>
  );
  const label = (icon: string, words: string) => (
    <View style={s.labelRow}><Icon name={icon} size={15} color={p.muted} /><Text style={[s.label, { color: p.muted }]}>{words}</Text></View>
  );
  const sub = (words: string) => <Text style={[s.sub, { color: p.muted }]}>{words}</Text>;
  const stepper = (st: RepStepper) => (
    <View style={s.stepBlock}>
      <Text style={[s.label, { color: p.muted }]}>Reps completed</Text>
      <View style={s.stepRow}>
        <View style={[s.stepCtl, { borderColor: p.border2, backgroundColor: p.surface }]}>
          <Pressable testID="cardio-rep-less" accessibilityRole="button" accessibilityLabel="One rep fewer" onPress={() => on.step(-1)} style={[s.stepBtn, { backgroundColor: p.surface2 }]}><Text style={[s.stepSign, { color: p.text }]}>−</Text></Pressable>
          <View style={s.stepVal}><Text testID="cardio-reps" style={[s.stepNum, { color: p.text }]}>{c.repsShown ?? st.shown}</Text></View>
          <Pressable testID="cardio-rep-more" accessibilityRole="button" accessibilityLabel="One rep more" onPress={() => on.step(1)} style={[s.stepBtn, { backgroundColor: p.surface2 }]}><Text style={[s.stepSign, { color: p.text }]}>+</Text></Pressable>
        </View>
        <Text style={[s.repsOf, { color: p.muted }]}>{st.of}</Text>
      </View>
    </View>
  );
  const readout = doseReadout(c.dose, nodes);
  const derived = f.kind === 'time' || f.kind === 'dist' || f.kind === 'reps_dist' || f.kind === 'reps_time' ? (
    <View testID="cardio-readout">
      {readout.map((r, i) => (
        <View key={i} style={[s.derived, r.joined ? s.derivedJoined : { borderTopColor: p.border }]}>
          <Text style={[s.dLbl, { color: p.muted }]}>{r.label}</Text>
          <Text style={[r.empty ? s.dEmpty : s.dVal, { color: r.empty ? p.muted : p.text }]}>{r.value}{r.small !== '' && <Text style={[s.dSmall, { color: p.muted }]}>{'  ' + r.small}</Text>}</Text>
        </View>
      ))}
    </View>
  ) : null;

  return (
    <View testID="cardio-log" style={s.block}>
      {(f.kind === 'time' || f.kind === 'dist') && (
        <>
          {strip(f.strip)}
          {label('run', 'Log the run')}
          <View style={[s.wrap, s.solo]}>{wheel(f.first)}</View>
          {sub('Shows the plan. Move it to match the watch.')}
          <View style={[s.wrap, s.solo]}>{wheel(f.second)}</View>
          {sub('Off the watch.')}
          {derived}
        </>
      )}
      {f.kind === 'reps_dist' && (
        <>
          {strip(f.strip)}
          {stepper(f.stepper)}
          <View style={[s.wrap, s.rep]}>{wheel(f.wheel)}</View>
          {sub('what the watch showed on most reps')}
          {derived}
        </>
      )}
      {f.kind === 'reps_time' && (
        <>
          {strip(f.strip)}
          {stepper(f.stepper)}
          <Text style={[s.label, { color: p.muted }]}>Miles in the work reps</Text>
          <View style={[s.wrap, s.solo]}>{wheel(f.wheel)}</View>
          {sub('Leave out the easy jog between reps.')}
          {derived}
        </>
      )}
      {f.kind === 'run' && (
        <>
          {label('run', 'Log the run')}
          {f.speedHint && <Text style={[s.sub, s.hint, { color: p.muted }]}>Whole session off the watch. Warm up, efforts and recoveries all count.</Text>}
          <View style={s.wrap}>{wheel(f.dist)}{wheel(f.pace)}</View>
        </>
      )}
      {f.kind === 'bike' && (
        <>
          {f.strip && strip(f.strip)}
          {label('bike', 'Log the ride')}
          <View style={[s.wrap, s.solo]}>{wheel(f.wheel)}</View>
        </>
      )}
      {f.kind === 'swim' && (
        <>
          {label('swim', 'Log the swim')}
          <TextInput key={'yards:' + drawn} testID="cardio-yards" accessibilityLabel="Yards" keyboardType="number-pad" placeholder="yards" placeholderTextColor={p.muted} defaultValue={f.yards}
            onChangeText={(t) => on.set('log_swim_yards', t)} style={[s.input, { backgroundColor: p.surface2, borderColor: p.border2, color: p.text }]} />
        </>
      )}
      <Pressable testID="cardio-other" accessibilityRole="button" hitSlop={6} onPress={on.picker} style={s.link}>
        <Icon name="history" size={13} color={p.muted} /><Text style={[s.linkText, { color: p.muted }]}>Did a different activity?</Text>
      </Pressable>
      {c.picker && (
        <View testID="cardio-picker" style={s.picker}>
          <Text style={[s.pickerLbl, { color: p.muted }]}>Logged as</Text>
          <View style={s.chips}>
            {card.chips.map((ch) => {
              const lit = ch.sport === active;
              return (
                <Pressable key={ch.sport} testID={'cardio-chip-' + ch.sport} accessibilityRole="button" accessibilityState={{ selected: lit }} onPress={() => on.chip(ch.sport)}
                  style={[s.chip, { borderColor: lit ? p.accent : p.border2, backgroundColor: lit ? 'rgba(' + p.inkRgb + ',0.12)' : p.surface2 }]}>
                  <Icon name={ch.sport} size={15} color={lit ? p.accent : p.muted} />
                  <Text style={[s.chipText, { color: lit ? p.accent : p.muted }]}>{ch.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {c.note !== '' && <Text testID="cardio-note" style={[s.note, { color: p.accent }]}>{c.note}</Text>}
        </View>
      )}
      <Pressable testID="cardio-logbtn" accessibilityRole="button" onPress={on.log}
        style={[s.logBtn, logged ? { backgroundColor: rgba(p.run, 0.15), borderColor: p.run } : { backgroundColor: p.signal, borderColor: p.signal }]}>
        <Text style={[s.logBtnText, { color: logged ? p.run : p.onSignal }]}>{cardioLogLabel(logged)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 8 },
  strip: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10 },
  stripLbl: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  stripVal: { fontFamily: 'Menlo', fontSize: 13, fontWeight: '700' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '600' },
  wrap: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  solo: { maxWidth: 178.2 },
  rep: { maxWidth: 190 },
  sub: { fontFamily: TEXT, fontSize: 10, marginTop: 4, marginBottom: 6 },
  hint: { marginTop: 0 },
  stepBlock: { marginBottom: 10, gap: 5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCtl: { flexDirection: 'row', alignItems: 'stretch', width: 150, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  stepBtn: { width: 38, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  stepSign: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700' },
  stepVal: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily: DISPLAY, fontSize: 21, fontWeight: '700' },
  repsOf: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  derived: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  derivedJoined: { borderTopWidth: 0, paddingTop: 0 },
  dLbl: { fontFamily: TEXT, fontSize: 10, fontWeight: '700' },
  dVal: { fontFamily: 'Menlo', fontSize: 17, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  dEmpty: { fontFamily: TEXT, fontSize: 13, fontWeight: '500', textAlign: 'right' },
  dSmall: { fontFamily: TEXT, fontSize: 11, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, fontFamily: TEXT, fontSize: 14 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingTop: 6 },
  linkText: { fontFamily: TEXT, fontSize: 12, textDecorationLine: 'underline' },
  picker: { marginTop: 8 },
  pickerLbl: { fontFamily: TEXT, fontSize: 10, fontWeight: '700', marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1 },
  chipText: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '700' },
  note: { fontFamily: TEXT, fontSize: 11, marginTop: 8, lineHeight: 11 * 1.4 },
  logBtn: { marginTop: 12, padding: 12, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  logBtnText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
});
