// The run log against the app's own rules, values typed by hand from cardio-fields-model.ts and doseDerived.
export function runSmoke(c, d, k, WIN) {
  const r = d.cards.findIndex((x) => x.kind === 'run');
  if (r < 0) return 'no run';
  const L = d.cards[r].log; if (!L) throw new Error(k + ' run card carries no log');
  let said = ''; c.say = (t) => { said = t; };
  c.setState({ i: r, open: true, rw: {}, sport: {}, spick: {}, rlog: {}, yards: {}, done: {}, skip: {}, moved: null, ran: '', sheet: null, anim: null });
  const rf = () => c.renderVals().rf;
  const faces = (w) => w.cols.filter((x) => x.isCol).map((x) => x.rows[3].face).join(' ');
  const col = (w, n) => w.cols.filter((x) => x.isCol)[n];
  let f = rf();
  f.log(); if (said !== 'Nothing to log yet.' || c.state.done[r]) throw new Error(k + ' an empty log went through');
  // Hand-worked per dose: [mins or miles planned] -> the steps taken and what the readout and summary must say.
  const TIMED = {
    'time 15': { first: 'Time', faces0: '0 15 00', faces1: '0 .0 0', stepMiles: [0, 1], after1: ['15:00/mi', 'assuming planned 15 min · 1:40/mi slower than target'],
      tenths: 3, faces1b: '1 .3 0', faces0b: '0 17 00', end: ['13:05/mi', '15s/mi faster than target'], ran: '17:00 · 1.30 mi · 13:05/mi' },
    // 45 min over 3 mi is 900 s, 15:00/mi, 100 s off 13:20. 47 min over 3.3 mi is 854.5 s, 14:15/mi, 55 s slower.
    'time 45': { first: 'Time', faces0: '0 45 00', faces1: '0 .0 0', stepMiles: [0, 3], after1: ['15:00/mi', 'assuming planned 45 min · 1:40/mi slower than target'],
      tenths: 3, faces1b: '3 .3 0', faces0b: '0 47 00', end: ['14:15/mi', '55s/mi slower than target'], ran: '47:00 · 3.30 mi · 14:15/mi' }
  };
  if (L.dose && L.dose.k === 'time') {
    const X = TIMED['time ' + L.dose.mins]; if (!X) throw new Error(k + ' no hand table for ' + L.dose.mins + ' min');
    if (!f.hasStrip || f.stripLabel !== 'Run · Planned' || f.stripVal !== L.dose.mins + ' min @ 13:20/mi') throw new Error(k + ' strip: ' + f.stripLabel + ' | ' + f.stripVal);
    if (f.label !== 'Log the run' || f.wheels.map((w) => w.cap).join() !== 'Time,Miles') throw new Error(k + ' time dose fields: ' + f.wheels.map((w) => w.cap));
    if (faces(f.wheels[0]) !== X.faces0 || faces(f.wheels[1]) !== X.faces1) throw new Error(k + ' faces: ' + faces(f.wheels[0]) + ' / ' + faces(f.wheels[1]));
    if (f.wheels[0].sub !== 'Shows the plan. Move it to match the watch.' || f.wheels[1].sub !== 'Off the watch.') throw new Error(k + ' wheel subs');
    if (f.dLbl !== 'Your pace' || f.dVal !== 'enter distance') throw new Error(k + ' derived before: ' + f.dVal);
    for (let s2 = 0; s2 < X.stepMiles[1]; s2++) { col(f.wheels[1], 0).wheel({ deltaY: 30 }); f = rf(); }
    if (f.dVal !== X.after1[0] || f.dNote !== X.after1[1]) throw new Error(k + ' derived: ' + f.dVal + ' | ' + f.dNote);
    const L0 = {}; WIN.addEventListener = (t, h) => { L0[t] = h; }; WIN.removeEventListener = () => {};
    col(f.wheels[0], 1).down({ clientY: 300, stopPropagation() {}, currentTarget: { closest: () => null } });
    L0.pointermove({ clientY: 270 }); if (!c.state.wdrag || c.state.wdrag.off !== 0) throw new Error(k + ' drag offset');
    L0.pointerup({ clientY: 240 }); f = rf();
    if (faces(f.wheels[0]) !== X.faces0b || c.state.wdrag) throw new Error(k + ' drag: ' + faces(f.wheels[0]));
    for (let s2 = 0; s2 < X.tenths; s2++) { col(f.wheels[1], 1).wheel({ deltaY: 30 }); f = rf(); }
    if (faces(f.wheels[1]) !== X.faces1b) throw new Error(k + ' tenths: ' + faces(f.wheels[1]));
    if (f.dVal !== X.end[0] || f.dNote !== X.end[1]) throw new Error(k + ' derived after: ' + f.dVal + ' | ' + f.dNote);
    f.log(); if (c.state.ran !== X.ran || !c.state.done[r] || said !== 'Run logged ✓') throw new Error(k + ' log: ' + c.state.ran + ' ' + said);
  } else if (L.dose && L.dose.k === 'dist') {
    // 8 mi planned at 13:20. One hour over the planned 8 mi is 450 s, 7:30/mi, 350 s fast. 1:46:00 over 8 mi is 795 s,
    // 13:15/mi, 5 s fast. Over 8.1 mi it is 785.2 s, 13:05/mi, 15 s fast, and the plan is no longer assumed.
    if (!f.hasStrip || f.stripLabel !== 'Run · Planned' || f.stripVal !== L.dose.mi + ' mi @ 13:20/mi') throw new Error(k + ' strip: ' + f.stripLabel + ' | ' + f.stripVal);
    if (f.label !== 'Log the run' || f.wheels.map((w) => w.cap).join() !== 'Miles,Time') throw new Error(k + ' dist dose fields');
    if (faces(f.wheels[0]) !== L.dose.mi + ' .0 0' || faces(f.wheels[1]) !== '0 00 00') throw new Error(k + ' faces: ' + faces(f.wheels[0]) + ' / ' + faces(f.wheels[1]));
    if (f.wheels[0].sub !== 'Shows the plan. Move it to match the watch.' || f.wheels[1].sub !== 'Off the watch.' || f.dVal !== 'enter minutes') throw new Error(k + ' dist subs or readout: ' + f.dVal);
    col(f.wheels[1], 0).wheel({ deltaY: 30 }); f = rf();
    if (f.dVal !== '7:30/mi' || f.dNote !== 'assuming planned 8 mi · 5:50/mi faster than target') throw new Error(k + ' hour: ' + f.dVal + ' | ' + f.dNote);
    for (let s2 = 0; s2 < 14; s2++) { col(f.wheels[1], 1).wheel({ deltaY: -30 }); f = rf(); }
    if (faces(f.wheels[1]) !== '1 46 00' || f.dVal !== '13:15/mi' || f.dNote !== 'assuming planned 8 mi · 5s/mi faster than target') throw new Error(k + ' 1:46: ' + faces(f.wheels[1]) + ' ' + f.dVal + ' | ' + f.dNote);
    col(f.wheels[0], 1).wheel({ deltaY: 30 }); f = rf();
    if (faces(f.wheels[0]) !== '8 .1 0' || f.dVal !== '13:05/mi' || f.dNote !== '15s/mi faster than target') throw new Error(k + ' 8.1: ' + f.dVal + ' | ' + f.dNote);
    f.log(); if (c.state.ran !== '1:46:00 · 8.10 mi · 13:05/mi' || !c.state.done[r]) throw new Error(k + ' log: ' + c.state.ran);
  } else {
    if (f.hasStrip || f.label !== 'Log the run' || !f.hasHint || f.hint !== 'Whole session off the watch. Warm up, efforts and recoveries all count.') throw new Error(k + ' no dose form: ' + f.label);
    if (f.wheels.map((w) => w.cap).join() !== 'Miles,Pace / mile' || faces(f.wheels[1]) !== '— 00' || f.hasDerived) throw new Error(k + ' no dose wheels: ' + faces(f.wheels[1]));
    col(f.wheels[0], 0).wheel({ deltaY: 30 }); f = rf(); col(f.wheels[0], 0).wheel({ deltaY: 30 }); f = rf();
    for (let s = 0; s < 8; s++) { col(f.wheels[1], 0).wheel({ deltaY: 30 }); f = rf(); }
    col(f.wheels[1], 1).wheel({ deltaY: -30 }); f = rf();
    if (faces(f.wheels[0]) !== '2 .0 0' || faces(f.wheels[1]) !== '11 59') throw new Error(k + ' wheels: ' + faces(f.wheels[0]) + ' / ' + faces(f.wheels[1]));
    f.log(); if (c.state.ran !== '2.00 mi · 11:59/mi' || !c.state.done[r]) throw new Error(k + ' log: ' + c.state.ran);
  }
  c.setState({ open: true }); f = rf();
  if (f.logLabel !== 'Logged ✓') throw new Error(k + ' log label: ' + f.logLabel);
  // Did a different activity: the picker, the bike form, the note, and back.
  if (f.pickOpen) throw new Error(k + ' picker open by itself');
  f.togglePick(); f = rf(); if (!f.pickOpen || f.chips.map((x) => x.label).join() !== 'Run · planned,Bike,Swim') throw new Error(k + ' chips: ' + f.chips.map((x) => x.label));
  f.chips[1].pick(); f = rf();
  if (!f.isBike || f.label !== 'Log the ride' || f.wheels.map((w) => w.cap).join() !== 'Time' || f.logLabel !== 'Log') throw new Error(k + ' bike form');
  if (f.swapNote !== 'Counts toward Bike, not Run. Your Run numbers are kept. Switch back and they return.') throw new Error(k + ' note: ' + f.swapNote);
  if (L.dose && (!f.hasStrip || f.stripLabel !== 'Bike · Planned' || f.stripVal !== (L.dose.k === 'time' ? L.dose.mins + ' min' : L.dose.mi + ' mi'))) throw new Error(k + ' bike strip: ' + f.stripVal);
  f.chips[2].pick(); f = rf(); if (!f.isSwimForm || f.label !== 'Log the swim') throw new Error(k + ' swim form');
  f.setYards({ target: { value: '800' } }); f = rf(); f.log(); if (c.state.ran !== 'Swim · 800 yd' || said !== 'Swim logged ✓') throw new Error(k + ' swim log: ' + c.state.ran);
  c.setState({ open: true }); f = rf(); f.chips[0].pick(); f = rf();
  if (!f.isRun || f.hasNote || f.logLabel !== 'Logged ✓' && f.logLabel !== 'Log') throw new Error(k + ' back to run');
  c.setState({ i: 0, open: false, rw: {}, sport: {}, spick: {}, rlog: {}, yards: {}, done: {}, ran: '', wdrag: null });
  return L.dose ? L.dose.k + ' dose ok' : 'no dose ok';
}

