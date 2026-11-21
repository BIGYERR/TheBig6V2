// The generating screen in the Expo app (MIGRATION.md phase 3, row 6), drawn as today's draws it (the Angular
// generating-screen.ts over overlays-components.css .generate-*): the lifting figure, Building Your Program, and the
// line under it. The line and the times are the page's (wizard-writes.ts GENERATING, doGenerate): the length at once,
// six lines 380 ms apart, the build at 2,400 ms, the ready line, and This Week 600 ms after it. A build that throws
// leaves the screen up with the error's words, as the page does.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { FIGURE, figureAt } from './generating-figure';
import { GENERATING } from './wizard-writes';

export function Generating({ palette: p, first, lines, build, onLand }: {
  palette: Palette;
  /** The line that stands at once, and the six that follow (wizard-writes.ts beginGenerate). */
  first: string; lines: string[];
  /** The build (finishGenerate): the ready line. It may throw. */
  build: () => string;
  /** 600 ms after the ready line: This Week. */
  onLand: () => void;
}) {
  const [line, setLine] = useState(first);
  const [ms, setMs] = useState(0);
  const calls = useRef({ build, onLand });
  calls.current = { build, onLand };
  useEffect(() => {
    let i = 0;
    const tick = setInterval(() => { if (i < lines.length) setLine(lines[i++]!); }, GENERATING.tickMs);
    let land: ReturnType<typeof setTimeout> | null = null;
    const built = setTimeout(() => {
      clearInterval(tick);
      let ready: string;
      try { ready = calls.current.build(); } catch (err) {
        console.error('buildProgram error:', err);
        setLine(GENERATING.error(err instanceof Error ? err.message : String(err)));
        return;
      }
      setLine(ready);
      land = setTimeout(() => calls.current.onLand(), GENERATING.landMs);
    }, GENERATING.buildMs);
    return () => { clearInterval(tick); clearTimeout(built); if (land) clearTimeout(land); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The figure, frame by frame, timed on the frame's own clock.
  useEffect(() => {
    let frame = 0, start = -1;
    const step = (at: number): void => { if (start < 0) start = at; setMs(at - start); frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);
  const f = figureAt(ms);
  const s = styles;
  return (
    <View testID="generating" accessibilityViewIsModal style={[StyleSheet.absoluteFill, s.root, { backgroundColor: p.bg }]}>
      <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={s.figure}>
        <Svg width={FIGURE.size} height={FIGURE.size} viewBox={'0 0 ' + FIGURE.box + ' ' + FIGURE.box} fill="none" stroke={p.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <G transform={'translate(0 ' + f.dy + ')'}>
            <Line x1={17} y1={8} x2={47} y2={8} />
            <Line x1={18} y1={3.5} x2={18} y2={12.5} />
            <Line x1={46} y1={3.5} x2={46} y2={12.5} />
            <Line x1={21.5} y1={5} x2={21.5} y2={11} />
            <Line x1={42.5} y1={5} x2={42.5} y2={11} />
            <Path d="M32 19 L23 8" />
            <Path d="M32 19 L41 8" />
            <Circle cx={32} cy={14.5} r={3.4} />
            <Line x1={32} y1={18} x2={32} y2={36} />
          </G>
          <Path d={f.left} />
          <Path d={f.right} />
          <G stroke="none" fill={p.signal}>
            {f.sparks.map((k, i) => <Circle key={i} cx={k.cx} cy={k.cy} r={k.r} opacity={k.opacity} />)}
          </G>
        </Svg>
      </View>
      <Text accessibilityRole="header" style={[s.title, { color: p.text }]}>{GENERATING.title}</Text>
      <Text testID="generating-line" accessibilityLiveRegion="polite" style={[s.sub, { color: p.muted }]}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // .generate-screen: padding 40 20, everything centred, 16 between the pieces.
  root: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 16 },
  // The figure carries its own 18 under it (margin 0 auto 18).
  figure: { marginBottom: 18 },
  // WebKit's lines: 24 bold stands 31 high, 13 stands 17.
  title: { fontFamily: DISPLAY, fontSize: 24, lineHeight: 31, fontWeight: '700', textAlign: 'center' },
  sub: { fontFamily: TEXT, fontSize: 13, lineHeight: 17, textAlign: 'center' },
});
