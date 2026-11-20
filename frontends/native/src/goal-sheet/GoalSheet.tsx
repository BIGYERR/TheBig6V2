// The change a goal sheet in the Expo app (MIGRATION.md phase 3, row 5; D5), drawn as today's draws it
// (frontends/app/src/app/screens/goal-sheet/goal-sheet.ts over wizard.css): the heading for the sport, the sport's
// goals with the current one marked and greyed, and once one is picked the decision under them: its title, its
// words, the targets a goal needs typed, and the two buttons, the safer one filled. Every word is today's: what the
// sheet shows is today's own goal-sheet-model.ts, held to the byte, fed by program-list/list-screen.ts.
//
// The draft is the sheet's own, as the page keeps `_goalDraft` while its sheet is open. Make the switch is
// program-list/list-writes.ts's commitGoalChange; the sheet then slides away and hands the outcome to the list.
// The distance's unit is two buttons where today's is a list of two.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RefreshReport } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { GOAL_INTRO, GOAL_WORDS, activeId, goalView, selectGoal, typeGoal } from '../program-list/list-screen';
import { type Outcome, commitGoalChange } from '../program-list/list-writes';
import { SheetFrame } from '../program-list/SheetFrame';
import { DISPLAY, type Palette, TEXT } from '../theme';
import type { GoalDraft } from './goal-sheet-model';

