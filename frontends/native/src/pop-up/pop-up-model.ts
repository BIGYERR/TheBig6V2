// The celebration pop-up's logic, kept apart from Angular so the app's node --test suite reads it as it is (architecture
// phase E, step 3: the overlay moves from the legacy popFire to the PopUp component). The pools, the per-tier config and
// the line pickers stay in the legacy script (tests/integration/pop-ups.test.ts reads them there); this decides, from a
// tier and the caller's options, what the pop-up shows, in the order the legacy popFire drew its random lines.

/** One tier's look (the legacy POP_CFG): its icon, kicker, kicker class, confetti count and whether the card shakes. */
export interface PopTier {
  icon: string;
  kicker: string;
  kClass?: string;
  confetti?: number;
  shake?: boolean;
}

/** A stat under the message: a number, its label (which may hold an icon's markup), and a class for the number. */
export interface PopStat {
  n: string | number;
  l: string;
  cls?: string;
}

/** A button: its label, its class, and the legacy handler code it runs, as the legacy onclick attribute held it. */
export interface PopAction {
  label: string;
  cls?: string;
  onclick: string;
}

/** What a caller of popFire passes. */
export interface PopOptions {
  icon?: string;
  kicker?: string;
  msg?: string;
  sub?: string;
  stats?: PopStat[];
  actions?: PopAction[];
  triple?: boolean;
  dismiss?: string;
  week?: number;
  dayKey?: string;
}

/** The legacy pieces the pop-up reads: the tier config, whether a name is an icon, and the two line pickers. */
export interface PopDeps {
  tier(name: string): PopTier | undefined;
  isIcon(name: string): boolean;
  pick(tier: string, week: number | undefined, dayKey: string | undefined): string;
  dismissText(): string;
}

/** Everything the pop-up shows for one call. */
export interface PopView {
  icon: { name: string; svg: boolean };
  kicker: string;
  kickerClass: string;
  msg: string;
  sub: string;
  stats: PopStat[];
  actionsClass: string;
  actions: PopAction[];
  modalClass: string;
  confetti: number;
}

/**
 * The view for popFire(tier, opts). An unknown tier reads as the workout tier. The message is picked before the dismiss
 * line, as before, so a seeded Math.random draws the same lines; a caller's own message or buttons skip the picker.
 */
export function popView(tierName: string, opts: PopOptions | null | undefined, deps: PopDeps): PopView {
  const o = opts || {};
  const cfg = deps.tier(tierName) || deps.tier('workout')!;
  const icon = o.icon || cfg.icon;
  const kicker = o.kicker || cfg.kicker;
  const kickerClass = 'pop-kicker ' + (cfg.kClass || '');
  const msg = o.msg || deps.pick(tierName, o.week, o.dayKey);
  const sub = o.sub || '';
  const stats = o.stats || [];
  const custom = !!(o.actions && o.actions.length);
  const actions = custom ? o.actions! : [{ label: o.dismiss || deps.dismissText(), cls: 'go', onclick: 'popClose()' }];
  return {
    icon: { name: icon, svg: deps.isIcon(icon) },
    kicker,
    kickerClass,
    msg,
    sub,
    stats,
    actionsClass: 'pop-actions' + (custom && o.triple ? ' triple' : ''),
    actions,
    modalClass: 'pop-modal' + (cfg.shake ? ' shake' : ''),
    confetti: cfg.confetti || 0,
  };
}

/** One confetti piece: where it falls from, how long, its colour or a trophy, its turn and its shape. */
export interface ConfettiPiece {
  left: string;
  duration: string;
  delay: string;
  trophy: boolean;
  fontSize?: string;
  background?: string;
  rotate: string;
  round?: boolean;
}

/**
 * The confetti for a burst of `count`, drawing from `random` in the legacy order (one draw for the trophy drop, then per
 * piece: left, duration, delay, then the trophy or the colour, turn and shape), so a seeded Math.random falls the same.
 */
export function confetti(count: number, random: () => number, colors: readonly string[]): ConfettiPiece[] {
  if (!count) return [];
  const trophyDrop = random() < 0.25;
  const out: ConfettiPiece[] = [];
  for (let n = 0; n < count; n++) {
    const left = random() * 100 + 'vw';
    const duration = 1.6 + random() * 1.6 + 's';
    const delay = random() * 0.25 + 's';
    if (trophyDrop && random() < 0.12) {
      const fontSize = 16 + random() * 8 + 'px';
      out.push({ left, duration, delay, trophy: true, fontSize, rotate: `rotate(${-20 + random() * 40}deg)` });
    } else {
      const background = colors[Math.floor(random() * colors.length)]!;
      const rotate = `rotate(${random() * 360}deg)`;
      out.push({ left, duration, delay, trophy: false, background, rotate, round: random() > 0.6 });
    }
  }
  return out;
}
