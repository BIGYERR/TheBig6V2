// The rest day sheet in the Expo app (MIGRATION.md phase 3, row 5, its second session), drawn as today's draws it
// (overlays.html #restOverlay, the .rand-overlay frame; week-view.css .ov- and .rd- with look.css): Move a session
// here, and Log cardio with Clear. Every word is rest-sheet-model.ts's, written from the page's own; every write is
// rest-writes.ts's, to this app's own store. Opened from This Week's rest card (Training anyway?, Log cardio, Edit
// cardio) and from the session sheet's Edit cardio on a day that holds a session and a jog.
//
// The sizes, weights, gaps and colours are today's computed styles. A line whose height the CSS leaves to the face
// is WebKit's height, iOS's own and the rest under it (program-list/Programs.tsx has the measure). The body is the
// frame's column with 16 between its pieces (.rand-body), on top of each piece's own margins. WebKit lays a line whose
// height the CSS sets at whole points (13 at 1.5 is drawn 19, 24 at 1.1 is drawn 26), measured in the simulator's
// Safari on today's own sheet; the name's letters sit 1.4 lower in its line there, taken off under it.
//
// A tap that closes the sheet runs in today's order: the sheet goes, what is under it is drawn again, the toast.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { readDayLogs } from '@ia/core/engine/state-day-log.ts';
import { readCompleted } from '@ia/core/engine/state-day-status.ts';

import { Wheel, type WheelFlushers } from '../day-detail/Wheel';
import type { WheelView } from '../day-detail/cardio-fields-model';
import { type Leave, SheetFrame } from '../program-list/SheetFrame';
import { DISPLAY, type Palette, TEXT } from '../theme';
import { type CardioView, type MoveView, type RestDraft, type RestLogs, type RestNote, faceInput, pickSession, pickType, restHeld, restView, tapRpe, toCardio } from './rest-sheet-model';
import { type RestSession, type RestTap, applyRestCardio, applyRestMove, clearRestCardio } from './rest-writes';