export function GoalSheet({ palette: p, store, draft: opened, calm, report, onClose, onDone }: {
  palette: Palette; store: StateStore;
  /** The draft as the pencil opened it (list-screen.ts openGoal). */
  draft: GoalDraft;
  calm: boolean;
  /** What a rebuild is told when a part of it fails. */
  report: RefreshReport;
  onClose: () => void;
  /** The switch was made: the list draws again and says the toast. */
  onDone: (o: Outcome) => void;
}) {
  const [draft, setDraft] = useState(opened);
  const g = goalView(store, draft, new Date());
  const s = styles;
  if (!g) return null;
  const v = g.view, d = v.decision;
  const field = [s.input, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }];
  const type = (key: 'targetDist' | 'targetMins' | 'targetSecs', placeholder: string, value: string, pad: 'decimal-pad' | 'number-pad', style: object) => (
    <TextInput testID={'goal-' + key} value={value} onChangeText={(t) => setDraft(typeGoal(draft, key, t))} placeholder={placeholder} placeholderTextColor={p.muted}
      keyboardType={pad} maxLength={key === 'targetDist' ? 6 : 2} style={[field, style]} />
  );
  return (
    <SheetFrame id="goal-sheet" palette={p} calm={calm} onClose={onClose}>
      {(leave) => {
        const commit = (): void => {
          const o = commitGoalChange(store, draft, activeId(store), Date.now(), report);
          if (o) leave(() => onDone(o));
        };
        const commitBtn = d && (
          <Pressable key="commit" testID="goal-commit" accessibilityRole="button" accessibilityState={{ disabled: !g.ok }} disabled={!g.ok} onPress={commit}
            style={[s.btn, d.up ? { borderColor: p.accent } : { backgroundColor: p.accent, borderColor: p.accent }, { opacity: g.ok ? 1 : 0.4 }]}>
            <Text style={[s.btnText, { color: d.up ? p.accent : p.onInk }]}>{d.commitLabel}</Text>
          </Pressable>
        );
        const keepBtn = d && (
          <Pressable key="keep" testID="goal-keep" accessibilityRole="button" onPress={() => leave()}
            style={[s.btn, d.up ? { backgroundColor: p.accent, borderColor: p.accent } : { borderColor: p.border2 }]}>
            <Text style={[s.btnText, { color: d.up ? p.onInk : p.muted }]}>{d.keepLabel}</Text>
          </Pressable>
        );
        return (
          <>
            <Text testID="goal-heading" style={[s.heading, { color: p.signal }]}>{v.heading}</Text>
            <Text style={[s.intro, { color: p.muted }]}>{GOAL_INTRO}</Text>
            <View style={s.options}>
              {v.options.map((o) => (
                <Pressable key={o.id} testID={'goal-option-' + o.id} accessibilityRole="button" accessibilityState={{ selected: o.selected, disabled: o.current }} disabled={o.current}
                  onPress={() => { if (!o.current) setDraft(selectGoal(draft, o.id)); }}
                  style={[s.option, { backgroundColor: o.selected ? 'rgba(' + p.inkRgb + ',0.18)' : p.surface, borderColor: o.selected ? p.accent : p.border }, o.current && s.current]}>
                  <View style={s.optionHead}>
                    <Text style={[s.optionLabel, { color: o.selected ? p.accent : p.text }]}>{o.label}</Text>
                    {o.current && <Text style={[s.currentMark, { color: p.muted }]}>{GOAL_WORDS.current}</Text>}
                  </View>
                  <Text style={[s.optionDesc, { color: p.muted }]}>
                    {o.desc}
                    {!o.current && o.up && <Text style={{ color: p.accent }}>{'\n' + GOAL_WORDS.bigger}</Text>}
                  </Text>
                </Pressable>
              ))}
            </View>
            {d && (
              <View testID="goal-decision" style={[s.decision, { borderTopColor: p.border }]}>
                <Text style={[s.decisionTitle, { color: d.up ? p.accent : p.text }]}>{d.title}</Text>
                <Text style={[s.decisionBody, { color: p.text }]}>{d.body}</Text>
                {d.inputs === 'pace' && (
                  <View style={s.inputs}>
                    <Text style={[s.inputsLabel, { color: p.muted }]}>{GOAL_WORDS.pace}</Text>
                    <View style={s.inputsRow}>
                      {type('targetDist', GOAL_WORDS.dist, d.values.targetDist, 'decimal-pad', s.grow)}
                      <View style={[s.units, { borderColor: p.border2 }]}>
                        {(['mi', 'km'] as const).map((u) => (
                          <Pressable key={u} testID={'goal-unit-' + u} accessibilityRole="button" accessibilityState={{ selected: d.values.paceUnit === u }} onPress={() => setDraft(typeGoal(draft, 'paceUnit', u))}
                            style={[s.unit, { backgroundColor: d.values.paceUnit === u ? p.accent : p.surface }]}>
                            <Text style={[s.unitText, { color: d.values.paceUnit === u ? p.onInk : p.muted }]}>{u}</Text>
                          </Pressable>
                        ))}
                      </View>
                      {type('targetMins', GOAL_WORDS.min, d.values.targetMins, 'number-pad', s.narrow)}
                      {type('targetSecs', GOAL_WORDS.sec, d.values.targetSecs, 'number-pad', s.narrow)}
                    </View>
                  </View>
                )}
                {d.inputs === 'time' && (
                  <View style={s.inputs}>
                    <Text style={[s.inputsLabel, { color: p.muted }]}>{GOAL_WORDS.time}</Text>
                    <View style={s.inputsRow}>
                      {type('targetMins', GOAL_WORDS.min, d.values.targetMins, 'number-pad', s.grow)}
                      {type('targetSecs', GOAL_WORDS.sec, d.values.targetSecs, 'number-pad', s.grow)}
                    </View>
                  </View>
                )}
                <View style={s.btns}>{d.up ? [keepBtn, commitBtn] : [commitBtn, keepBtn]}</View>
              </View>
            )}
          </>
        );
      }}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  heading: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  intro: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  options: { gap: 8 },
  option: { borderWidth: 1.5, borderRadius: 4, paddingVertical: 12, paddingHorizontal: 14 },
  current: { opacity: 0.55 },
  optionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLabel: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  currentMark: { fontFamily: DISPLAY, fontSize: 10, fontWeight: '400' },
  optionDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16.8, marginTop: 3 },
  decision: { marginTop: 16, borderTopWidth: 1, paddingTop: 14 },
  decisionTitle: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700' },
  decisionBody: { fontFamily: TEXT, fontSize: 13, lineHeight: 19.5, marginTop: 6 },
  inputs: { marginTop: 10 },
  inputsLabel: { fontFamily: TEXT, fontSize: 11, marginBottom: 5 },
  inputsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 4, fontFamily: TEXT, fontSize: 16, paddingVertical: 12, paddingHorizontal: 14 },
  grow: { flex: 1, textAlign: 'center' },
  narrow: { width: 58, textAlign: 'center', paddingHorizontal: 4 },
  units: { flexDirection: 'row', borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
  unit: { paddingVertical: 14, paddingHorizontal: 9 },
  unitText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
  btns: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, padding: 7, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
});
