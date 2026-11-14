// This Week's marks, as today's screen draws them (frontends/app/src/app/screens/week-view/week-view.ts and marks/
// wildcard.ts): the same paths, sizes and stroke widths, on react-native-svg. Each takes its colour, as the web's
// take currentColor.
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';

import { DISPLAY } from '../theme';

interface Mark { color: string; size?: number }
const STROKE = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** The race row's flag. */
export function Flag({ color, size = 22 }: Mark) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={1.8}><Path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Svg>;
}

/** The calendar: the Program start box, and the This Week tab. */
export function Calendar({ color, size = 20 }: Mark) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2}>
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} /><Line x1={16} y1={2} x2={16} y2={6} /><Line x1={8} y1={2} x2={8} y2={6} /><Line x1={3} y1={10} x2={21} y2={10} />
    </Svg>
  );
}

/** A done day's check, and a done card's. */
export function Check({ color, size = 16 }: Mark) {
  return <Svg width={size} height={size} viewBox="0 0 16 16" {...STROKE} stroke={color} strokeWidth={2.2}><Path d="M3 8.5l3.2 3L13 4.5" /></Svg>;
}

/** The Skipped pill's cross. */
export function Cross({ color, size = 11 }: Mark) {
  return <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"><Path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></Svg>;
}

/** The lift card's dumbbell, in two halves; broken on a skipped lift, each half drooping at the break (D284). */
export function Dumbbell({ color, size = 18, broken = false }: Mark & { broken?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2} style={{ overflow: 'visible' }}>
      <G transform={broken ? 'translate(-2 1.2) rotate(22 6 12)' : undefined}><Path d="M3 10v4M6 8v8M9 10v4M9 12h3" /></G>
      <G transform={broken ? 'translate(2 1.2) rotate(-22 18 12)' : undefined}><Path d="M15 10v4M18 8v8M21 10v4M15 12h-3" /></G>
    </Svg>
  );
}

/** The second card's runner. */
export function Runner({ color, size = 18 }: Mark) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2}>
      <Circle cx={14} cy={4.5} r={1.8} /><Path d="M8 21l3-6 3 3v-6l-4-2-3 3M14 12l3 2h3" />
    </Svg>
  );
}

/** The deck button's play mark. */
export function Play({ color, size = 14 }: Mark) {
  return <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}><Path d="M4 2.5v11l9-5.5z" /></Svg>;
}

/** Record run's dot in its ring. */
export function RecDot({ color }: Mark) {
  return (
    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

/** Random Workout's die. */
export function Die({ color, size = 15 }: Mark) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2}>
      <Rect width={18} height={18} x={3} y={3} rx={2} /><Path d="M16 8h.01" /><Path d="M8 8h.01" /><Path d="M8 16h.01" /><Path d="M16 16h.01" /><Path d="M12 12h.01" />
    </Svg>
  );
}

/** Traveling?'s bag. */
export function Bag({ color, size = 15 }: Mark) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2}>
      <Path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><Path d="M8 10V6a4 4 0 0 1 8 0v4" /><Path d="M8 18h8" /><Path d="M8 14h8" />
    </Svg>
  );
}

/** The Bugs tab's bug (the tab bar, frames/tab-bar.ts). */
export function Bug({ color, size = 22 }: Mark) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...STROKE} stroke={color} strokeWidth={2}>
      <Path d="m8 2 1.88 1.88" /><Path d="M14.12 3.88 16 2" /><Path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <Path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><Path d="M12 20v-9" />
      <Path d="M6.53 9C4.6 8.8 3 7.1 3 5" /><Path d="M6 13H2" /><Path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <Path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" /><Path d="M22 13h-4" /><Path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </Svg>
  );
}

/** An icon core draws as markup (asyIcon), in a colour: the taper pill's flag, the Wildcard's flame. */
export function CoreIcon({ xml, color }: { xml: string; color: string }) {
  // The web's inline style means nothing here; the rest of the markup is the icon as core wrote it.
  return <SvgXml xml={xml.replace(/ style="[^"]*"/, '')} color={color} />;
}

/** The Wildcard mark: the flame and the W, signal orange (marks/wildcard.ts). */
export function WildcardMark({ color, size = 14 }: Mark) {
  return (
    <View accessibilityLabel="Wildcard done" style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      <CoreIcon xml={asyIcon('flame', size)} color={color} />
      <Text style={{ fontFamily: DISPLAY, fontWeight: '700', fontSize: 11, lineHeight: 11, color }}>W</Text>
    </View>
  );
}

/**
 * The glow behind a screen's top (the Track look): the web's radial-gradient(150% 455px at 50% -130px, glow,
 * transparent 68%), drawn over a box `width` by `height` whose top sits `top` below the screen's top.
 */
export function Glow({ width, height, top, rgb, alpha }: { width: number; height: number; top: number; rgb: string; alpha: number }) {
  if (width <= 0 || height <= 0) return null;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow" gradientUnits="userSpaceOnUse" cx={width / 2} cy={-130 - top} rx={width * 1.5} ry={455} fx={width / 2} fy={-130 - top}>
          <Stop offset={0} stopColor={'rgb(' + rgb + ')'} stopOpacity={alpha} />
          <Stop offset={0.68} stopColor={'rgb(' + rgb + ')'} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#glow)" />
    </Svg>
  );
}

/** The fade over the week titles' right end: the web's linear-gradient(90deg, transparent, bg 55%). */
export function Fade({ width, height, color }: { width: number; height: number; color: string }) {
  if (height <= 0) return null;
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', right: 0, top: 0 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="fade" x1={0} y1={0} x2={1} y2={0}>
          <Stop offset={0} stopColor={color} stopOpacity={0} />
          <Stop offset={0.55} stopColor={color} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#fade)" />
    </Svg>
  );
}