// The rest card against the app's rest sheet, values typed by hand from rest-day-shell.ts and the week's own plan.
export function restSmoke(c, d, k, WIN) {
  const r = d.cards.findIndex((x) => x.kind === 'rest');
  if (r < 0) return null;
  const R = d.cards[r], day = d.head.day;
  let said = ''; c.say = (t) => { said = t; };
  c.setState({ i: r, rest: {}, rw: {}, open: false });
  const rs = () => c.renderVals().rs;
  let v = c.renderVals(), f = v.rs;
  if (!v.c.showRest || v.showCta || d.cards.length !== 1 || v.ghosts.length || v.peekOn) throw new Error(k + ' rest deck shape');
  if (v.c.title !== 'Rest' || v.c.rx !== 'Recovery is where the work sets in. Move easy, refuel, sleep.') throw new Error(k + ' rest words');
  const fake = (x, y) => ({ clientX: x, clientY: y, target: { closest: () => null } });
  v.onDown(fake(100, 300)); c.renderVals().onMove(fake(260, 300)); if (c.state.dx !== 0) throw new Error(k + ' a one card deck swiped'); c.renderVals().onUp();
  if (!f.canMove || f.moveOpen || f.cardioOpen || f.cardioWord !== 'Log cardio' || !f.tipTxt || f.tipSrc !== '— NSW Physical Fitness Guide') throw new Error(k + ' rest closed');
  f.toMove(); f = rs();
  if (!f.moveOpen || f.moveIntro !== 'Nothing gets added. Whatever you pick moves to ' + day + ', and its old day becomes your rest.') throw new Error(k + ' move intro');
  const want = [['Posterior Chain', 'Monday'], ['Strength Support', 'Tuesday'], ['Leg Strength + Mobility', 'Thursday'], ['Recovery Lift', 'Friday'], ['Post-Run Mobility', 'Saturday']];
  if (JSON.stringify(f.cands.map((x) => [x.title, x.desc])) !== JSON.stringify(want.map(([t, l]) => [t, l + ' · not logged']))) throw new Error(k + ' cands: ' + f.cands.map((x) => x.title));
  if (f.hasPick) throw new Error(k + ' picked before a pick');
  if (day === 'Wednesday') {
    // Friday's push lands between Tuesday's push and Thursday's legs: one clash, Tuesday.
    f.cands[3].pick(); f = rs();
    if (!f.hasWarn || f.warnTtl !== 'That’s push on top of push' || f.warnSub !== 'You have push work on Tuesday too. Stack it here and something gives. Your call.') throw new Error(k + ' push clash: ' + f.warnTtl);
    // Thursday's legs move here and Thursday becomes the rest: no clash with the day it left.
    f.cands[2].pick(); f = rs(); if (f.hasWarn) throw new Error(k + ' warned about the day the session leaves');
    f.applyMove(); f = rs();
    if (!f.isMoved || f.canMove || f.movedTag !== 'Moved here from Thursday' || f.movedLine !== 'Leg Strength + Mobility is on Wednesday now. Thursday is your rest.' || said !== 'Moved. Thursday is your rest now ✓') throw new Error(k + ' moved: ' + f.movedLine + ' ' + said);
    f.unmove(); f = rs(); if (f.isMoved || !f.canMove) throw new Error(k + ' put back');
  } else {
    for (const x of f.cands) { x.pick(); f = rs(); if (f.hasWarn) throw new Error(k + ' Sunday clash on ' + x.title); }
  }
  f.toCardio(); f = rs();
  if (f.moveOpen || !f.cardioOpen || f.cTitle !== 'What did you do?' || f.cIntro !== 'Easy work on a rest day is recovery, not extra load. This will not touch your program.') throw new Error(k + ' cardio open');
  if (f.types.map((x) => x.label).join() !== 'Run,Walk' || f.wheels.map((w) => w.cap).join() !== 'Time,Distance' || f.rpes.map((x) => x.head).join() !== 'RPE 5 · Easy,RPE 7 · Steady,RPE 9+ · Hard') throw new Error(k + ' cardio fields');
  f.log(); if (said !== 'Nothing to log yet. Add a time or a distance.' || rs().hasLines) throw new Error(k + ' empty log: ' + said);
  const L0 = {}; WIN.addEventListener = (t, h) => { L0[t] = h; }; WIN.removeEventListener = () => {};
  f.wheels[0].cols.filter((x) => x.isCol)[1].down({ clientY: 100, stopPropagation() {}, currentTarget: { closest: () => null } });
  L0.pointerup({ clientY: 1000 }); f = rs();
  for (let s2 = 0; s2 < 3; s2++) { f.wheels[1].cols.filter((x) => x.isCol)[0].wheel({ deltaY: 30 }); f = rs(); }
  f.wheels[1].cols.filter((x) => x.isCol)[1].wheel({ deltaY: 30 }); f = rs();
  f.rpes[0].pick(); f = rs();
  f.log(); f = rs();
  if (said !== '30 min run logged ✓' || f.cardioOpen || f.cardioWord !== 'Edit cardio' || f.lines.map((x) => x.text).join() !== '30 min run logged · 3.1 mi · RPE 5') throw new Error(k + ' logged: ' + said + ' ' + f.lines.map((x) => x.text));
  f.toMove(); f = rs(); if (!f.hasAlready || f.already[0].text !== '30 min run · 3.1 mi · RPE 5' || f.alreadyTail !== 'Move a session in and ' + day + ' is a double day. Your call.') throw new Error(k + ' already');
  f.toCardio(); f = rs();
  if (f.cTitle !== 'Your run on ' + day || f.logLabel !== 'Logged ✓' || !f.hasClear || f.clearLabel !== 'Clear this run' || f.types[0].label !== 'Run ✓') throw new Error(k + ' edit: ' + f.cTitle + ' ' + f.logLabel);
  f.rpes[2].pick(); f = rs(); if (!f.hard || f.logLabel !== 'Log it') throw new Error(k + ' hard');
  f.types[1].pick(); f = rs();
  if (f.wheels.map((w) => w.cap).join() !== 'Time' || f.cTitle !== 'What did you do?') throw new Error(k + ' walk');
  f.log(); if (said !== 'Nothing to log yet. Add a time.') throw new Error(k + ' walk empty: ' + said);
  f.types[0].pick(); f = rs(); f.clear(); f = rs(); if (f.clearLabel !== 'Tap again to clear' || !f.hasLines) throw new Error(k + ' armed'); f.clear(); f = rs();
  if (f.hasLines || f.hasClear || f.cardioWord !== 'Log cardio') throw new Error(k + ' cleared');
  c.setState({ rest: {}, rw: {} });
  return 'rest ok';
}
