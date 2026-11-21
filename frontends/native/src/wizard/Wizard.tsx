// The wizard in the Expo app (MIGRATION.md phase 3, row 6, the first of two sessions), drawn as today's draws it
// (frontends/app/src/app/screens/wizard/wizard.ts over wizard.css, overlays-components.css, this-week.css and
// look.css): the bar (Back, the progress line, the count), the step, and the last button under it, over the whole
// screen and the tab bar. Every word and number is today's: the steps are today's own models
// (wizard-model.ts, cardio-goal-model.ts) and the page's readers (wizard-readers.ts), through wizard-screen.ts.
//
// A tap is wizard-screen.ts's and writes the draft alone. The step is drawn when a tap asks for it, as the page's
// renderWizardStep is called, so a start date blanked by the calendar's Reset stays blank in its field until the next
// whole draw (the page repaints two lines only: repaintStart). The last button is Generate Program: the length's
// pop-up, the refusals and the generating screen are wizard-writes.ts's, the one file here that writes to the store.
//
// THIS SESSION: the cardio goals step opens and shuts its sports and lists each sport's goals; a goal takes no
// press yet, and its fields, the seed offer, the race date and the card under it are the second session's.
// The start date's field is this app's date box (date-box/DateBox.tsx) where today's is WebKit's own.
//
// THE LINES STAND WHERE WEBKIT PUTS THEM. Every text here carries the line height WebKit lays it at, measured in the
// simulator's Safari on today's own markup (wizard-screen.ts titleLine has the title's): a line with no line height of
// its own takes the face's line at that size (14 bold is 19, 15 is 20, 16 is 21), and a line height that is not a
// whole number is cut down to one (12 at 1.4 is 16, not 16.8). A 1.5 edge is cut down to whole device pixels (EDGE).
// A slash does not end a line in WebKit and does in iOS text, so a card's words carry a joiner after each one (unbroken).
// iOS lays each text one device pixel taller than its lines (read from the pixels of both apps: a card of two texts
// stood two pixels taller than today's, one of three texts three), so each text that stacks gives that pixel back (PX).
import { useRef, useState } from 'react';
import { PixelRatio, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';
import type { RefreshReport } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { DateAsk } from '../date-box/date-box';
import { DISPLAY, type Palette, TEXT } from '../theme';
import type { ScreenProgram } from '../this-week/week-screen';
import { Generating } from './Generating';
import type { Choice } from './wizard-model';
import {
  type CopyRun, type FloorToast, WIZARD_WORDS as W, copyRuns, dateFieldText, liftOnly, titleLine, unbroken, repaintStart, setChoice, setName, setStart, setUnit, startWizard, toggleCardioTypeSport, toggleRestDay,
  wizardBack, wizardNext, wizardView,
} from './wizard-screen';
import { LENGTH_WORDS, beginGenerate, finishGenerate, lengthWarning, refusal } from './wizard-writes';

/** One device pixel, in points: what iOS adds under each text's lines, taken back in the margins below. */
const PX = 1 / PixelRatio.get();
/** A 1.5 edge as WebKit draws it: cut down to whole device pixels (4 of them at three to the point). */
const EDGE = Math.floor(1.5 * PixelRatio.get()) / PixelRatio.get();

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <SvgXml xml={asyIcon(name, size).replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />;
}

export function Wizard({ palette: p, store, say, report, onDate, onClose, onDone }: {
  palette: Palette; store: StateStore;
  /** The toast: its words, and the mark before them when the page writes one. */
  say: (text: string, icon?: string) => void;
  /** What the rebuild after Generate is told when a part of it fails. */
  report: RefreshReport;
  /** The start date's field asks for the calendar. */
  onDate: (ask: DateAsk) => void;
  /** Back on the first step: the Programs tab again. */
  onClose: () => void;
  /** Generate is done: the program in hand, for This Week. */
  onDone: (prog: ScreenProgram) => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const st = useRef(startWizard(new Date())).current;
  const [drawn, setDrawn] = useState(() => wizardView(store, st, new Date()));
  /** The page's renderWizardStep: the step in hand, drawn whole. */
  const render = (): void => setDrawn(wizardView(store, st, new Date()));
  const [warn, setWarn] = useState<{ msg: string; weeks: number } | null>(null);
  const [gen, setGen] = useState<{ first: string; lines: string[] } | null>(null);
  const done = useRef<ScreenProgram | null>(null);
  const s = styles;
  const v = drawn.view;
  // clamp(21px, 6.5vw, 28px)
  const titleSize = Math.min(28, Math.max(21, width * 0.065));

  const toast = (t: FloorToast | null): void => { if (t) say(t.text, t.icon); };
  /** Generate, once the pop-up is answered or there is none (doGenerate): the two checks, then the generating screen. */
  const go = (): void => {
    const no = refusal(st.draft);
    if (no !== null) { say(no); render(); return; }
    const b = beginGenerate(st.draft, new Date());
    setGen({ first: b.first, lines: b.lines });
  };
  const next = (): void => {
    if (!wizardNext(st)) { render(); return; }
    const w = lengthWarning(st.draft);
    if (w) setWarn(w); else go();
  };
  const back = (): void => { if (wizardBack(st)) onClose(); else render(); };

  // ── The pieces ──
  const title = (t: string, sub: string) => (
    <>
      <Text accessibilityRole="header" style={[s.title, { fontSize: titleSize, lineHeight: titleLine(titleSize), color: p.text }]}>{t}</Text>
      <Text style={[s.subtitle, { color: p.muted }]}>{sub}</Text>
    </>
  );
  const sel = { borderColor: p.accent, backgroundColor: 'rgba(' + p.inkRgb + ',0.18)' };
  const card = (on: boolean, pressed: boolean) => [s.option, { backgroundColor: p.surface, borderColor: p.border }, on && sel, pressed && { backgroundColor: p.surface2 }];
  /** A card with its icon beside its words (the path, the experience, the lifting focus). */
  const optionRow = (c: Choice, id: string, icon: number, style: object, onPress: () => void) => (
    <Pressable key={c.id} testID={id} accessibilityRole="button" accessibilityState={{ selected: c.sel }} onPress={onPress} style={({ pressed }) => [card(c.sel, pressed), style]}>
      <View style={s.noShrink}><Icon name={c.icon} size={icon} color={p.text} /></View>
      <View style={s.grow}>
        <Text style={[s.optionLabel, { color: c.sel ? p.accent : p.text }]}>{c.label}</Text>
        <Text style={[s.optionDesc, { color: p.muted }]}>{unbroken(c.desc)}</Text>
        {c.detail ? <Text style={[s.optionDetail, { color: p.muted }]}>{unbroken(c.detail)}</Text> : null}
      </View>
    </Pressable>
  );
  /** A row card with a check at its end (an equipment, a sport of the add-on). */
  const typeCard = (id: string, on: boolean, icon: string, size: number, name: string, desc: string | null, small: boolean, onPress: () => void) => (
    <Pressable key={id} testID={id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress}
      style={[s.type, small && s.typeSmall, { backgroundColor: p.surface, borderColor: p.border }, on && sel]}>
      <View style={[s.noShrink, small && s.typeIconSmall]}><Icon name={icon} size={size} color={p.text} /></View>
      <View style={s.grow}>
        <Text style={[s.typeName, small && s.typeNameSmall, { color: on ? p.accent : p.text }]}>{name}</Text>
        {desc !== null && <Text style={[s.typeDesc, { color: p.muted }]}>{unbroken(desc)}</Text>}
      </View>
      <Text style={[s.check, { color: p.accent, opacity: on ? 1 : 0 }]}>✓</Text>
    </Pressable>
  );
  /** A line the page writes as markup, wrapping as one text: its bold runs, and the shorter plan's link (the second session's press). */
  const copy = (html: string, style: object, bold: object, key?: string) => (
    <Text key={key} style={style}>
      {copyRuns(html).map((r: CopyRun, i) => (r.icon ? null : <Text key={i} style={[r.bold && bold, r.link !== null && [s.link, { color: p.text }]]}>{r.text}</Text>))}
    </Text>
  );
  /** A line with icons in it (a summary row's value, an advisory): its runs in a row that wraps. */
  const iconLine = (html: string, size: number, color: string, style: object, bold: object, rowStyle: object, key?: string) => (
    <View key={key} style={[s.iconLine, rowStyle]}>
      {copyRuns(html).map((r, i) => (r.icon
        ? <SvgXml key={i} xml={r.icon.replace(/ style="[^"]*"/, '')} color={color} width={size} height={size} />
        : <Text key={i} style={[style, r.bold && bold]}>{r.text}</Text>))}
    </View>
  );

  let body: React.ReactNode = null;
  if (v.step === 'primary') {
    body = (
      <>
        {title(W.primary.title, W.primary.subtitle)}
        <View style={s.col10}>{v.choices.map((c) => optionRow(c, 'wizard-path-' + c.id, 30, s.optionWide, () => { setChoice(st, 'primaryPath', c.id); render(); }))}</View>
      </>
    );
  } else if (v.step === 'profile') {
    const f = v.profile;
    const unit = (id: string, label: string, on: boolean) => (
      <Pressable testID={'wizard-unit-' + id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { setUnit(st, id); render(); }} style={[s.unit, { backgroundColor: on ? p.accent : 'transparent' }]}>
        <Text style={[s.unitText, { color: on ? p.onInk : p.muted }]}>{label}</Text>
      </Pressable>
    );
    body = (
      <>
        {title(W.profile.title, W.profile.subtitle)}
        <Text style={[s.label, s.mb8, { color: p.muted }]}>{W.profile.experience}</Text>
        <View style={[s.col8, s.mb20]}>{f.experience.map((c) => optionRow(c, 'wizard-exp-' + c.id, 26, s.optionExp, () => { setChoice(st, 'experience', c.id); render(); }))}</View>
        <Text style={[s.label, s.mb8, { color: p.muted }]}>{W.profile.age}</Text>
        <View style={[s.ages, s.mb16]}>
          {f.age.map((a) => (
            <Pressable key={a.id} testID={'wizard-age-' + a.id} accessibilityRole="button" accessibilityState={{ selected: a.sel }} onPress={() => { setChoice(st, 'ageBracket', a.id); render(); }} style={({ pressed }) => [card(a.sel, pressed), s.age]}>
              <View style={s.ageIcon}><Icon name={a.icon} size={24} color={p.text} /></View>
              <Text style={[s.optionLabel, { color: a.sel ? p.accent : p.text }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.label, s.mb8, { color: p.muted }]}>{W.profile.units}</Text>
        <View style={[s.units, s.mb16, { backgroundColor: p.surface2, borderColor: p.border2 }]}>{unit('lbs', W.profile.lbs, !f.kg)}{unit('kg', W.profile.kg, f.kg)}</View>
        <View style={[s.hints, { backgroundColor: p.surface }]}>
          <Text style={[s.hint, { color: p.muted }]}><Text style={[s.bold, { color: p.accent }]}>{W.profile.expLabel}</Text>{' ' + f.expHint}</Text>
          <Text style={[s.hint, s.mt6, { color: p.muted }]}><Text style={[s.bold, { color: p.accent }]}>{f.ageLabel}</Text>{' ' + f.ageHint}</Text>
        </View>
      </>
    );
  } else if (v.step === 'equipment') {
    body = (
      <>
        {title(W.equipment.title, W.equipment.subtitle)}
        <View style={s.col10}>{v.choices.map((e) => typeCard('wizard-equipment-' + e.id, e.sel, e.icon, 26, e.label, e.desc, false, () => { setChoice(st, 'equipment', e.id); render(); }))}</View>
      </>
    );
  } else if (v.step === 'cardio_goal') {
    body = (
      <>
        {title(W.cardio.title, W.cardio.subtitle)}
        <View style={s.col10}>
          {v.sports.map((sp) => (
            <View key={sp.id} testID={'wizard-sport-' + sp.id} style={[s.sport, { backgroundColor: p.surface, borderColor: sp.sel ? p.accent : p.border }]}>
              <Pressable testID={'wizard-sport-tap-' + sp.id} accessibilityRole="button" accessibilityState={{ expanded: sp.sel }} onPress={() => { toggleCardioTypeSport(st, sp.id); render(); }}
                style={[s.sportHead, { backgroundColor: sp.sel ? 'rgba(' + p.inkRgb + ',0.06)' : 'transparent' }]}>
                <Icon name={sp.icon} size={24} color={p.text} />
                <View style={s.grow}>
                  <Text style={[s.sportName, { color: sp.sel ? p.accent : p.text }]}>{sp.name}</Text>
                  <Text style={[s.sportDesc, { color: p.muted }]}>{sp.desc}</Text>
                </View>
                <Text style={[s.sportCheck, { color: p.accent, opacity: sp.sel ? 1 : 0 }]}>✓</Text>
              </Pressable>
              {sp.sel && (
                <View style={[s.sportBody, { borderTopColor: p.border }]}>
                  <View style={s.goals}>
                    {sp.goals.map((g) => (
                      // A goal takes no press this session: its fields are the second session's.
                      <View key={g.id} testID={'wizard-goal-' + g.id} style={[s.goal, { backgroundColor: p.surface, borderColor: p.border }, g.sel && sel]}>
                        <Text style={[s.optionLabel, { color: g.sel ? p.accent : p.text }]}>{g.label}</Text>
                        <Text style={[s.optionDesc, { color: p.muted }]}>{g.desc}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </>
    );
  } else if (v.step === 'lifting_focus') {
    const l = v.lifting;
    body = (
      <>
        {title(W.lifting.title, l.subtitle)}
        <View style={s.col10}>{l.choices.map((c) => optionRow(c, 'wizard-focus-' + c.id, 28, s.optionWide, () => { setChoice(st, 'liftingFocus', c.id); render(); }))}</View>
        {l.addOn && (
          <View testID="wizard-add-on" style={[s.addOn, { backgroundColor: p.surface, borderColor: p.border2 }]}>
            <Text style={[s.addOnHead, { color: p.muted, borderBottomColor: p.border }]}>{W.lifting.addOn}</Text>
            <View style={s.addOnBody}>
              {l.addOn.sports.map((t) => typeCard('wizard-add-' + t.id, t.sel, t.icon, 22, t.label, null, true, () => { toggleCardioTypeSport(st, t.id); render(); }))}
              {typeCard('wizard-lift-only', l.addOn.liftOnly, 'dumbbell', 22, W.lifting.liftOnly, null, true, () => { liftOnly(st); render(); })}
            </View>
          </View>
        )}
      </>
    );
  } else if (v.step === 'days') {
    const d = v.days, f = d.floor;
    body = (
      <>
        {title(W.days.title, W.days.subtitle)}
        <View style={s.dayGrid}>
          {d.days.map((x) => (
            <Pressable key={x.key} testID={'wizard-day-' + x.key} accessibilityRole="button" accessibilityLabel={x.short + (x.rest ? ', rest' : x.blocked ? ', training, locked' : ', training')} onPress={() => { toast(toggleRestDay(st, x.key)); render(); }}
              style={[s.day, { backgroundColor: x.rest ? p.surface2 : p.surface, borderColor: x.rest ? 'rgba(' + p.inkRgb + ',0.08)' : p.border, opacity: x.blocked ? 0.5 : 1 }]}>
              <Text style={[s.dayText, { color: x.rest ? 'rgba(' + p.inkRgb + ',0.2)' : p.muted }]}>{x.short}</Text>
              {x.rest ? <Text style={[s.dayMark, { color: 'rgba(' + p.inkRgb + ',0.2)', opacity: 0.5 }]}>✕</Text>
                : x.blocked ? <View style={[s.dayLock, { opacity: 0.6 }]}><Icon name="🔒" size={10} color={p.muted} /></View> : null}
            </Pressable>
          ))}
        </View>
        <Text testID="wizard-day-count" style={[s.legend, { color: p.muted }]}>{W.days.legend}<Text style={[s.bold, { color: p.text }]}>{d.count}</Text>{W.days.selected}</Text>
        {f && (
          <View testID="wizard-floor" style={[s.floor, { backgroundColor: 'rgba(' + p.inkRgb + ',0.12)', borderColor: 'rgba(' + p.inkRgb + ',0.35)' }]}>
            <View style={s.floorTitleRow}><View style={s.floorIcon}><Icon name="🔒" size={13} color={p.accent} /></View><Text style={[s.floorTitle, { color: p.accent }]}>{W.days.lockTitle}</Text></View>
            {f.reason
              ? <Text style={[s.floorText, { color: p.text }]}>{W.days.floorGoal.before}<Text style={s.bold}>{f.reason}</Text>{W.days.floorGoal.mid}<Text style={s.bold}>{f.min + W.days.floorGoal.days}</Text>{W.days.floorGoal.after}</Text>
              : <Text style={[s.floorText, { color: p.text }]}>{W.days.floorThree}</Text>}
          </View>
        )}
        {d.advisories.length > 0 && (
          <View testID="wizard-advisories" style={[s.advisories, { backgroundColor: 'rgba(' + p.inkRgb + ',0.10)', borderColor: 'rgba(' + p.inkRgb + ',0.28)' }]}>
            {d.advisories.map((a, i) => iconLine(a, 14, p.accent, [s.advisory, { color: p.accent }], s.bold, s.left, String(i)))}
          </View>
        )}
      </>
    );
  } else {
    const n = v.name;
    const field = [s.field, { backgroundColor: p.surface, borderColor: p.border2 }];
    /** The start date changed in the calendar: the draft, then the two lines the page repaints. */
    const picked = (iso: string): void => { setStart(st, iso); setDrawn((d) => (d.view.step === 'name' ? { shell: d.shell, view: { step: 'name', name: repaintStart(st, d.view.name, new Date()) } } : d)); };
    body = (
      <>
        {title(W.name.title, W.name.subtitle)}
        <View style={s.group}>
          <Text style={[s.label, { color: p.muted }]}>{W.name.nameLabel}</Text>
          <TextInput testID="wizard-name" defaultValue={n.name} onChangeText={(t) => setName(st, t)} maxLength={40} returnKeyType="done" style={[field, s.fieldText, s.nameField, { color: p.text }]} />
        </View>
        {n.aligned ? (
          <View style={s.group}>
            <Text style={[s.label, { color: p.muted }]}>{W.name.startLabel}</Text>
            <View testID="wizard-start-derived" style={[s.field, s.derived, { backgroundColor: p.surface2, borderColor: p.border }]}>
              <Text style={[s.fieldText, s.derivedText, { color: p.text }]}>{n.aligned.start}</Text>
              <Text style={[s.src, { color: p.muted }]}>{W.name.derived}</Text>
            </View>
            {copy(n.aligned.copy, [s.resolve, { color: n.aligned.warn ? p.signal : p.muted }], [s.resolveBold, { color: p.text }])}
            {n.aligned.pips && (
              <View testID="wizard-pips" style={s.pips}>
                {n.aligned.pips.map((c, i) => <View key={i} style={[s.pip, { backgroundColor: c === 'behind' ? p.border2 : c === 'open' ? p.signal : c === 'race' ? p.text : p.surface3 }]} />)}
              </View>
            )}
          </View>
        ) : (
          <View style={s.group}>
            <Text style={[s.label, { color: p.muted }]}>{W.name.startLabel}</Text>
            <Pressable testID="wizard-start" accessibilityRole="button" accessibilityLabel={W.name.startLabel + (n.startDate ? ', ' + dateFieldText(n.startDate) : '')} onPress={() => onDate({ value: st.draft.startDate || '', min: null, onChange: picked })} style={field}>
              <Text style={[s.fieldText, s.dateText, { color: p.text }]}>{dateFieldText(n.startDate) || ' '}</Text>
            </Pressable>
            {copy(n.resolveCopy, [s.resolve, { color: p.muted }], [s.resolveBold, { color: p.text }])}
          </View>
        )}
        <View testID="wizard-summary" style={[s.summary, { backgroundColor: p.surface }]}>
          <Text style={[s.summaryHead, { color: p.muted, backgroundColor: p.surface2, borderBottomColor: p.border }]}>{W.name.summary}</Text>
          {n.rows.map((r, i) => (
            <View key={r.k} style={[s.row, i < n.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
              <Text style={[s.rowKey, { color: p.muted }]}>{r.k}</Text>
              {iconLine(r.v, 15, p.text, [s.rowVal, { color: p.text }], s.bold, s.right)}
            </View>
          ))}
        </View>
      </>
    );
  }

  return (
    <View testID="wizard" accessibilityViewIsModal style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>
      <ScrollView testID="wizard-scroll" contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={[s.bar, { paddingTop: insets.top, backgroundColor: p.bg, borderBottomColor: p.border }]}>
          <Pressable testID="wizard-back" accessibilityRole="button" onPress={back} style={[s.back, { backgroundColor: p.surface, borderColor: p.border2 }]}><Text style={[s.backText, { color: p.text }]}>{W.back}</Text></Pressable>
          <View style={[s.progress, { backgroundColor: p.surface2 }]}><View testID="wizard-fill" style={[s.fill, { backgroundColor: p.accent, width: drawn.shell.fill as `${number}%` }]} /></View>
          <Text testID="wizard-count" style={[s.count, { color: p.muted }]}>{drawn.shell.label}</Text>
        </View>
        <View testID={'wizard-step-' + v.step} style={s.body}>{body}</View>
        <Pressable testID="wizard-next" accessibilityRole="button" onPress={next} style={({ pressed }) => [s.next, { backgroundColor: p.accent }, pressed && s.sunk, { marginBottom: 30 }]}>
          <Text style={[s.nextText, { color: p.onInk }]}>{drawn.shell.next}</Text>
        </Pressable>
      </ScrollView>
      {warn && (
        <View testID="length-warning" accessibilityViewIsModal style={[StyleSheet.absoluteFill, s.warnWrap]}>
          <View style={[s.warnCard, { backgroundColor: p.surface, borderColor: p.border2 }]}>
            <Text style={[s.warnKicker, { color: p.accent }]}>{LENGTH_WORDS.kicker}</Text>
            <Text accessibilityRole="header" style={[s.warnTitle, { color: p.text }]}>{LENGTH_WORDS.title(warn.weeks)}</Text>
            <Text style={[s.warnBody, { color: p.muted }]}>
              {warn.msg + '\n\n' + LENGTH_WORDS.body(warn.weeks).before}<Text style={[s.bold, { color: p.text }]}>{LENGTH_WORDS.body(warn.weeks).bold}</Text>{LENGTH_WORDS.body(warn.weeks).after}
            </Text>
            <View style={s.warnBtns}>
              <Pressable testID="length-back" accessibilityRole="button" onPress={() => { setWarn(null); render(); }} style={[s.warnBtn, s.warnBack, { borderColor: p.border2 }]}><Text style={[s.warnBtnText, { color: p.muted }]}>{LENGTH_WORDS.back}</Text></Pressable>
              <Pressable testID="length-build" accessibilityRole="button" onPress={() => { setWarn(null); go(); }} style={[s.warnBtn, s.warnBuild, { backgroundColor: p.accent }]}><Text style={[s.warnBtnText, { color: p.onInk }]}>{LENGTH_WORDS.build(warn.weeks)}</Text></Pressable>
            </View>
          </View>
        </View>
      )}
      {gen && (
        <Generating palette={p} first={gen.first} lines={gen.lines}
          build={() => { const r = finishGenerate(store, st.draft, Date.now(), report); done.current = r.prog; return r.ready; }}
          onLand={() => { if (done.current) onDone(done.current); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The screen is one page that scrolls whole (.screen, min-height the window): the bar, the body taking what is left, the last button at the foot.
  page: { flexGrow: 1 },
  // .wizard-bar
  bar: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  backText: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: -PX },
  progress: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  count: { fontFamily: DISPLAY, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  // .wizard-body: 24 and 20 around, 20 between its pieces.
  body: { flexGrow: 1, paddingVertical: 24, paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: DISPLAY, fontWeight: '700', marginTop: -PX },
  subtitle: { fontFamily: TEXT, fontSize: 14, lineHeight: 21, marginTop: -12 - PX },
  label: { fontFamily: DISPLAY, fontSize: 13, lineHeight: 17, fontWeight: '700', marginTop: -PX },
  mb8: { marginBottom: 8 }, mb16: { marginBottom: 16 }, mb20: { marginBottom: 20 }, mt6: { marginTop: 6 },
  col10: { gap: 10 }, col8: { gap: 8 },
  grow: { flex: 1 }, noShrink: { flexShrink: 0 },
  bold: { fontWeight: '700' },
  // .option-card
  option: { borderWidth: EDGE, borderRadius: 16, padding: 14 },
  optionWide: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  optionExp: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  optionLabel: { fontFamily: DISPLAY, fontSize: 15, lineHeight: 20, fontWeight: '700', marginTop: -PX },
  optionDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 3 - PX },
  optionDetail: { fontFamily: TEXT, fontSize: 11, lineHeight: 16, marginTop: 6 - PX },
  ages: { flexDirection: 'row', gap: 8 },
  age: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  ageIcon: { marginBottom: 4 },
  units: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  unit: { flex: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 20 },
  unitText: { fontFamily: DISPLAY, fontSize: 13, lineHeight: 17, fontWeight: '700', marginTop: -PX },
  hints: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'transparent' },
  hint: { fontFamily: TEXT, fontSize: 12, lineHeight: 21, marginBottom: -PX },
  // .cardio-type-card
  type: { borderWidth: EDGE, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeSmall: { paddingVertical: 10, paddingHorizontal: 14 },
  // An add-on row's icon sits in a line of the row's text in WebKit, which stands 0.86 under the icon's own 22.
  typeIconSmall: { height: 22.86 },
  typeName: { fontFamily: DISPLAY, fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: -PX },
  typeNameSmall: { fontSize: 14, lineHeight: 19 },
  typeDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 2 - PX },
  check: { fontSize: 16, lineHeight: 21 },
  // The cardio goals' sport cards.
  sport: { borderWidth: EDGE, borderRadius: 16, overflow: 'hidden' },
  sportHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  sportName: { fontFamily: DISPLAY, fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: -PX },
  sportDesc: { fontFamily: TEXT, fontSize: 11, lineHeight: 15, marginTop: 2 - PX },
  sportCheck: { fontSize: 20, lineHeight: 26 },
  sportBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1 },
  goals: { paddingTop: 10, gap: 6 },
  goal: { borderWidth: EDGE, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  // The strength path's add-on.
  addOn: { marginTop: 12, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  addOnHead: { fontFamily: DISPLAY, fontSize: 11, lineHeight: 15, fontWeight: '700', marginBottom: -PX, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1 },
  addOnBody: { paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
  // .day-grid, .day-toggle
  dayGrid: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, minHeight: 44, borderWidth: EDGE, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  // A line as tall as its type: iOS sets the letters a point higher in it than WebKit does, so they are let down one.
  dayText: { fontFamily: DISPLAY, fontSize: 12, lineHeight: 12, fontWeight: '700', marginTop: -PX, top: 1 },
  dayMark: { fontFamily: DISPLAY, fontSize: 9, lineHeight: 12, fontWeight: '700', marginTop: 2 - PX },
  dayLock: { marginTop: 2 },
  legend: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 6 - PX },
  floor: { marginTop: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  floorTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  // WebKit sets the lock on the line's own base, a point under the row's middle.
  floorIcon: { top: 1 },
  floorTitle: { fontFamily: TEXT, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: -PX },
  floorText: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginTop: -PX },
  advisories: { marginTop: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, gap: 8 },
  advisory: { fontFamily: TEXT, fontSize: 12, lineHeight: 18 },
  iconLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flexShrink: 1 },
  left: { justifyContent: 'flex-start' }, right: { justifyContent: 'flex-end' },
  // .input-group, .input-field
  group: { gap: 6 },
  field: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  fieldText: { fontFamily: TEXT, fontSize: 16, lineHeight: 21 },
  dateText: { textAlign: 'center', marginTop: -PX },
  derivedText: { marginTop: -PX },
  // WebKit's field stands 47 high (12 and 12 around a line of 21, and its edges): a text input is given the same.
  // iOS sets a text input's letters 2.3 lower in that height than WebKit does: the room under them takes it back.
  nameField: { height: 47, paddingTop: 0, paddingBottom: 4.67 },
  // .input-field.derived also takes detail-sheet.css's .derived: 2 over it, 10 inside its top, 10 between its two.
  derived: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2, paddingTop: 10, gap: 10 },
  src: { fontFamily: DISPLAY, fontSize: 12, lineHeight: 16 },
  // .start-resolve, .start-pips
  resolve: { fontFamily: TEXT, fontSize: 12, lineHeight: 18, marginTop: 2 - PX },
  resolveBold: { fontWeight: '700' },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
  pips: { flexDirection: 'row', gap: 4, marginTop: 8 },
  pip: { flex: 1, height: 6, borderRadius: 2 },
  // .summary-block
  // .summary-block keeps its 1 edge, drawn in no colour (look.css).
  summary: { borderRadius: 24, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden', marginTop: 4 },
  summaryHead: { fontFamily: DISPLAY, fontSize: 13, lineHeight: 17, fontWeight: '700', marginBottom: -PX, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 9, paddingHorizontal: 14, gap: 12 },
  rowKey: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, flexShrink: 0, marginTop: -PX },
  rowVal: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, fontWeight: '500', textAlign: 'right', marginTop: -PX },
  // .wizard-next
  next: { marginHorizontal: 20, padding: 15, borderRadius: 999, alignItems: 'center' },
  sunk: { transform: [{ scale: 0.98 }] },
  nextText: { fontFamily: DISPLAY, fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: -PX },
  // The length's pop-up (showLengthWarning).
  warnWrap: { backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  warnCard: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 16, padding: 24 },
  warnKicker: { fontFamily: DISPLAY, fontSize: 11, lineHeight: 15, fontWeight: '700', marginBottom: 10 - PX },
  warnTitle: { fontFamily: DISPLAY, fontSize: 22, lineHeight: 28, fontWeight: '700', marginBottom: 12 - PX },
  warnBody: { fontFamily: TEXT, fontSize: 13, lineHeight: 20, marginBottom: 20 - PX },
  warnBtns: { flexDirection: 'row', gap: 10 },
  warnBtn: { padding: 12, borderRadius: 999, alignItems: 'center' },
  warnBack: { flex: 1, borderWidth: 1 },
  warnBuild: { flex: 2 },
  warnBtnText: { fontFamily: DISPLAY, fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: -PX },
});
