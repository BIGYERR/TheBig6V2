// The pop-ups in the Expo app (MIGRATION.md phase 3, the deck's fourth session): the completion pop-up with its
// workout, streak and season tiers, and the day-after reminder with its answer. This is the page's
// popups-streaks-reminders.ts, line for line, with the page's globals taken as arguments: the store, the program a
// launch handed back, the clock and the random draw. The rulings are today's and keep their D-codes (V181 D1 to D4,
// V195 D71, V220 D174 and D175, D238, D240, D284; docs/decisions/swipe-deck.md, the pop-ups' entry).
//
//   popDismissText, popContext, popEligible, popPick      the lines and who may draw one
//   fireWorkoutPopup, fireStreakPopup, fireSeasonPopup,
//   fireCompletionPopup                                    what a day marked done raises, by precedence
//   maybeShowReminder, resolveReminder                     the reminder a launch raises, and its answer
//
// Where the page draws a pop-up (popFire), these hand back what to draw: the tier and its caller's options, which
// popOf turns into the view with today's own model (pop-up-model.ts, a copy held to the byte), in the order the page
// draws its random lines. The five key families the pop-ups keep have no writer in core, so this file writes them
// itself, as the page does, and nothing else in the app names them: ia_pop_idx_ (the line last picked per tier),
// ia_pop_dismiss_ (the button's words for the day), ia_season_shown_ (the season banner, once), ia_remind_last_
// (the reminder, once a calendar day) and ia_reminded_ (each day already asked about). The reminder's answer ends in
// core's own writers. tests/integration/native-pop-ups.test.ts holds every line and every key equal to today's page.
//
// Not here: the injury check-ins and the Wildcard's pop-up, a switched program's past days marked as asked
// (markPastAsked) and the season mark released by an unmark (releaseSeasonShown): none of those flows is in this app.
import { ASY_ICON_PATHS, asyIcon } from '@ia/core/engine/icons.ts';
import { dayStoreKey } from '@ia/core/engine/state-day-log.ts';
import { recordDaySnapshot } from '@ia/core/engine/state-day-history.ts';
import { clearDayParts, dayStatus, readCompleted, setDayStatus } from '@ia/core/engine/state-day-status.ts';
import { _progDayDate } from '@ia/core/engine/state-overlays.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { Day } from '@ia/core';

import { DAY_FULL, type ReadProgram, computeStreak, scheduledDays } from '../this-week/week-readers';
import { type PopOptions, type PopTier, type PopView, popView } from './pop-up-model';

/** A line of a pool: plain, or tagged with when it may be drawn and for which kind of day. */
export type PoolEntry = string | { t: string; when?: string; type?: string };
/** The page's globals a pop-up reads: the store and the program a launch handed back. */
export interface PopSession { store: StateStore; prog: ReadProgram & { id: string } }
/** What the page hands popFire: the tier and its caller's options. */
export interface PopCall { tier: string; opts: PopOptions }

