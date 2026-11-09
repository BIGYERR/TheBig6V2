// The grow out of a card (D275 P-DECK call 16, Lift first at 420 ms; D272 Amendment 2): a full screen drawn at a
// card's place under a copy of the card, lifted, opened to the whole screen, and played back into the card on the way
// out. The deck opens this way from Start lift and Start session, the run recorder from Record run. Kept apart from
// either screen so both open with the same numbers (openMotion).
import { openMotion } from './deck-model';

/** The stage: drawn under the copy, lifted, opening, open, closing. */
export type GrowStage = 'pre' | 'lift' | 'in' | 'open' | 'out' | null;
/** Where the card sits on the screen. */
export interface GrowBox { t: number; l: number; w: number; h: number }
/** The styles of each layer: This Week under it, the scrim, the copy of the card, the screen's frame and its content. */
export interface GrowFx { week: string; scrim: string; ghost: string; frame: string; content: string }

/** Where an element sits, or null when it has no size (off screen, or not drawn). */
export function growBox(el: HTMLElement | null): GrowBox | null {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { t: r.top, l: r.left, w: r.width, h: r.height } : null;
}

/** The copy of the card the screen opens out of: its words, without its buttons. */
export function growCopy(host: HTMLElement, from: HTMLElement): void {
  host.textContent = '';
  const copy = from.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('button, .wk-hero-cta-wrap, [id]').forEach((n) => {
    if (n.matches('button, .wk-hero-cta-wrap')) n.remove();
    else n.removeAttribute('id');
  });
  copy.style.margin = '0';
  copy.style.background = 'transparent';
  host.appendChild(copy);
}

/** The styles of each stage, for a card at o on a vw by vh screen. */
export function growFx(s: GrowStage, o: GrowBox | null, vw: number, vh: number): GrowFx {
  const M = openMotion();
  if (!o || s === 'open' || s === null) {
    return { week: s === 'open' && o ? 'transform:scale(.96)' : '', scrim: 'opacity:' + (o ? '.55' : '0'), ghost: 'display:none', frame: 'clip-path:none;-webkit-clip-path:none;background-color:var(--bg)', content: 'opacity:1' };
  }
  const px = (v: number) => v.toFixed(1) + 'px';
  const clip = (dt: number, dx: number, r: number) => {
    const v = 'inset(' + px(o.t - dt) + ' ' + px(Math.max(0, vw - o.l - o.w) - dx) + ' ' + px(Math.max(0, vh - o.t - o.h) - dt) + ' ' + px(o.l - dx) + ' round ' + r + 'px)';
    return 'clip-path:' + v + ';-webkit-clip-path:' + v + ';';
  };
  const box = 'left:' + px(o.l) + ';top:' + px(o.t) + ';width:' + px(o.w) + ';height:' + px(o.h) + ';';
  const tr = (props: string[], ms: number, ease: string, delay = 0) => 'transition:' + props.map((p) => p + ' ' + ms + 'ms ' + ease + (delay ? ' ' + delay + 'ms' : '')).join(',') + ';';
  const FULL = 'clip-path:inset(0px 0px 0px 0px round 0px);-webkit-clip-path:inset(0px 0px 0px 0px round 0px);';
  if (s === 'pre') {
    return { week: 'transform:none;transition:none', scrim: 'opacity:0;transition:none', ghost: box + 'opacity:1;transform:none;transition:none', frame: clip(0, 0, 24) + 'background-color:var(--surface);transition:none', content: 'opacity:0;transform:scale(.94);transition:none' };
  }
  if (s === 'lift') {
    return {
      week: 'transform:none;transition:none',
      scrim: 'opacity:.3;' + tr(['opacity'], M.lift, 'ease'),
      ghost: box + 'opacity:1;transform:scale(1.04);background-color:var(--surface2);' + tr(['transform', 'background-color'], M.lift, M.ease.lift),
      frame: clip(10, 8, 28) + 'background-color:var(--surface2);' + tr(['clip-path', '-webkit-clip-path', 'background-color'], M.lift, M.ease.lift),
      content: 'opacity:0;transform:scale(.94);transition:none',
    };
  }
  if (s === 'in') {
    return {
      week: 'transform:scale(.96);' + tr(['transform'], M.open, M.ease.open),
      scrim: 'opacity:.55;' + tr(['opacity'], M.open, M.ease.open),
      ghost: box + 'opacity:0;transform:scale(1.04);background-color:var(--surface2);' + tr(['opacity'], M.copyFadeOut, 'ease'),
      frame: FULL + 'background-color:var(--bg);' + tr(['clip-path', '-webkit-clip-path', 'background-color'], M.open, M.ease.open),
      content: 'opacity:1;transform:none;transition:opacity ' + M.deckFadeIn + 'ms ease ' + M.deckFadeDelay + 'ms,transform ' + M.open + 'ms ' + M.ease.open,
    };
  }
  return {
    week: 'transform:none;' + tr(['transform'], M.close, M.ease.close),
    scrim: 'opacity:0;' + tr(['opacity'], M.close, M.ease.close),
    ghost: box + 'opacity:1;transform:none;background-color:var(--surface);transition:opacity ' + (M.copyBackTo - M.copyBackFrom) + 'ms ease ' + M.copyBackFrom + 'ms,transform ' + M.close + 'ms ' + M.ease.close + ',background-color ' + M.close + 'ms ease',
    frame: clip(0, 0, 24) + 'background-color:var(--surface);' + tr(['clip-path', '-webkit-clip-path', 'background-color'], M.close, M.ease.close),
    content: 'opacity:0;transform:scale(.94);transition:opacity ' + M.deckFadeOut + 'ms ease,transform ' + M.close + 'ms ' + M.ease.close,
  };
}

/** This Week under the screen: it shrinks to 96% as the screen opens and grows back as it closes. */
export function growWeek(css: string): void {
  const el = typeof document !== 'undefined' ? document.getElementById('screenWeek') : null;
  if (!el) return;
  const get = (p: string) => (css.match(new RegExp('(?:^|;)' + p + ':([^;]*)')) || [])[1] || '';
  el.style.transform = get('transform');
  el.style.transition = get('transition');
}
