// The Run recorder of the Expo app (MIGRATION.md phase 4; D267 P-GPSTEST, D293, D296, docs/decisions/gps-recording.md),
// drawn as today's (frontends/app/src/app/screens/run-recorder/run-recorder.ts, element for element): Back, the when
// line and the title on the header band; the run's workout when a run card opened it; the GPS line; the clock; Miles,
// Avg pace, This mile; Climb, Cadence, Steps (D296's second row); the buttons; Ran without the phone? before Start
// from a run card; the message; the splits, each with its climb; the past runs.
// The rules are recorder-screen.ts, the words run-recorder-model.ts (today's file). This file draws, keeps the clock's
// second, reads the run back when the app returns to the front, hands a GPX to the share sheet (the one file it
// writes, into this app's own cache) and asks the system's question before a run is deleted.
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, Share as SystemShare, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Note, Opt, Row, Seg } from '../bugs/rows';
import type { CardioCardView } from '../day-detail/cardio-card-model';
import { Cardio } from '../day-detail/SessionSheet';
import { DISPLAY, type Palette, TEXT } from '../theme';
import type { AppGps } from './gps-bridge';
import {
  type RecorderDeps, type RecorderHeading, type Share, newRecorderState, offersHandLog, recorderBack, recorderDrawn, recorderGone, recorderOpenRun, recorderOpened,
  recorderOver, recorderPress, recorderResync, recorderTitle,
} from './recorder-screen';
import { BUTTON_LABEL, RECORDER_COPY } from './run-recorder-model';

/** The app's name over the system's question, as today's confirm() carries the app's own. */
export const ASK_TITLE = 'IA Next';

export interface RunRecorderProps {
  palette: Palette;
  gps: AppGps;
  /** Opened from a day's run card (D272, D276): its when line and the run's name, in place of the test bench's. */
  heading: RecorderHeading | null;
  /** The run's workout, drawn above the clock when Record run opens it from a run card (D278 item 2). */
  workout: CardioCardView | null;
  onClose: () => void;
  /** Ran without the phone? (D272's open item): the day's hand log, offered before Start. */
  onHandLog: () => void;
}