/* ===== REINFORCEMENT POPUPS ===== */
/* Pools are locked copy: the page's own lines, lifted from popups-streaks-reminders.ts as they stand. */
export const POP_POOLS: Record<string, PoolEntry[]>={
  workout:[
    "Congrats... you actually showed up. Just, you know, faster next time. 🎉",
    {t:"Hangover said stay down. You told it to go fuck itself. Respect. 🍺🪦", when:'weekend'},
    "Look at you. Vertical, sweaty, and useful. Goddamn miracle. 🫡",
    {t:"Another one done while half the city's still asleep. 🛏️😭", when:'morning'},
    "Go ahead, keep flexing in the mirror... THEY see it too. 🪞",
    "Ayoooo, your mom's third husband couldn't have done what you just did. 💪",
    "You showed up. The bums in the group chat didn't. You lit! 🔥",
    "Sweat now or be wheezing up eight flights of stairs later. 🚶😤",
    {t:"Cardio's done. You earned the right to talk all the shit you want at brunch. 🥂", when:'weekend', type:'cardio'},
    "One more session toward not dropping dead at 50... You're welcome. ⚰️❌",
    "Well, look who decided not to be useless today. 🛋️🔥",
    "Sweaty, gross, and one step less gordito. Growth, baby. 📈",
    "You vs. the couch: couch lost again. Fuck that couch... or sit on it later. 🛋️💀",
    "Knocked it out while your excuses were still loading. ⏳🖕",
    "Body's pissed, you did it anyway. That's the whole damn point. 😤",
    {t:"Showed up hungover, didn't die. Take your victory shower. 🍻💪", when:'weekend'},
    "Done. Go shower... please. 🚿🤢",
    "One more W! Stack 'em up. 🏙️📚",
    "Quit looking for a medal. It's under your tetas, find it later. 🥇",
    "You suffered on purpose. Stay safe, take a shot later. 😈",
    "Deadass, I've seen people move faster chasing their ex... but good job anyway. 🏃",
    "Diantreeeeeee, you actually activated today. Who inspired you? 👀",
    "Abusador! You murdered that session. Go get some water! 💦",
    "Ay, I don't care what literally everybody says... you got that dawg in you! 🐕",
    "You burned enough calories to justify one pastelito... just one. 🥟",
    {t:"You did the whole thing. Looked dead ugly on that last set, but you finished. 💀", type:'lift'},
    {t:"Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay, \"workout complete.\" 🎧", type:'lift'}
  ],
  reminder:[
    "Yo, you ghosted a session. Mark it or own the skip.",
    "Left a day hanging unmarked. Did you train or nah?",
    "Unfinished business sitting on your calendar. Settle up.",
    "That day didn't log itself, champ. Complete it or call it.",
    "You disappeared on a workout. Your record, your call. Fix it."
  ],
  streak:[
    "Don't you DARE break this now, you've got something going. 🔥",
    "That's a real streak. Most people fold by now like wet cardboard. 🔥💀",
    "Look at this consistency. Who replaced you with someone competent? 🔥",
    "Streak's alive and so are you. Keep it that way, you maniac. 🔥",
    "You're on a tear. Breaking it now would be a crime against yourself. 🔥🚔"
  ],
  season:[
    "You finished the WHOLE fuckin' thing?? Who are you and what'd you do with the lazy prick I knew. 🏆",
    "Done. You bitched every goddamn step and STILL pulled it off. Legend shit. 💪",
    "Program complete. The streets are proud. Your knees filed a complaint. 🗽🦴",
    "You saw it through. Rare as fuck. Most quit at week two like little bitches. 🐔",
    "Full block. No shortcuts, no excuses, no crying. Go be insufferable about it. 🔥",
    "Your membership finally earned its keep instead of robbing you blind. 🧾😮‍💨",
    "Whole program, finished, no quitting halfway like a coward. I'm fuckin' shocked. 🏆",
    "You outlasted every weak ass excuse your brain coughed up. Respect, animal. 🧠❌",
    "You crossed the line most people piss themselves at and bail. Built different. 💪"
  ]
};
export const POP_CFG: Record<string, PopTier & { glow: string }>={
  workout: {icon:'🎉',kicker:'Workout complete',kClass:'',glow:'rgba(var(--scrim-rgb),0.35)',confetti:72,shake:false},
  reminder:{icon:'notebook',kicker:'Unfinished business',kClass:'',glow:'rgba(var(--scrim-rgb),0.30)',confetti:0,shake:false},
  streak:  {icon:'🔥',kicker:'Streak alive',kClass:'streak',glow:'rgba(var(--core-rgb),0.4)',confetti:100,shake:false},
  season:  {icon:'🏆',kicker:'Season complete',kClass:'',glow:'rgba(var(--scrim-rgb),0.55)',confetti:200,shake:true}
};
export const POP_KNICKS=['#006BB6','#F58426','#BEC0C2']; // NY Knicks — blue, orange, silver
// User-voice acknowledgments (the user brushing off the app). Per-DAY rotation:
// one flavor per calendar day, held all day, rolls to a new one tomorrow (no repeat).
export const POP_DISMISS=[
  "yeah yeah...",
  "good looks 😒",
  "ok i get it...",
  "...tato",
  "i don't need your approval... but ok",
  "save it 🫳",
  "...moving on"
];

