// The Bugs tab of the Expo app (MIGRATION.md phase 3, row 7, the second session), drawn as today's
// (frontends/app/src/app/screens/bug-report/bug-report.ts, element for element): the top bar, the bug report, then
// the rows Look (D261), Your data (D264; the file's kind this app's own, D297) and Engine (D286), and the build's
// label. The Run recorder's row is phase 4's. D289's words stay under Your data until the cutover.
// The words and the reads are bugs-screen.ts, the writes bugs-writes.ts. This file draws, picks the file and hands
// the saved one to the share sheet: the one file this app writes, into its own cache, and it deletes none.
import { useRef, useState } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSION } from '@ia/core';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { EngineCheck } from '../EngineCheck';
import { type EngineState, newEngineState } from '../engine-check-state';
import { SWIFT_ANSWER } from '../native-spike';
import { swiftLine } from '../spike-line';
import { DISPLAY, type Palette, TEXT } from '../theme';
import { Glow } from '../this-week/marks';
import { BUGS_WORDS as W, type DataBlock, type Look, OWN_COPY, betaContext, buildLabel, cancelLoad, choose, newDataBlock } from './bugs-screen';
import { BACKUP_TOASTS, type BugForm, loadIt, newBugForm, saveBackup, sendBug } from './bugs-writes';
import { Note, Opt, Row, Seg } from './rows';

/** Which JavaScript engine runs this bundle: Hermes sets HermesInternal on the global object. */
function engineName(): string {
  return typeof (globalThis as { HermesInternal?: unknown }).HermesInternal === 'object' ? 'Hermes' : 'another engine';
}

/**
 * What the tab keeps while another tab is open, for the app's life: today's screen stays in the page behind the
 * others, so the report being typed and its line, the file waiting on its question, and the engine check, which
 * runs on, are all there when the athlete comes back. A backup loaded starts the app afresh, and these with it.
 */
export interface BugsState { form: BugForm; block: DataBlock; engine: EngineState }
export const newBugsState = (): BugsState => ({ form: newBugForm(), block: newDataBlock(), engine: newEngineState() });

export interface BugsProps {
  palette: Palette;
  state: BugsState;
  store: StateStore;
  /** The look as stored (the page's data-theme): which of the three buttons is drawn on. */
  look: Look;
  onLook: (look: Look) => void;
  say: (text: string) => void;
  /** The program in hand and the week This Week holds (the page's activeProg and currentWeek), for the report. */
  inHand: () => { program: { name?: string; goal?: string; id?: string } | null; week: number | string };
  /** A backup loaded: the app starts afresh, as today's page reloads. */
  onAfresh: () => void;
}