export function RunRecorder({ palette: p, gps, heading, workout, onClose, onHandLog }: RunRecorderProps) {
  const insets = useSafeAreaInsets();
  const st = useRef(newRecorderState()).current;
  const [, setDraws] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const way = useRef({ onClose });
  way.current = { onClose };
  // A call the module answers after the screen has gone changes what the screen held and draws nothing.
  const shown = useRef(true);
  const deps = useRef<RecorderDeps | null>(null);
  if (!deps.current) {
    const share: Share = (fileName, text, done, fail) => {
      void (async () => {
        try {
          const file = new File(Paths.cache, fileName);
          file.create({ overwrite: true });
          await file.write(text);
          await SystemShare.share({ url: file.uri });
          done();
        } catch {
          fail();
        }
      })();
    };
    deps.current = {
      gps,
      share,
      ask: (text, yes) => Alert.alert(ASK_TITLE, text, [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: yes }]),
      draw: () => { if (shown.current) setDraws((n) => n + 1); },
      closed: () => way.current.onClose(),
    };
  }
  const d = deps.current;

  useEffect(() => {
    shown.current = true;
    recorderOpened(st, d);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    // Today's visibilitychange: the events stop while the app is behind, and the file has every line.
    const front = AppState.addEventListener('change', (s) => { if (s === 'active') recorderResync(st, d); });
    return () => {
      shown.current = false;
      clearInterval(tick);
      front.remove();
      gps.quiet();
      recorderGone(d);
    };
  }, [st, d, gps]);

  const view = recorderDrawn(st, now);
  const on = (a: number): string => 'rgba(255,255,255,' + a + ')';
  const big = [[W.miles, view.distance], [W.avg, view.avgPace], [W.mile, view.milePace]] as const;
  const small = [[W.climb, view.climb], [W.cadence, view.cadence], [W.steps, view.steps]] as const;
  return (
    <View testID="run-recorder" accessibilityViewIsModal accessibilityLabel={recorderTitle(heading)} style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>
      {/* The header's band is dark by day and by night, so the clock over it is light while the recorder is up. */}
      <StatusBar style="light" />
      <View testID="rec-header" style={[s.header, { backgroundColor: p.bandHeader, borderBottomColor: p.border, paddingTop: insets.top }]}>
        <Pressable testID="rec-back" accessibilityRole="button" hitSlop={8} onPress={() => recorderBack(st, d)} style={[s.back, { backgroundColor: p.surface, borderColor: p.border2 }]}>
          <Text style={[s.backText, { color: p.onBand }]}>‹ Back</Text>
        </Pressable>
        <View>
          <Text testID="rec-over" style={[s.over, { color: on(0.6) }]}>{recorderOver(st, heading)}</Text>
          <Text testID="rec-title" accessibilityRole="header" style={[s.title, { color: p.onBand }]}>{recorderTitle(heading)}</Text>
        </View>
      </View>
      <ScrollView testID="rec-scroll" contentContainerStyle={[s.body, { paddingBottom: 20 + insets.bottom }]}>
        {workout && <View testID="rec-workout"><Cardio c={workout} p={p} /></View>}
        <Note id="rec-gps" palette={p}>{view.gps}</Note>
        <Text testID="rec-time" style={[s.time, { color: p.text }]}>{view.time}</Text>
        <View style={s.figures}>
          {big.map(([label, value]) => (
            <View key={label} style={s.figure}>
              <Text style={[s.label, { color: p.muted }]}>{label}</Text>
              <Text testID={'rec-' + label.toLowerCase().replace(' ', '-')} style={[s.big, { color: p.text }]}>{value}</Text>
            </View>
          ))}
        </View>
        <View style={s.figures}>
          {small.map(([label, value]) => (
            <View key={label} style={s.figure}>
              <Text style={[s.label, { color: p.muted }]}>{label}</Text>
              <Text testID={'rec-' + label.toLowerCase()} style={[s.small, { color: p.text }]}>{value}</Text>
            </View>
          ))}
        </View>
        <Seg id="rec-buttons">
          {view.buttons.map((b) => (
            <Pressable key={b} testID={'rec-' + b} accessibilityRole="button" onPress={() => recorderPress(st, d, b)} style={[s.press, { borderColor: p.border2 }]}>
              <Text style={[s.pressText, { color: p.muted }]}>{BUTTON_LABEL[b]}</Text>
            </Pressable>
          ))}
        </Seg>
        {offersHandLog(st, heading) && (
          <Pressable testID="rec-nophone" accessibilityRole="button" onPress={onHandLog} style={s.nophone}>
            <Text style={[s.nophoneText, { color: p.muted, textDecorationColor: p.border2 }]}>{RECORDER_COPY.noPhone}</Text>
          </Pressable>
        )}
        {st.message !== '' && <Note id="rec-message" palette={p}>{st.message}</Note>}
        {view.splits.length > 0 && (
          <Row id="rec-splits" label={W.splits} palette={p}>
            {view.splits.map((sp) => (
              <View key={sp.mile} style={s.split}>
                <Text style={[s.splitText, { color: p.text }]}>{'Mile ' + sp.mile}</Text>
                <Text style={[s.splitText, { color: p.text }]}>{sp.time + (sp.climb ? GAP + sp.climb : '')}</Text>
              </View>
            ))}
          </Row>
        )}
        {st.past.length > 0 && (
          <Row id="rec-past" label={W.past} palette={p}>
            {st.past.map((r) => (
              <Pressable key={r.id} testID={'rec-run-' + r.id} accessibilityRole="button" onPress={() => recorderOpenRun(st, d, r.id)} style={[s.run, { borderColor: p.border2 }]}>
                <Text style={[s.runText, { color: p.muted }]}>{r.label + ' · ' + r.line}</Text>
              </Pressable>
            ))}
          </Row>
        )}
      </ScrollView>
    </View>
  );
}