/** The page's _todayStamp: the calendar day, no leading zeros. */
function todayStamp(now: Date): string { return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(); }
const midnight = (now: Date): Date => { const t = new Date(now); t.setHours(0, 0, 0, 0); return t; };

/** The page's popDismissText: one flavor per calendar day, held all day, another one tomorrow. */
export function popDismissText(s: PopSession, now: Date, random: () => number): string {
  const key = 'ia_pop_dismiss_' + s.prog.id; const today = todayStamp(now);
  let st: { date?: string; idx?: number } = {}; try { st = JSON.parse(s.store.get(key) || '{}'); } catch { /* a broken record reads as none */ }
  if (st.date === today && typeof st.idx === 'number' && POP_DISMISS[st.idx]) return POP_DISMISS[st.idx]!;
  let i: number; do { i = Math.floor(random() * POP_DISMISS.length); } while (POP_DISMISS.length > 1 && i === st.idx);
  try { s.store.set(key, JSON.stringify({ date: today, idx: i })); } catch { /* a full store keeps the line */ }
  return POP_DISMISS[i]!;
}

/** What a tagged line asks of the trained day (V220 D175). */
interface PopCtx { known: boolean; weekend?: boolean; morning?: boolean; cardio?: boolean; lift?: boolean }
/**
 * The page's popContext: the TRAINED day, read from the grid. Weekend is the trained day's own date; morning is
 * before 9 on the clock and the trained day is today; cardio is the day's run, ride or swim; lift is a section with
 * items that is not core, hip, mobility or taper. With no day to read, the context is unknown.
 */
export function popContext(s: PopSession, week: number | undefined, dayKey: string | undefined, now: Date): PopCtx {
  const day = (week != null && dayKey && s.prog?.weeks) ? s.prog.weeks[week]?.[dayKey] : null;
  const dt = day ? _progDayDate(s.prog, week!, dayKey!) : null;
  if (!dt) return { known: false };
  const today = midnight(now);
  const dow = dt.getDay();
  return {
    known: true,
    weekend: (dow === 0 || dow === 6),
    morning: (now.getHours() < 9 && dt.getTime() === today.getTime()),
    cardio: !!day!.cardio,
    lift: ((day!.sections || []) as { core?: unknown; hip?: unknown; items?: unknown[]; label?: string }[]).some((x) => !x.core && !x.hip && (x.items || []).length && !/mobility|taper/i.test(x.label || '')),
  };
}
const popText = (e: PoolEntry): string => ((e && typeof e === 'object') ? e.t : e);
/** The page's popEligible: an untagged line always; a tagged one only when the day is known and both tags pass. */
export function popEligible(e: PoolEntry, ctx: PopCtx | null | undefined): boolean {
  const tag = (e && typeof e === 'object') ? e : null;
  const when = tag ? tag.when : null, type = tag ? tag.type : null;
  if (!when && !type) return true;
  if (!ctx || !ctx.known) return false;
  if (when === 'weekend' && !ctx.weekend) return false;
  if (when === 'morning' && !ctx.morning) return false;
  if (type === 'cardio' && !ctx.cardio) return false;
  if (type === 'lift' && !ctx.lift) return false;
  return true;
}
/** The page's popPick: a line the day may draw, never the tier's last one while another is eligible; the pick is kept. */
export function popPick(s: PopSession, tier: string, week: number | undefined, dayKey: string | undefined, now: Date, random: () => number): string {
  const pool = POP_POOLS[tier]; if (!pool || !pool.length) return '';
  const ctx = popContext(s, week, dayKey, now);
  const elig: number[] = []; pool.forEach((e, idx) => { if (popEligible(e, ctx)) elig.push(idx); });
  if (!elig.length) return popText(pool[0]!);
  if (elig.length === 1) return popText(pool[elig[0]!]!);
  const memKey = 'ia_pop_idx_' + s.prog.id; let mem: Record<string, unknown> = {};
  try { mem = JSON.parse(s.store.get(memKey) || '{}'); } catch { /* a broken record reads as none */ }
  const last = (typeof mem[tier] === 'number') ? mem[tier] : -1;
  let choices = elig.filter((i) => i !== last); if (!choices.length) choices = elig;
  const i = choices[Math.floor(random() * choices.length)]!;
  mem[tier] = i; try { s.store.set(memKey, JSON.stringify(mem)); } catch { /* a full store keeps the line */ }
  return popText(pool[i]!);
}

