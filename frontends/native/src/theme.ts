// The Track look's tokens (D263, docs/design/THE_ASYLUM_DS_REFERENCE.md, Color tokens), day and night (D261), as
// today's app holds them in frontends/app/src/legacy/src/css/base.css: each name here is that file's token of the
// same name without its dashes. Primary actions are ink, never signal: signal is for what is live.
export interface Palette {
  bg: string; surface: string; surface2: string; border: string; border2: string;
  text: string; muted: string; dim: string; accent: string; onInk: string;
  signal: string; onSignal: string;
  run: string; bike: string; swim: string; lift: string; red: string; green: string;
  /** A skipped card's ground (D284). */
  cardOff: string;
  /** The ink, the signal and the red as "r,g,b", for the tints the web writes as rgba(var(--x-rgb), a). */
  inkRgb: string; signalRgb: string; redRgb: string;
  /** The glow behind a screen's top, as signal's alpha. */
  glowAlpha: number;
  /** A sunk button's inner shadow, as black's alpha (D284). */
  sinkAlpha: number;
  /** The floating tab bar: its ground, its edge and the active tab's ground. */
  nav: string; navEdge: string; navOn: string;
}
export const DAY: Palette = {
  bg: '#F3F3F1', surface: '#FFFFFF', surface2: '#EDEDEA', border: '#E3E3DF', border2: '#CFCFCA',
  text: '#111111', muted: '#6E6E6A', dim: '#5F5F62', accent: '#111111', onInk: '#FFFFFF',
  signal: '#CF4E1A', onSignal: '#FBF6EE',
  run: '#5e8c54', bike: '#3f6e96', swim: '#3f6e96', lift: '#bc6a43', red: '#9e3328', green: '#5e8c54',
  cardOff: '#E4E4E0',
  inkRgb: '17,17,17', signalRgb: '207,78,26', redRgb: '158,51,40',
  glowAlpha: 0.26, sinkAlpha: 0.16,
  nav: 'rgba(255,255,255,0.92)', navEdge: 'rgba(0,0,0,0.06)', navOn: 'rgba(0,0,0,0.06)',
};
export const NIGHT: Palette = {
  bg: '#000000', surface: '#161616', surface2: '#242424', border: '#262626', border2: '#3C3C3C',
  text: '#FFFFFF', muted: '#A3A3A3', dim: '#7A7A7A', accent: '#FFFFFF', onInk: '#000000',
  signal: '#E2622B', onSignal: '#12110D',
  run: '#86B27A', bike: '#7FA6C9', swim: '#7FA6C9', lift: '#D98A63', red: '#D9665A', green: '#86B27A',
  cardOff: '#090909',
  inkRgb: '255,255,255', signalRgb: '226,98,43', redRgb: '217,102,90',
  glowAlpha: 0.64, sinkAlpha: 0.7,
  nav: 'rgba(28,28,28,0.92)', navEdge: 'rgba(255,255,255,0.08)', navOn: 'rgba(255,255,255,0.10)',
};

/** The app's two faces: the display face for titles and controls, the text face for running words (base.css). */
export const DISPLAY = 'Helvetica Neue';
export const TEXT = 'Helvetica Neue';
