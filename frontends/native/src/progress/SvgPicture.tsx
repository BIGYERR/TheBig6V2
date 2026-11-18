// A picture a model hands over element by element (the Angular SvgPicture, charts/svg-picture.ts): a main lift's line,
// a Range Ladder track, and from the next session the run cards' charts. Each element keeps the attributes the page
// wrote; paint.ts turns them into react-native-svg's.
import Svg, { Circle, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { DISPLAY, type Palette } from '../theme';
import type { SvgEl } from './charts/chart-card-model';
import { pictureBox, svgProps } from './paint';

export function SvgPicture({ viewBox, style, els, palette: p }: { viewBox: string; style: string; els: SvgEl[]; palette: Palette }) {
  const box = pictureBox(viewBox, style);
  const size = box.width !== null && box.height !== null ? { width: box.width, height: box.height, margin: box.margin } : { width: '100%' as const, aspectRatio: box.ratio };
  return (
    <Svg viewBox={box.viewBox} style={size}>
      {els.map((e, i) => {
        const a = svgProps(e, p, DISPLAY);
        switch (e.el) {
          case 'line': return <Line key={i} {...a} />;
          case 'rect': return <Rect key={i} {...a} />;
          case 'circle': return <Circle key={i} {...a} />;
          case 'path': return <Path key={i} {...a} />;
          case 'polygon': return <Polygon key={i} {...a} />;
          default: return <SvgText key={i} {...a}>{e.text}</SvgText>;
        }
      })}
    </Svg>
  );
}