/** Between a split's time and its climb: two spaces that do not break, as today's template types them. */
const GAP = String.fromCharCode(160, 160);

/** The labels today's template types over each figure and each list. */
export const W = { miles: 'Miles', avg: 'Avg pace', mile: 'This mile', climb: 'Climb', cadence: 'Cadence', steps: 'Steps', splits: 'Splits', past: 'Past runs' } as const;

/** The Bugs tab's Run recorder row (bug-report.ts, D267): its note and Open. */
export function RecorderRow({ palette: p, onOpen }: { palette: Palette; onOpen: () => void }) {
  return (
    <Row id="recorder-row" label={RECORDER_COPY.row} palette={p}>
      <Note palette={p}>{RECORDER_COPY.rowNote}</Note>
      <Seg>
        <Opt id="recorder-open" label="Open" palette={p} onPress={onOpen} />
      </Seg>
    </Row>
  );
}

const s = StyleSheet.create({
  // Every line below was read beside today's markup drawn by WebKit in the simulator's Safari, band by band
  // (tests/measure/native-run-recorder_look.md): WebKit lays each line taller than iOS draws it, and the
  // difference is given back here where it was measured.
  // .detail-header under session-sheet.css: the band, 20 at the sides, 13 under, a rule; a block, so Back stands over the names.
  header: { paddingHorizontal: 20, paddingBottom: 14.7, borderBottomWidth: 1, alignItems: 'flex-start' },
  // .back-btn under look.css: a pill of the card's ground, a hairline, 8 by 14, 14 in the display face. WebKit's pill is 37 tall.
  // By day the pill is white and so is its word, as today's is (the band sets the type's colour and not the pill's ground).
  back: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  backText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  // .detail-day-name under look.css (13, 600) and .detail-day-title (22, 700).
  over: { fontFamily: TEXT, fontSize: 13, fontWeight: '700' },
  title: { fontFamily: DISPLAY, fontSize: 22, fontWeight: '700', marginTop: 1.7 },
  // .detail-body under session-sheet.css: 16 above and at the sides, 20 under, 14 between its parts.
  body: { paddingTop: 16, paddingHorizontal: 16, gap: 14 },
  // The clock: 56 on a line of 56. WebKit sets the figures 5 lower in that line than iOS does.
  time: { fontFamily: DISPLAY, fontSize: 56, fontWeight: '700', lineHeight: 56, paddingTop: 5, marginBottom: -5.6, fontVariant: ['tabular-nums'] },
  figures: { flexDirection: 'row', gap: 8 },
  // A .look-row with no rule and no room above it: its label, 8, its figure.
  figure: { flex: 1, gap: 8 },
  label: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', paddingBottom: 1.5 },
  big: { fontFamily: DISPLAY, fontSize: 24, fontWeight: '700', paddingBottom: 2, fontVariant: ['tabular-nums'] },
  small: { fontFamily: DISPLAY, fontSize: 18, fontWeight: '700', paddingBottom: 0.7, fontVariant: ['tabular-nums'] },
  // .look-opt with the template's own padding of 14 and type of 15: 50 tall in WebKit.
  press: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, padding: 14 },
  pressText: { fontFamily: DISPLAY, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  // .rec-nophone (week-view.css): centred, 10 by 4, at least 44 tall, 14 at 600, underlined 3 under in the second border.
  nophone: { alignSelf: 'center', minHeight: 44, paddingVertical: 10, paddingHorizontal: 4, justifyContent: 'center' },
  nophoneText: { fontFamily: TEXT, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  split: { flexDirection: 'row', justifyContent: 'space-between' },
  splitText: { fontFamily: TEXT, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
  // A past run: .look-opt with its words at the left, hard against the pill's edge as today's are (41 tall).
  run: { borderWidth: 1, borderRadius: 999, paddingVertical: 11 },
  runText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', textAlign: 'left', paddingBottom: 1.5 },
});
