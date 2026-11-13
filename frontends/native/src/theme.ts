// The Track look's tokens (D263, docs/design/THE_ASYLUM_DS_REFERENCE.md, Color tokens), day and night. Primary
// actions are ink, never signal: signal is for what is live.
export interface Palette {
  bg: string; surface: string; border: string; text: string; muted: string; accent: string; onInk: string; signal: string;
}
export const DAY: Palette = {
  bg: '#F3F3F1', surface: '#FFFFFF', border: '#E3E3DF', text: '#111111', muted: '#6E6E6A', accent: '#111111',
  onInk: '#FFFFFF', signal: '#CF4E1A',
};
export const NIGHT: Palette = {
  bg: '#000000', surface: '#161616', border: '#262626', text: '#FFFFFF', muted: '#A3A3A3', accent: '#FFFFFF',
  onInk: '#000000', signal: '#E2622B',
};