/** A stat's label, which may end in an icon's markup ('Day Streak ' and the flame): its words, and the markup or none. */
export function labelParts(l: string): { text: string; svg: string | null } {
  const at = l.indexOf('<svg');
  return at < 0 ? { text: l, svg: null } : { text: l.slice(0, at).trimEnd(), svg: l.slice(at).replace(/ style="[^"]*"/, '') };
}

/**
 * What a call shows (the Angular PopUp's fire): today's model over this file's lines. The message is picked before the
 * button's words, as the page draws them, so the same random draws give the same lines.
 */
export function popOf(s: PopSession, call: PopCall, now: Date, random: () => number): PopView {
  return popView(call.tier, call.opts, {
    tier: (name) => POP_CFG[name],
    isIcon: (name) => Object.prototype.hasOwnProperty.call(ASY_ICON_PATHS, name),
    pick: (t, week, dayKey) => popPick(s, t, week, dayKey, now, random),
    dismissText: () => popDismissText(s, now, random),
  });
}

/* ===== STREAK / STATS / REMINDER HELPERS ===== */
const statusOf = (s: PopSession, week: number, d: string): string | null => dayStatus(s.store, s.prog.id, week, d);
function completedCount(s: PopSession): number {
  let n = 0;
  Object.values(readCompleted(s.store, s.prog.id)).forEach((v) => { const st = v?.status || 'complete'; if (st === 'complete' || st === 'partial') n++; });
  return n;
}
function skippedCount(s: PopSession): number {
  let n = 0;
  Object.values(readCompleted(s.store, s.prog.id)).forEach((v) => { if ((v?.status) === 'skipped') n++; });
  return n;
}
/** The page's fireWorkoutPopup (V181 D4): the streak alone under the line. */
export function fireWorkoutPopup(s: PopSession, week: number, dayKey: string, now: Date): PopCall {
  return { tier: 'workout', opts: { week, dayKey, stats: [
    { n: String(computeStreak(s.store, s.prog, s.prog.id, midnight(now))), l: 'Day Streak ' + asyIcon('🔥', 12), cls: 'streak' },
  ] } };
}
/** Milestones: 3, 7, 14, 30, then every 30 (60, 90, …). */
export function streakMilestone(n: number): boolean { return n === 3 || n === 7 || n === 14 || n === 30 || (n > 30 && n % 30 === 0); }
export function fireStreakPopup(streak: number): PopCall {
  return { tier: 'streak', opts: {
    kicker: streak + '-day streak 🔥',
    stats: [
      { n: String(streak), l: 'Day Streak', cls: 'streak' },
    ],
  } };
}
/** Season = (A): the final scheduled training day of the program is completed. Once ever. */
export function finalScheduledDay(s: PopSession): { week: number; d: string; date: Date } | null { const a = scheduledDays(s.prog); return a.length ? a[a.length - 1]! : null; }
const seasonShown = (s: PopSession): boolean => s.store.get('ia_season_shown_' + s.prog.id) === '1';
function markSeasonShown(s: PopSession): void { try { s.store.set('ia_season_shown_' + s.prog.id, '1'); } catch { /* a full store shows it again */ } }
export function fireSeasonPopup(s: PopSession): PopCall {
  return { tier: 'season', opts: {
    stats: [
      { n: String(completedCount(s)), l: 'Workouts' },
      { n: String(skippedCount(s)), l: 'Skips' },
      { n: String(s.prog.totalWeeks || ''), l: 'Weeks' },
    ],
  } };
}
/** One dispatcher for every fresh complete. Precedence: season > milestone > workout. */
export function fireCompletionPopup(s: PopSession, week: number, dayKey: string, now: Date): PopCall {
  const f = finalScheduledDay(s);
  if (f && f.week === week && f.d === dayKey && !seasonShown(s)) {
    markSeasonShown(s);
    return fireSeasonPopup(s);
  }
  const streak = computeStreak(s.store, s.prog, s.prog.id, midnight(now));
  if (streakMilestone(streak)) return fireStreakPopup(streak);
  return fireWorkoutPopup(s, week, dayKey, now);
}

// Day-after reminder: most recent strictly-past pending non-rest day not yet reminded, since the last marked day.
function remindedSet(s: PopSession): Record<string, boolean> { try { return JSON.parse(s.store.get('ia_reminded_' + s.prog.id) || '{}'); } catch { return {}; } }
function markReminded(s: PopSession, week: number, d: string): void { const m = remindedSet(s); m[dayStoreKey(week, d)] = true; try { s.store.set('ia_reminded_' + s.prog.id, JSON.stringify(m)); } catch { /* a full store asks again */ } }
/** The day a reminder asks about, for its two buttons. */
export interface Reminder { call: PopCall; week: number; dayKey: string; title: string }
/**
 * The page's maybeShowReminder: once a calendar day, about the latest past training day not marked and not yet asked
 * about; a marked day ends the walk (D240: never chase missed work). A gap of seven days or more gets the fixed
 * re-entry guidance, a shorter one a line of the reminder pool (D175). Null where there is nothing to ask.
 */
export function maybeShowReminder(s: PopSession, now: Date, random: () => number): Reminder | null {
  if (!s.prog?.startDate) return null;
  const lastKey = 'ia_remind_last_' + s.prog.id;
  if (s.store.get(lastKey) === todayStamp(now)) return null; // once per calendar day
  const today = midnight(now);
  const days = scheduledDays(s.prog, today).filter((x) => x.date < today); // strictly past
  const rem = remindedSet(s); let target: { week: number; d: string; date: Date } | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    const x = days[i]!;
    if (statusOf(s, x.week, x.d)) break;               // already resolved
    if (rem[dayStoreKey(x.week, x.d)]) continue;       // already reminded
    target = x; break;
  }
  if (!target) return null;
  const day = s.prog.weeks![target.week]?.[target.d]; if (!day) return null;
  s.store.set(lastKey, todayStamp(now));
  markReminded(s, target.week, target.d);
  const esc = (day.title || 'Workout').replace(/'/g, "\\'");
  let _gap = 0; for (let i = days.length - 1; i >= 0; i--) { if (statusOf(s, days[i]!.week, days[i]!.d)) break; _gap++; }
  const _remMsg = _gap >= 7
    ? 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.'
    : popPick(s, 'reminder', target.week, target.d, now, random);
  const _remSub = DAY_FULL[target.d] + ', Wk ' + target.week + ' · ' + (day.title || 'Workout');
  return { week: target.week, dayKey: target.d, title: day.title || 'Workout', call: { tier: 'reminder', opts: {
    msg: _remMsg,
    sub: _gap >= 7 ? _remSub : _remSub + '. The week ahead stays as written.',
    actions: [
      { label: '✓ Done', cls: 'go', onclick: `resolveReminder(${target.week},'${target.d}','${esc}','complete')` },
      { label: '✕ Skip', cls: 'skip', onclick: `resolveReminder(${target.week},'${target.d}','${esc}','skipped')` },
    ],
    triple: true,
  } } };
}
/**
 * The page's resolveReminder: the day snapshotted, its skipped parts cleared (D284: the answer takes the day whole),
 * the status set, the day marked as asked. It hands back the toast; Done raises the completion pop-up next.
 */
export function resolveReminder(s: PopSession, week: number, dayKey: string, title: string, status: 'complete' | 'skipped', now: number, log: (...a: unknown[]) => void = console.error): string {
  try {
    if (s.prog && s.prog.weeks && week && dayKey) recordDaySnapshot(s.store, s.prog.id, week, dayKey, (s.prog.weeks[week] && s.prog.weeks[week]![dayKey]) as unknown as Day | null | undefined);
  } catch (e) { log('day snapshot failed', week, dayKey, e); }
  clearDayParts(s.store, s.prog.id, week, dayKey);
  setDayStatus(s.store, s.prog.id, week, dayKey, title || null, status, now);
  markReminded(s, week, dayKey);
  const labels: Record<string, string> = { complete: 'Locked in ✓', skipped: 'Skipped ✕ — the week moves on' };
  return labels[status] || 'Updated';
}