export function Bugs({ palette: p, state, store, look, onLook, say, inHand, onAfresh }: BugsProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [headH, setHeadH] = useState(0);
  const [, setDraws] = useState(0);
  const draw = (): void => setDraws((n) => n + 1);
  const { form, block, engine } = state;
  const [focused, setFocused] = useState(false);
  const busy = useRef(false);

  const send = async (): Promise<void> => {
    if (form.sending) return;
    const toast = await sendBug(form, () => {
      const h = inHand();
      return betaContext({
        version: VERSION, time: new Date().toISOString(), os: String(Platform.Version), engine: engineName(), swift: swiftLine(SWIFT_ANSWER),
        width, height, program: h.program, week: h.week,
      });
    }, (url, init) => fetch(url, init), draw);
    if (toast) say(toast);
  };

  const save = async (): Promise<void> => {
    if (busy.current) return;
    const r = saveBackup(store, VERSION, new Date());
    if (r.how === 'empty') { say(r.toast); return; }
    busy.current = true;
    try {
      const file = new File(Paths.cache, r.name);
      file.create({ overwrite: true });
      await file.write(r.text);
      // The share sheet is its own confirmation, and a cancel is silent (data-backup.ts).
      await Share.share({ url: file.uri });
    } catch {
      say(BACKUP_TOASTS.failed);
    } finally {
      busy.current = false;
    }
  };

  const load = async (): Promise<void> => {
    if (busy.current) return;
    busy.current = true;
    try {
      const got = await getDocumentAsync({ type: ['application/json', 'public.json', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (got.canceled || !got.assets[0]) return;
      let text: string | null = null;
      try { text = await new File(got.assets[0].uri).text(); } catch { /* a file that cannot be read is not a backup */ }
      choose(block, text);
      draw();
    } catch {
      /* the picker closed with no file */
    } finally {
      busy.current = false;
    }
  };
  const cancel = (): void => { cancelLoad(block); draw(); };
  const tapLoadIt = (): void => {
    const r = loadIt(block, store);
    if (r.toast) say(r.toast);
    if (r.afresh) onAfresh(); else draw();
  };

  const tint = form.status.color === 'var(--green)' ? p.green : form.status.color === 'var(--red)' ? p.red : p.muted;
  return (
    <View testID="bugs" style={{ flex: 1, backgroundColor: p.bg }}>
      {/* Today's Bugs screen scrolls whole, its top bar with it (seen beside today's app on the simulator), so the
          top bar stands inside the scroll here, where the Programs tab holds its own still. */}
      <ScrollView testID="bugs-scroll" contentContainerStyle={{ paddingBottom: 40 + 97 + insets.bottom }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
      {/* The glow (look.css): painted behind the top bar and again, in the same box, behind the top of the body. */}
      <View testID="bugs-top" onLayout={(e: LayoutChangeEvent) => setHeadH(e.nativeEvent.layout.height)} style={[s.top, { paddingTop: insets.top }]}>
        <Glow width={width} height={headH} top={0} rgb={p.signalRgb} alpha={p.glowAlpha} />
        <Text style={[s.app, { color: p.muted }]}>{W.app}</Text>
        <Text accessibilityRole="header" style={[s.screen, { color: p.text }]}>{W.title}</Text>
      </View>
      <View testID="bugs-body" style={s.body}>
        <Glow width={width} height={Math.max(0, 200 - headH)} top={headH} rgb={p.signalRgb} alpha={p.glowAlpha} />
        <Text style={[s.intro, { color: p.muted }]}>{W.intro}</Text>
        <TextInput testID="bug-text" multiline value={form.text} onChangeText={(t) => { form.text = t; draw(); }} placeholder={W.placeholder} placeholderTextColor={p.muted}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} textAlignVertical="top"
          style={[s.field, { backgroundColor: p.surface, borderColor: focused ? 'rgba(' + p.inkRgb + ',0.55)' : p.border2, color: p.text }]} />
        <Pressable testID="bug-send" accessibilityRole="button" accessibilityState={{ disabled: form.sending }} disabled={form.sending} onPress={send}
          style={[s.send, { backgroundColor: p.accent, opacity: form.sending ? 0.6 : 1 }]}>
          <Text style={[s.sendText, { color: p.onInk }]}>{form.sending ? W.sending : W.send}</Text>
        </Pressable>
        <Text testID="bug-status" accessibilityLiveRegion="polite" style={[s.status, { color: tint }]}>{form.status.text}</Text>
        <Text style={[s.attached, { color: p.muted }]}>{W.attached}</Text>
        <Row id="look-row" label={W.look} palette={p}>
          <Seg>
            <Opt id="look-auto" label={W.auto} on={look === 'auto'} palette={p} onPress={() => onLook('auto')} />
            <Opt id="look-day" label={W.day} on={look === 'day'} palette={p} onPress={() => onLook('day')} />
            <Opt id="look-night" label={W.night} on={look === 'night'} palette={p} onPress={() => onLook('night')} />
          </Seg>
          <Note palette={p}>{W.lookNote}</Note>
        </Row>
        <Row id="data-row" label={W.data} palette={p}>
          <Note palette={p}>{W.dataNote}</Note>
          <Note id="backup-own-copy" palette={p}>{OWN_COPY}</Note>
          <Seg>
            <Opt id="backup-save" label={W.save} palette={p} onPress={save} />
            <Opt id="backup-load" label={W.load} palette={p} onPress={load} />
          </Seg>
          <Note id="backup-msg" palette={p}>{block.message}</Note>
          {block.pending && (
            <Seg id="backup-ask">
              <Opt id="backup-load-it" label={W.loadIt} palette={p} onPress={tapLoadIt} />
              <Opt id="backup-cancel" label={W.cancel} palette={p} onPress={cancel} />
            </Seg>
          )}
        </Row>
        <EngineCheck palette={p} state={engine} />
        <Text testID="bug-version" style={[s.version, { color: p.muted }]}>{buildLabel(VERSION)}</Text>
      </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // The page's top bar (look.css .top-bar), as the Programs tab draws it (Programs.tsx has the measure of each line).
  top: { paddingHorizontal: 20, paddingBottom: 16, overflow: 'hidden' },
  app: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', paddingBottom: 2.1 },
  // The screen's name stood a pixel low beside today's on the simulator: 4.5 above it here, where the Programs tab has 4.9.
  screen: { fontFamily: DISPLAY, fontSize: 40, fontWeight: '700', letterSpacing: -1.6, lineHeight: 42, marginTop: 4.5, marginBottom: -2.9 },
  // The screen's body: 16 above, 20 at the sides, 14 between its parts, 40 under them (and the tab bar's room).
  // Line heights, measured on the simulator beside today's app (0.255.2, the same screen but for the Engine row):
  // WebKit lays a line whose height the CSS gives as a fraction at the whole point under it (13 on 1.6 at 20, 11 on
  // 1.5 at 16, 13 on 1.5 at 19), and a line left to the face at the whole point under 1.34 times its size (20 at 15).
  body: { paddingTop: 16, paddingHorizontal: 20, gap: 14 },
  intro: { fontFamily: TEXT, fontSize: 13, lineHeight: 20 },
  // .input-field (wizard.css with look.css): the card's ground, a hairline, 12 at the corners, 16 on a line of 1.5.
  field: { fontFamily: TEXT, fontSize: 16, lineHeight: 24, minHeight: 160, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  send: { borderRadius: 999, padding: 14, alignItems: 'center' },
  sendText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', paddingBottom: 1.8 },
  status: { fontFamily: TEXT, fontSize: 13, lineHeight: 19, minHeight: 20 },
  attached: { fontFamily: TEXT, fontSize: 11, lineHeight: 16, opacity: 0.8 },
  // --font-mono on an iPhone draws in Menlo (seen beside today's app: no Geist Mono there, and the system's own
  // monospace is wider). WebKit sets the line 2 lower than iOS does, so the 4 above it is 6 here.
  version: { fontFamily: 'Menlo', fontSize: 11, opacity: 0.55, textAlign: 'center', paddingTop: 6 },
});
