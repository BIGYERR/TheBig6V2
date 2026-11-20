// The mile pencil's two sheets in the Expo app (MIGRATION.md phase 3, row 5; D116), drawn as today's draws them
// (frontends/app/src/app/screens/mile-sheet/mile-sheet.ts and mile-lock.ts): the edit sheet (Your mile, the line under
// it, the minutes and the seconds, Update my mile and Keep what I have), or, in a program's last three weeks, the
// lock (The row holds, its facts, why, and Got it). Every word is today's: the lock's facts and both sheets' lines
// are today's own mile-sheet-model.ts, held to the byte. Which of the two a tap opens is program-list/list-screen.ts's
// openMile, judged at the tap.
//
// Update my mile is program-list/list-writes.ts's commitMileChange: a refusal says its words and the sheet stays; a
// mile saved slides the sheet away and hands the outcome to the list.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RefreshReport } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { MILE_WORDS, type MileOpen, activeId } from '../program-list/list-screen';
import { type Outcome, commitMileChange } from '../program-list/list-writes';
import { type Leave, SheetFrame } from '../program-list/SheetFrame';
import { DISPLAY, type Palette, TEXT } from '../theme';
import { MILE_INTRO, MILE_LOCK_TEXT } from './mile-sheet-model';

export function MileSheet({ palette: p, store, open, calm, report, say, onClose, onDone }: {
  palette: Palette; store: StateStore;
  /** What the pencil's tap opened (list-screen.ts openMile). */
  open: MileOpen;
  calm: boolean;
  /** What a rebuild is told when a part of it fails. */
  report: RefreshReport;
  say: (text: string) => void;
  onClose: () => void;
  /** A mile was saved: the list draws again and says the toast. */
  onDone: (o: Outcome) => void;
}) {
  const [mins, setMins] = useState(open.kind === 'edit' ? open.mins : '');
  const [secs, setSecs] = useState(open.kind === 'edit' ? open.secs : '');
  const s = styles;
  const field = [s.input, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }];
  const lock = (leave: Leave) => open.kind === 'lock' && (
    <>
      <Text testID="mile-lock-title" style={[s.title, { color: p.accent }]}>{MILE_WORDS.lockTitle}</Text>
      <View style={s.facts}>
        {open.facts.map((f) => (
          <View key={f.k} testID="mile-lock-fact" style={s.fact}>
            <Text style={[s.factK, { color: p.muted }]}>{f.k}</Text>
            <Text style={[s.factV, { color: p.text }]}>{f.v}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.words, s.lockWords, { color: p.text }]}>{MILE_LOCK_TEXT}</Text>
      <View style={s.btns}>
        <Pressable testID="mile-got-it" accessibilityRole="button" onPress={() => leave()} style={[s.btn, { backgroundColor: p.accent, borderColor: p.accent }]}>
          <Text style={[s.btnText, { color: p.onInk }]}>{MILE_WORDS.gotIt}</Text>
        </Pressable>
      </View>
    </>
  );
  const edit = (leave: Leave) => open.kind === 'edit' && (
    <>
      <Text testID="mile-title" style={[s.title, { color: p.text }]}>{MILE_WORDS.title}</Text>
      <Text style={[s.words, { color: p.text }]}>{MILE_INTRO}</Text>
      <View style={s.fields}>
        <TextInput testID="mile-mins" value={mins} onChangeText={setMins} placeholder={MILE_WORDS.min} placeholderTextColor={p.muted} keyboardType="number-pad" maxLength={2} style={field} />
        <TextInput testID="mile-secs" value={secs} onChangeText={setSecs} placeholder={MILE_WORDS.sec} placeholderTextColor={p.muted} keyboardType="number-pad" maxLength={2} style={field} />
      </View>
      <View style={s.btns}>
        <Pressable testID="mile-update" accessibilityRole="button" style={[s.btn, { backgroundColor: p.accent, borderColor: p.accent }]}
          onPress={() => {
            const o = commitMileChange(store, open.progId, mins, secs, activeId(store), Date.now(), report);
            if (o.saved) leave(() => onDone(o)); else if (o.toast) say(o.toast);
          }}>
          <Text style={[s.btnText, { color: p.onInk }]}>{MILE_WORDS.update}</Text>
        </Pressable>
        <Pressable testID="mile-keep" accessibilityRole="button" onPress={() => leave()} style={[s.btn, { borderColor: p.border2 }]}>
          <Text style={[s.btnText, { color: p.muted }]}>{MILE_WORDS.keep}</Text>
        </Pressable>
      </View>
    </>
  );
  return (
    <SheetFrame id={open.kind === 'lock' ? 'mile-lock' : 'mile-sheet'} palette={p} calm={calm} onClose={onClose}>
      {(leave) => (open.kind === 'lock' ? lock(leave) : edit(leave))}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  words: { fontFamily: TEXT, fontSize: 13, lineHeight: 19.5, marginTop: 6 },
  lockWords: { marginTop: 12 },
  facts: { marginTop: 10 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  factK: { fontFamily: TEXT, fontSize: 13, lineHeight: 22.1 },
  factV: { fontFamily: TEXT, fontSize: 13, lineHeight: 22.1, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  fields: { flexDirection: 'row', gap: 6, marginTop: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, fontFamily: TEXT, fontSize: 16, paddingVertical: 12, paddingHorizontal: 14, textAlign: 'center' },
  btns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, padding: 7, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
});