export function RestSheet({ palette: p, session, draft: opened, calm, say, onClose, onWrote }: {
  palette: Palette;
  /** The store and the program in hand. */
  session: RestSession;
  /** What the tap opened (rest-sheet-model.ts openRest). */
  draft: RestDraft;
  calm: boolean;
  say: (text: string) => void;
  onClose: () => void;
  /** A move, a log or a clear was stored: what is under the sheet is drawn again. */
  onWrote: () => void;
}) {
  const s = styles;
  const [draft, setDraft] = useState(opened);
  const now = useRef(draft);
  const hold = (d: RestDraft): void => { now.current = d; setDraft(d); };
  /** Counts the draws that start the wheels afresh (the page's iaWheelInit after a render): a sport or an effort tapped. */
  const [drawn, setDrawn] = useState(0);
  const flushers = useRef<WheelFlushers>({ list: [] }).current;
  const flush = (): void => { flushers.list.forEach((f) => f()); };

  const logs = readDayLogs(session.store, session.prog.id) as unknown as RestLogs;
  const view = restView(draft, session.prog, readCompleted(session.store, session.prog.id) as Record<string, unknown>, logs);

  /** A tap that may close the sheet: the draft it left, then the sheet away, the screen under it drawn, the toast. */
  const done = (r: RestTap, leave: Leave): void => {
    if (r.draft) hold(r.draft);
    if (!r.closed) { if (r.toast) say(r.toast); return; }
    leave(() => { onWrote(); if (r.toast) say(r.toast); });
  };

  const note = (n: RestNote, tone?: string, style?: object) => (
    <View style={[s.effect, { borderTopColor: tone || p.border }, style]}>
      <Text style={[s.effectTtl, { color: tone || p.text }]}>{n.title}</Text>
      <Text style={[s.effectSub, { color: p.muted }]}>{n.sub}</Text>
    </View>
  );
  const head = (v: { kicker: string; title: string; intro: string }) => (
    <>
      <Text testID="rest-kicker" style={[s.kicker, { color: p.muted }]}>{v.kicker}</Text>
      <Text testID="rest-title" accessibilityRole="header" style={[s.title, { color: p.text }]}>{v.title}</Text>
      <Text style={[s.intro, { color: p.muted }]}>{v.intro}</Text>
    </>
  );
  const apply = (id: string, text: string, onPress: () => void) => (
    <Pressable testID={id} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.apply, { backgroundColor: p.accent }, pressed && s.pressed]}>
      <Text style={[s.applyText, { color: p.onInk }]}>{text}</Text>
    </Pressable>
  );

  const move = (v: MoveView, leave: Leave) => (
    <>
      {head(v)}
      {v.none && note(v.none)}
      {v.none && apply('rest-instead', v.none.button, () => hold(toCardio(now.current)))}
      {v.already && note({ title: v.already.title, sub: v.already.lines.concat(v.already.tail).join('\n') })}
      {!v.none && <Text style={[s.label, { color: p.muted }]}>{v.label}</Text>}
      {v.rows.map((r) => (
        <Pressable key={r.day} testID={'rest-row-' + r.day} accessibilityRole="button" accessibilityState={{ selected: r.sel }} onPress={() => hold(pickSession(now.current, r.day))}
          style={[s.eq, { borderColor: r.sel ? p.accent : p.border2 }, r.sel && { backgroundColor: p.surface }]}>
          <View style={s.eqBody}>
            <Text style={[s.eqName, r.sel ? { color: p.text, fontWeight: '700' } : { color: p.muted }]}>{r.title}</Text>
            <Text style={[s.eqDesc, { color: p.muted }]}>{r.desc}</Text>
          </View>
          {r.sel && <Text style={[s.eqChk, { color: p.text }]}>✓</Text>}
        </Pressable>
      ))}
      {v.warn && note(v.warn, p.red, s.warn)}
      {v.apply && apply('rest-move', v.apply, () => done(applyRestMove(session, now.current, Date.now()), leave))}
    </>
  );

  const wheel = (w: WheelView) => (
    <View style={s.wheelWrap}>
      <Wheel key={w.hiddenId + ':' + draft.type + ':' + drawn} w={w} p={p} held={() => (w.hiddenId === 'rest_mins' ? now.current.mins : now.current.dist)} onWrite={(id, value) => hold(faceInput(now.current, id, value))} flushers={flushers} />
    </View>
  );
  const cardio = (v: CardioView, leave: Leave) => (
    <>
      {head(v)}
      <Text style={[s.label, { color: p.muted }]}>{v.chipsLabel}</Text>
      <View style={s.row}>
        {v.chips.map((c) => (
          <Pressable key={c.type} testID={'rest-chip-' + c.type} accessibilityRole="button" accessibilityState={{ selected: c.sel }}
            onPress={() => { hold(pickType(now.current, restHeld(logs, draft.w, draft.day), c.type)); setDrawn((n) => n + 1); }}
            style={[s.chip, { borderColor: c.sel ? p.text : p.border2 }, c.sel && { backgroundColor: p.text }]}>
            <Text style={[s.chipText, { color: c.sel ? p.bg : p.text }]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[s.label, s.labelGap, { color: p.muted }]}>{v.timeLabel}</Text>
      {wheel(v.time)}
      {v.dist && <Text style={[s.label, s.labelGap, { color: p.muted }]}>{v.dist.label}</Text>}
      {v.dist && ('wheel' in v.dist ? wheel(v.dist.wheel) : (
        <View style={s.row}>
          <TextInput testID="rest-dist" value={v.dist.box.value} onChangeText={(t) => hold(faceInput(now.current, 'rest_dist', t))} placeholder={v.dist.box.placeholder} placeholderTextColor={p.muted} keyboardType="number-pad"
            style={[s.input, { backgroundColor: p.surface, borderColor: p.border2, color: p.text }]} />
        </View>
      ))}
      <Text style={[s.label, s.labelGap, { color: p.muted }]}>{v.effortLabel}</Text>
      {v.efforts.map((e) => (
        <Pressable key={e.v} testID={'rest-rpe-' + e.v} accessibilityRole="button" accessibilityState={{ selected: e.sel }}
          onPress={() => { flush(); hold(tapRpe(now.current, e.v)); setDrawn((n) => n + 1); }}
          style={[s.wide, { borderColor: e.sel ? p.text : p.border2 }, e.sel && { backgroundColor: p.text }]}>
          <Text style={[s.wideText, { color: e.sel ? p.bg : p.text }]}><Text style={s.wideHead}>{e.head}</Text>{' · ' + e.name}</Text>
          <Text style={[s.wideDesc, { color: e.sel ? p.bg : p.text }]}>{e.desc}</Text>
        </Pressable>
      ))}
      {v.note && note(v.note, p.accent)}
      {apply('rest-log', v.log, () => { flush(); done(applyRestCardio(session, now.current, Date.now()), leave); })}
      {v.clear && (
        <Pressable testID="rest-clear" accessibilityRole="button" onPress={() => done(clearRestCardio(session, now.current), leave)} style={({ pressed }) => [s.clear, { borderColor: p.border2 }, pressed && s.pressed]}>
          <Text style={[s.clearText, { color: p.text }]}>{v.clear}</Text>
        </Pressable>
      )}
    </>
  );

  return (
    <SheetFrame id="rest-sheet" palette={p} calm={calm} onClose={onClose}>
      {(leave) => <View testID={'rest-' + view.kind} style={s.body}>{view.kind === 'move' ? move(view, leave) : cardio(view, leave)}</View>}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  kicker: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  title: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', letterSpacing: -0.24, lineHeight: 26, marginTop: 4, marginBottom: -1.4 },
  intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 18 },
  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5, marginBottom: 7 },
  labelGap: { marginTop: 14 },
  eq: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 6 },
  eqBody: { flex: 1 },
  eqName: { fontFamily: TEXT, fontSize: 14, fontWeight: '500', paddingBottom: 2.3 },
  eqDesc: { fontFamily: TEXT, fontSize: 12, paddingBottom: 1.7, marginTop: 2 },
  eqChk: { fontFamily: TEXT, fontSize: 15, paddingBottom: 2.1 },
  effect: { borderTopWidth: 1, paddingTop: 14, marginTop: 12, marginBottom: 16 },
  warn: { marginTop: 12 },
  // Today's 3 under the note's name, less the 0.7 its words sat low by beside today's own (the simulator's Safari).
  effectTtl: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5, marginBottom: 2.3 },
  effectSub: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  apply: { borderRadius: 999, padding: 15, alignItems: 'center' },
  applyText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', paddingBottom: 2.3 },
  clear: { marginTop: 10, borderWidth: 1, borderRadius: 999, padding: 13, alignItems: 'center' },
  clearText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  pressed: { transform: [{ scale: 0.98 }] },
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  chip: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 4 },
  chipText: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', paddingBottom: 1.7 },
  wide: { borderWidth: 1, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 6 },
  wideText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '400', paddingBottom: 1.5 },
  wideHead: { fontWeight: '700' },
  wideDesc: { fontFamily: DISPLAY, fontSize: 11, opacity: 0.7, marginTop: 2, paddingBottom: 1.9 },
  input: { flex: 1, fontFamily: DISPLAY, fontSize: 16, fontWeight: '700', paddingVertical: 11, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12 },
  wheelWrap: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', maxWidth: 178.2 },
});
