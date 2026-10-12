// The celebration pop-up's logic (src/app/screens/pop-up/pop-up-model.ts, architecture phase E step 3), against the
// legacy popFire and popConfetti it replaces: what a call shows, the order the random lines are drawn in, and the
// confetti. Expected values are typed here from the legacy code, never asked of the model.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { confetti, type PopDeps, type PopTier, popView } from '../../src/app/screens/pop-up/pop-up-model.ts';

/** The legacy POP_CFG, typed here. */
const TIERS: Record<string, PopTier> = {
  workout: { icon: '🎉', kicker: 'WORKOUT COMPLETE', kClass: '', confetti: 72, shake: false },
  reminder: { icon: 'notebook', kicker: 'UNFINISHED BUSINESS', kClass: '', confetti: 0, shake: false },
  streak: { icon: '🔥', kicker: 'STREAK ALIVE', kClass: 'streak', confetti: 100, shake: false },
  season: { icon: '🏆', kicker: 'SEASON COMPLETE', kClass: '', confetti: 200, shake: true },
};
function deps(log: string[]): PopDeps {
  return {
    tier: (n) => TIERS[n],
    isIcon: (n) => n === 'notebook' || n === 'shield',
    pick: (t, w, d) => (log.push(`pick ${t} ${w} ${d}`), `line for ${t}`),
    dismissText: () => (log.push('dismiss'), 'yeah yeah...'),
  };
}

describe('the celebration pop-up', () => {
  it('shows a tier with a picked line and one dismiss button, the line picked before the dismiss text', () => {
    const log: string[] = [];
    const v = popView('streak', { week: 2, dayKey: 'mon', stats: [{ n: '7', l: 'Day Streak', cls: 'streak' }] }, deps(log));
    assert.deepEqual(log, ['pick streak 2 mon', 'dismiss']);
    assert.deepEqual(v, {
      icon: { name: '🔥', svg: false },
      kicker: 'STREAK ALIVE',
      kickerClass: 'pop-kicker streak',
      msg: 'line for streak',
      sub: '',
      stats: [{ n: '7', l: 'Day Streak', cls: 'streak' }],
      actionsClass: 'pop-actions',
      actions: [{ label: 'yeah yeah...', cls: 'go', onclick: 'popClose()' }],
      modalClass: 'pop-modal',
      confetti: 100,
    });
  });

  it('takes the caller\'s icon, kicker, message, sub and buttons, and picks nothing then', () => {
    const log: string[] = [];
    const actions = [
      { label: 'I’M BACK', cls: 'go', onclick: "popClose();imBackFromInjury('p1')" },
      { label: 'MORE TIME', cls: 'skip', onclick: "popClose();injSnooze('p1')" },
    ];
    const v = popView('workout', { icon: 'shield', kicker: 'CHECK IN', msg: 'Good sign.', sub: 'Ready?', actions, triple: true }, deps(log));
    assert.deepEqual(log, []);
    assert.deepEqual([v.icon, v.kicker, v.kickerClass, v.msg, v.sub], [{ name: 'shield', svg: true }, 'CHECK IN', 'pop-kicker ', 'Good sign.', 'Ready?']);
    assert.deepEqual([v.actionsClass, v.actions], ['pop-actions triple', actions]);
  });

  it('dismisses with the caller\'s word, reads an unknown tier as a workout, and shakes the season card', () => {
    const log: string[] = [];
    assert.deepEqual(popView('workout', { msg: 'x', dismiss: 'LET’S GO' }, deps(log)).actions, [{ label: 'LET’S GO', cls: 'go', onclick: 'popClose()' }]);
    assert.deepEqual(log, [], 'neither picker runs');
    assert.equal(popView('nonsense', { msg: 'x', dismiss: 'ok' }, deps([])).kicker, 'WORKOUT COMPLETE');
    assert.equal(popView('season', { msg: 'x', dismiss: 'ok' }, deps([])).modalClass, 'pop-modal shake');
    assert.equal(popView('workout', { msg: 'x', dismiss: 'ok', triple: true }, deps([])).actionsClass, 'pop-actions', 'triple only with the caller\'s buttons');
  });

  it('falls confetti in the legacy draw order: the trophy drop first, then each piece\'s left, time, delay, then trophy or colour, turn and shape', () => {
    // trophy drop | piece 1: left, time, delay, trophy?, size, turn | piece 2: left, time, delay, trophy?, colour, turn, shape
    const draws = [0.1, 0.5, 0.5, 0.4, 0.05, 0.5, 0.25, 0.2, 0.0, 0.9, 0.5, 0.4, 0.5, 0.7];
    let i = 0;
    const random = () => draws[i++]!;
    const pieces = confetti(2, random, ['#006BB6', '#F58426', '#BEC0C2']);
    assert.equal(i, 14, 'every draw the legacy made, and no more');
    assert.deepEqual(pieces[0], { left: '50vw', duration: '2.4000000000000004s', delay: '0.1s', trophy: true, fontSize: '20px', rotate: 'rotate(-10deg)' });
    assert.deepEqual(pieces[1], { left: '20vw', duration: '1.6s', delay: '0.225s', trophy: false, background: '#F58426', rotate: 'rotate(180deg)', round: true });
    assert.deepEqual(confetti(0, () => { throw new Error('no draw for no confetti'); }, []), []);
  });
});
