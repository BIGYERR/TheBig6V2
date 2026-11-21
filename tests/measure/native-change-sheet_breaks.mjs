// native-change-sheet: when one rule of the Expo app's Hurt? and Traveling?, of its chips, of This Week's two dates,
// of its date box or of its copy button is broken, which test files go red? Read-only on this checkout (measure).
// Each break changes one rule in a copy of the tree: a rule of the date words, the chips or the draft
// (frontends/native/src/change-sheet/overlay-readers.ts), of the writes (overlay-writes.ts), of the two dates
// (week-dates/week-dates.ts), of the date box's sums (date-box/date-box.ts), of the copied text
// (program-list/list-readers.ts, list-screen.ts), of a model that is today's file (change-sheet-model.ts), or of the
// screens' drawing and wiring (ChangeSheet.tsx, ChangeChips.tsx, DateBox.tsx, ThisWeek.tsx, App.tsx, Programs.tsx).
// The fast files are run on each, and the ten program sweep only on a break they let through; the files and tests
// that turn red are counted. A break no file turns red on is a rule no test holds.
//
// The page is not broken: these are the Expo app's own files, so the tests that hold the beta against today's page
// see every break as a difference between the two.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-change-sheet_breaks.mjs <scratch>/tree [--only <text in a break's name>]
//        (writes tests/measure/native-change-sheet_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-change-sheet_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-change-sheet_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-change-sheet_breaks.mjs --check
//        (names every break whose text is not in its file once; exit 1 when there is one)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name) => (process.argv.indexOf(name) > 0 ? process.argv[process.argv.indexOf(name) + 1] : null);
const merging = process.argv[2] === '--merge';
const checking = process.argv[2] === '--check';
const tree = !merging && !checking && process.argv[2] ? resolve(process.argv[2]) : null;
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-change-sheet_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-change-sheet.test.ts', 'unit/native-program-list.test.ts', 'integration/native-change-sheet.test.ts'];
const SLOW = ['sweeps/native-change-sheet.test.ts'];
const N = 'frontends/native/src/';
const READ = N + 'change-sheet/overlay-readers.ts', WRITE = N + 'change-sheet/overlay-writes.ts', MODEL = N + 'change-sheet/change-sheet-model.ts';
const SHEET = N + 'change-sheet/ChangeSheet.tsx', CHIPS = N + 'change-sheet/ChangeChips.tsx';
const DATES = N + 'week-dates/week-dates.ts', BOX = N + 'date-box/date-box.ts', BOXC = N + 'date-box/DateBox.tsx';
const APP = N + 'App.tsx', WEEK = N + 'this-week/ThisWeek.tsx';
const LREAD = N + 'program-list/list-readers.ts', LSCREEN = N + 'program-list/list-screen.ts', LIST = N + 'program-list/Programs.tsx';

const ASK = "((ov.lastAsk || ov.created) || now)";
const SPAN_END = "fmtDate(ov.from) + '–' + (sameMonth ? String(t.getDate()) : fmtDate(ov.to));";
const TRIP = "const ov: StoredOverlay = { id: 'ov_' + now, type: 'substitute', from, to, patch: { equipment: d.equipment }, note: '', created: now };";
const HURT = "const ov: StoredOverlay = { id: 'ov_' + now, type: 'injury', from, to: null, patch: { injury: { region: R, tier: T } }, note: '', created: now };";
const BRIDGE = "s.prog.overlays.push({ id: 'ov_' + now, type: 'injury', from: today, to: addDaysIso(today, 6, day), patch: { injury: { region, tier: 'workaround', bridge: true } }, note: '', created: now });";
const HALF = "s.prog.overlays.push({ id: 'ov_' + (now + 1), type: 'injury', from: addDaysIso(today, 7, day), to: addDaysIso(today, 13, day), patch: { injury: { region, tier: 'workaround', halfstep: true } }, note: '', created: now + 1 });";
const SUPP = "const hadRunSuppression = !!((pw && RUN_SUPPRESSED[pw.cardioMode as string]) || (pp && RUN_SUPPRESSED[pp.cardioMode as string]));";
const HOLDS = "const holdsTest = !!(partial && week1Train.length === 0 && rt && rt >= d && rt <= sun);";
const START_REFRESH = "const next = tp ? refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram : prog;";
const RACE_REFRESH = "const next = refreshStoredProgram(store, prog as unknown as StoredProgram, now, failed) as unknown as DatedProgram;";
const PIN = "if (tp && prog.cfg) { prog.cfg._testWeek = tp.tw; prog.cfg._raceDateCappedWeeks = tp.tw || tp.len; }";
const RS = "return (c && (c.cardioTypes || []).includes('run') && g && PACE_GOALS.has(g.id) && c.eventTargeted !== false && c.raceDate) ? c.raceDate : null;";
const ALIGN = "const al = (c.cardioTypes && c.cardioTypes.includes('run') && c.cardioGoals && c.cardioGoals.run) ? raceAlignment(c.cardioGoals.run.id, c.raceDate, c.eventTargeted !== false) : null;";
const PICK = "onChange={(e, d) => { if (e.type !== 'set' || !d) return; setDay(d); ask.onChange(pickedValue(d)); }}";
const TOOK_ORDER = "    if (r.prog) setHeld(r.prog as unknown as DeckProgram);\n    setWrites((n) => n + 1);\n    if (r.toast) say(r.toast);\n    if (r.pop) {";

/** [the file, the rule broken, the text it replaces (once in the file), its replacement]. */
const BREAKS = [
  // ── The date words (overlay-readers.ts) ──
  [READ, "a date that does not read counts from the epoch", "const d = _parseLocalDate(iso) || new Date(now);", "const d = _parseLocalDate(iso) || new Date(0);"],
  [READ, "a day some days on is one day short", "d.setDate(d.getDate() + n);", "d.setDate(d.getDate() + n - 1);"],
  [READ, "a blank date reads as nothing", "{ month: 'short', day: 'numeric' }) : 'Set date';", "{ month: 'short', day: 'numeric' }) : '';"],
  [READ, "a date carries its year", "{ month: 'short', day: 'numeric' }) : 'Set date';", "{ month: 'short', day: 'numeric', year: 'numeric' }) : 'Set date';"],
  [READ, "the weekday keeps its comma", "{ weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '') : '';", "{ weekday: 'short', month: 'short', day: 'numeric' }) : '';"],
  [READ, "a span counts one of its ends", "return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;", "return Math.round((b.getTime() - a.getTime()) / 86400000);"],
  [READ, "a span that does not read counts one day", "if (!a || !b) return 0;\n  return Math.round(", "if (!a || !b) return 1;\n  return Math.round("],
  [READ, "the day count's word has no capital", "(w ? w.charAt(0).toUpperCase() + w.slice(1) : String(nd))", "(w ? w : String(nd))"],
  [READ, "one day reads One days", "(nd === 1 ? ' day' : ' days')", "' days'"],
  [READ, "fourteen days is a figure", "'thirteen', 'fourteen'];", "'thirteen'];"],
  [READ, "an open span is named with its weekday", "if (!ov.to) return 'From ' + fmtDate(ov.from);", "if (!ov.to) return 'From ' + fmtDateWd(ov.from);"],
  [READ, "whole weeks start on a Sunday", "const wholeWeeks = f.getDay() === 1 && t.getDay() === 0;", "const wholeWeeks = f.getDay() === 0 && t.getDay() === 0;"],
  [READ, "any span that ends on a Sunday is whole weeks", "const wholeWeeks = f.getDay() === 1 && t.getDay() === 0;", "const wholeWeeks = t.getDay() === 0;"],
  [READ, "any span that starts on a Monday is whole weeks", "const wholeWeeks = f.getDay() === 1 && t.getDay() === 0;", "const wholeWeeks = f.getDay() === 1;"],
  [READ, "one whole week is named Weeks", "return r.fromWeek === r.toWeek ? ('Week ' + r.fromWeek) : ('Weeks '", "return false ? ('Week ' + r.fromWeek) : ('Weeks '"],
  [READ, "two whole weeks are named by the first", "return r.fromWeek === r.toWeek ? ('Week ' + r.fromWeek) : ('Weeks '", "return true ? ('Week ' + r.fromWeek) : ('Weeks '"],
  [READ, "one day is named as a span", "  if (ov.from === ov.to) return fmtDateWd(ov.from);\n", ""],
  [READ, "a span across two months drops the second", SPAN_END, "fmtDate(ov.from) + '–' + String(t.getDate());"],
  [READ, "a span inside a month says its month twice", SPAN_END, "fmtDate(ov.from) + '–' + fmtDate(ov.to);"],
  [READ, "the program picks back up on the last day covered", "const next = addDaysIso(ov.to, 1, now);", "const next = addDaysIso(ov.to, 0, now);"],
  [READ, "the program's last week is past its end", "if (tw && wk != null && wk > tw) return", "if (tw && wk != null && wk >= tw) return"],
  [READ, "nothing runs to the end of the program", "if (tw && wk != null && wk > tw) return", "if (tw && wk != null && wk > tw + 999) return"],
  [READ, "a program with no length runs to its end", "if (tw && wk != null && wk > tw) return", "if (wk != null && wk > tw) return"],
  [READ, "a trip is titled Trip", "substitute: 'Travel', injury", "substitute: 'Trip', injury"],
  [READ, "an injury is titled Hurt", "injury: 'Injury', reduce", "injury: 'Hurt', reduce"],
  [READ, "Less time has no title", "reduce: 'Less time', suspend", "suspend"],
  [READ, "Suspended has no title", ", suspend: 'Suspended' };", " };"],
  [READ, "Room only is named Room", "bodyweight: 'Room only',", "bodyweight: 'Room',"],
  [READ, "Mini gym is named Hotel gym", "home_basic: 'Mini gym',", "home_basic: 'Hotel gym',"],
  [READ, "Full gym has no name on a chip", "commercial: 'Full gym', ", ""],
  [READ, "Home Full has no name on a chip", "home_full: 'Home Full', ", ""],
  [READ, "CrossFit Box has no name on a chip", "crossfit: 'CrossFit Box', ", ""],
  [READ, "Minimal / Travel has no name on a chip", ", minimal: 'Minimal / Travel' };", " };"],
  [READ, "the ✕ is called Remove", "export const CHIP_REMOVE = 'Remove change';", "export const CHIP_REMOVE = 'Remove';"],
  // ── The chips (overlay-readers.ts overlayChips) ──
  [READ, "a change that ended yesterday is drawn", "    if (to && to < today) return;\n", ""],
  [READ, "a change that ends today is hidden", "if (to && to < today) return;", "if (to && to <= today) return;"],
  [READ, "a change outside the program is drawn", "    if (!overlayWeekRange(prog, ov, tw)) return;\n    const backOn", "    const backOn"],
  [READ, "back to normal is the last day covered", "fmtDateWd(addDaysIso(ov.to, 1, new Date(now)))", "fmtDateWd(addDaysIso(ov.to, 0, new Date(now)))"],
  [READ, "a change with no end says nothing of it", ": ' Open-ended.';", ": '';"],
  [READ, "a return week reads as an injury", "const isBridge = !!inj && !!inj.bridge;", "const isBridge = false;"],
  [READ, "the week after a return week is a return week", "const isBridge = !!inj && !!inj.bridge;", "const isBridge = !!inj && (!!inj.bridge || !!inj.halfstep);"],
  [READ, "a trip that carries an injury reads as one", "const inj = ov.type === 'injury' && ov.patch && ov.patch.injury ? ov.patch.injury : null;", "const inj = ov.patch && ov.patch.injury ? ov.patch.injury : null;"],
  [READ, "a return week in a region with no name is named by its key", "('Return week · ' + (r ? r.label : 'Injury') + '. One light week, then full send.')", "('Return week · ' + (r ? r.label : inj.region) + '. One light week, then full send.')"],
  [READ, "an injury in a region with no name is named by its key", ": ((r ? r.label : 'Injury') + (inj.tier", ": ((r ? r.label : inj.region) + (inj.tier"],
  [READ, "a return week's line is One light week", "'. One light week, then full send.')", "'. One light week.')"],
  [READ, "a protected injury reads as worked around", "(inj.tier === 'protect' ? ' (protected)' : ' (working around it)')", "' (working around it)'"],
  [READ, "a worked around injury reads as protected", "(inj.tier === 'protect' ? ' (protected)' : ' (working around it)')", "' (protected)'"],
  [READ, "a gear with no name reads Modified", "patchLbl = CHIP_GEAR[ov.patch.equipment] || ov.patch.equipment;", "patchLbl = CHIP_GEAR[ov.patch.equipment] || 'Modified';"],
  [READ, "a change with no gear reads as nothing", "let patchLbl = 'Modified';", "let patchLbl = '';"],
  [READ, "an injury with an end still says Tap I'm back", "(inj && !ov.to ? ' Tap I’m back when it’s ready.' : backOn)", "(inj ? ' Tap I’m back when it’s ready.' : backOn)"],
  [READ, "an open injury says Open-ended", "(inj && !ov.to ? ' Tap I’m back when it’s ready.' : backOn)", "(backOn)"],
  [READ, "a trip with no end says Tap I'm back", "(inj && !ov.to ? ' Tap I’m back when it’s ready.' : backOn)", "(!ov.to ? ' Tap I’m back when it’s ready.' : backOn)"],
  [READ, "a return week's line says when it ends", "const tail = isBridge ? '' : (", "const tail = false ? '' : ("],
  [READ, "a return week is titled Injury", "title: (isBridge ? 'Return week' : (OVERLAY_TYPE_LABEL", "title: (false ? 'Return week' : (OVERLAY_TYPE_LABEL"],
  [READ, "a kind with no name has no title", "(OVERLAY_TYPE_LABEL[ov.type] || 'Change'))", "(OVERLAY_TYPE_LABEL[ov.type] || ''))"],
  [READ, "a chip's title loses its span", " + ' · ' + overlaySpanLabel(prog, ov),", " + ' · ',"],
  [READ, "a return week's line ends with a second full stop", "sub: patchLbl + (isBridge ? '' : '.') + tail,", "sub: patchLbl + '.' + tail,"],
  [READ, "a chip's line has no full stop", "sub: patchLbl + (isBridge ? '' : '.') + tail,", "sub: patchLbl + tail,"],
  [READ, "a return week offers I'm back", "back: !!inj && !isBridge,", "back: !!inj,"],
  [READ, "a trip offers I'm back", "back: !!inj && !isBridge,", "back: !isBridge,"],
  [READ, "a chip carries another's id", "kind: 'chip', id: ov.id,", "kind: 'chip', id: 'ov_' + ov.created,"],
  [READ, "a return week is asked about", "if (inj && !isBridge && !ov.to) {", "if (inj && !ov.to) {"],
  [READ, "an injury with an end is asked about", "if (inj && !isBridge && !ov.to) {", "if (inj && !isBridge) {"],
  [READ, "the check in counts from when the injury was set", ASK, "((ov.created) || now)"],
  [READ, "the check in counts from the last answer alone", ASK, "((ov.lastAsk) || now)"],
  [READ, "an injury with no stamp is asked about at once", ASK, "((ov.lastAsk || ov.created) || 0)"],
  [READ, "the check in comes a day early", "export const CHECK_IN_MS = 14 * 86400000;", "export const CHECK_IN_MS = 13 * 86400000;"],
  [READ, "the check in waits a millisecond more", "if (since >= CHECK_IN_MS) {", "if (since > CHECK_IN_MS) {"],
  [READ, "the check in names a region with no name as nothing", ".label || 'it';", ".label || '';"],
  [READ, "the check in keeps its region's capitals", "'Two weeks on the ' + rl.toLowerCase() + ' plan. How is it feeling?'", "'Two weeks on the ' + rl + ' plan. How is it feeling?'"],
  [READ, "the check in asks How does it feel", "' plan. How is it feeling?'", "' plan. How does it feel?'"],
  [READ, "the check in is titled Checking in", "kind: 'checkin', id: ov.id, title: 'Check in',", "kind: 'checkin', id: ov.id, title: 'Checking in',"],
  [READ, "the check in's Same and Worse change places", "{ ans: 'same', label: 'Same' }, { ans: 'worse', label: 'Worse' }]", "{ ans: 'worse', label: 'Worse' }, { ans: 'same', label: 'Same' }]"],
  [READ, "Better is labelled Good", "{ ans: 'better', label: 'Better' }", "{ ans: 'better', label: 'Good' }"],
  // ── The draft (overlay-readers.ts) ──
  [READ, "a new draft is on Mini gym", "equipment: 'minimal', tab: 'travel', injRegion: null, injTier: 'workaround' };", "equipment: 'home_basic', tab: 'travel', injRegion: null, injTier: 'workaround' };"],
  [READ, "Traveling? opens on today whatever it last held", "const from = d.from || isoToday(now);", "const from = isoToday(now);"],
  [READ, "Traveling? opens for a week", "to: d.to || addDaysIso(from, 13, now), equipment: 'home_basic' };", "to: d.to || addDaysIso(from, 6, now), equipment: 'home_basic' };"],
  [READ, "Traveling? forgets the Through it held", "to: d.to || addDaysIso(from, 13, now), equipment: 'home_basic' };", "to: addDaysIso(from, 13, now), equipment: 'home_basic' };"],
  [READ, "Traveling? keeps the gear it last held", ", equipment: 'home_basic' };\n}", " };\n}"],
  [READ, "Traveling? stays on the tab it was on", "type: 'substitute', tab: 'travel', from,", "type: 'substitute', from,"],
  [READ, "Hurt? keeps the region it last held", "injRegion: inj ? inj.region : null,", "injRegion: inj ? inj.region : d.injRegion,"],
  [READ, "Hurt? opens on Protect it", "injTier: inj ? inj.tier : 'workaround',", "injTier: inj ? inj.tier : 'protect',"],
  [READ, "Hurt? ignores the live injury's tier", "injTier: inj ? inj.tier : 'workaround',", "injTier: 'workaround',"],
  [READ, "Hurt? ignores the live injury", "const inj = live && live.patch ? live.patch.injury : null;", "const inj = live && !live.patch ? live.patch!.injury : null;"],
  [READ, "Hurt? keeps the From it last held", "tab: 'injury', from: isoToday(now) };", "tab: 'injury' };"],
  [READ, "Hurt? stays on the tab it was on", "type: 'injury', tab: 'injury', from", "type: 'injury', from"],
  [READ, "a From past Through carries nothing", "if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) next.to = addDaysIso(v, 13, now);", "if ((a ? a.getTime() : 0) < 0) next.to = addDaysIso(v, 13, now);"],
  [READ, "a From on Through's own day carries Through", "if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) next.to", "if ((a ? a.getTime() : 0) <= (b ? b.getTime() : 0)) next.to"],
  [READ, "Through is carried a week on", "next.to = addDaysIso(v, 13, now);", "next.to = addDaysIso(v, 7, now);"],
  [READ, "a choice is not written to the draft", "const next: OverlayDraft = { ...d, [k]: v };", "const next: OverlayDraft = { ...d };"],
  [READ, "the sheet takes any span as inside the program", "inProgram: (ov: PreviewOverlay) => !!overlayWeekRange(prog, ov, tw),", "inProgram: () => true,"],
  [READ, "the sheet reads a program of 99 weeks", "const tw = (prog && prog.totalWeeks) || 0;\n  return {\n    fmtDate,", "const tw = 99;\n  return {\n    fmtDate,"],
  // ── A model that is today's file ──
  [MODEL, "the sheet's model drifts from today's", "export const INJ_SAFETY = 'If it is sharp,", "export const INJ_SAFETY = 'If it is very sharp,"],
  // ── The writes (overlay-writes.ts): today's words ──
  [WRITE, "Pick a region is reworded", "region: 'Pick a region',", "region: 'Pick one',"],
  [WRITE, "the date outside the program is reworded", "dateOutside: 'That date falls outside your program',", "dateOutside: 'That date is outside your program',"],
  [WRITE, "Working around it is reworded", "workaround: 'Working around it ✓',", "workaround: 'Working around it',"],
  [WRITE, "Protected is reworded", "protect: 'Protected. Train around it ✓',", "protect: 'Protected ✓',"],
  [WRITE, "Pick both dates is reworded", "bothDates: 'Pick both dates',", "bothDates: 'Pick two dates',"],
  [WRITE, "Through before From is reworded", "backwards: '“Through” can’t be before “From”',", "backwards: 'Through can’t be before From',"],
  [WRITE, "the range outside the program is reworded", "rangeOutside: 'That range is outside your program',", "rangeOutside: 'That range falls outside your program',"],
  [WRITE, "Change applied is reworded", "applied: 'Change applied ✓',", "applied: 'Applied ✓',"],
  [WRITE, "Change removed is reworded", "removed: 'Change removed ✓',", "removed: 'Removed ✓',"],
  [WRITE, "the snooze is reworded", "snoozed: 'Staying on the plan. It will ask again in two weeks.',", "snoozed: 'Staying on the plan.',"],
  // ── Traveling?'s Apply change ──
  [WRITE, "a full gym trip is stored", "  if (d.equipment === 'commercial') return { toast: null, closed: true };\n", ""],
  [WRITE, "a full gym leaves the sheet open", "if (d.equipment === 'commercial') return { toast: null, closed: true };", "if (d.equipment === 'commercial') return { toast: null, closed: false };"],
  [WRITE, "a trip with no Through passes the first guard", "if (!from || !to) return { toast: OVERLAY_TOASTS.bothDates, closed: false };", "if (!from) return { toast: OVERLAY_TOASTS.bothDates, closed: false };"],
  [WRITE, "a trip with no From passes the first guard", "if (!from || !to) return { toast: OVERLAY_TOASTS.bothDates, closed: false };", "if (!to) return { toast: OVERLAY_TOASTS.bothDates, closed: false };"],
  [WRITE, "a Through before From passes its guard", "  if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) return { toast: OVERLAY_TOASTS.backwards, closed: false };\n", ""],
  [WRITE, "a trip of one day is refused", "if ((a ? a.getTime() : 0) < (b ? b.getTime() : 0)) return { toast: OVERLAY_TOASTS.backwards", "if ((a ? a.getTime() : 0) <= (b ? b.getTime() : 0)) return { toast: OVERLAY_TOASTS.backwards"],
  [WRITE, "a trip outside the program is stored", "if (!overlayWeekRange(s.prog, { type: 'substitute', from, to, patch: { equipment: d.equipment } }, tw)) return", "if (false) return"],
  [WRITE, "a trip is weighed against a program of 99 weeks", "const tw = s.prog.totalWeeks || 0;", "const tw = 99;"],
  [WRITE, "a trip's id is not its instant", TRIP, TRIP.replace("id: 'ov_' + now", "id: 'ov_' + from")],
  [WRITE, "a trip is stored as another kind", TRIP, TRIP.replace("type: 'substitute'", "type: 'travel'")],
  [WRITE, "a trip stores Mini gym whatever was picked", TRIP, TRIP.replace("equipment: d.equipment", "equipment: 'home_basic'")],
  [WRITE, "a trip stores no note", TRIP, TRIP.replace(", note: ''", "")],
  [WRITE, "a trip is not stamped", TRIP, TRIP.replace(", created: now", "")],
  [WRITE, "a trip ends the day before its Through", TRIP, TRIP.replace("from, to, patch", "from, to: from, patch")],
  [WRITE, "a trip is put first in the list", "s.prog.overlays.push(ov);\n  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.applied", "s.prog.overlays.unshift(ov);\n  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.applied"],
  [WRITE, "a trip is not stored before the rebuild", "  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.applied", "  return { toast: OVERLAY_TOASTS.applied"],
  [WRITE, "a trip rebuilds nothing", "return { toast: OVERLAY_TOASTS.applied, closed: true, prog: refresh(s, now, failed) };", "return { toast: OVERLAY_TOASTS.applied, closed: true, prog: s.prog };"],
  [WRITE, "a trip leaves the sheet open", "return { toast: OVERLAY_TOASTS.applied, closed: true,", "return { toast: OVERLAY_TOASTS.applied, closed: false,"],
  [WRITE, "a trip says nothing", "return { toast: OVERLAY_TOASTS.applied, closed: true,", "return { toast: null, closed: true,"],
  // ── Hurt?'s Apply change ──
  [WRITE, "a region the app does not train around is stored", "if (!R || !INJURY_REGIONS[R]) return { toast: OVERLAY_TOASTS.region, closed: false };", "if (!R) return { toast: OVERLAY_TOASTS.region, closed: false };"],
  [WRITE, "no region passes the first guard", "if (!R || !INJURY_REGIONS[R]) return { toast: OVERLAY_TOASTS.region, closed: false };", "if (R && !INJURY_REGIONS[R]) return { toast: OVERLAY_TOASTS.region, closed: false };"],
  [WRITE, "a blank From is not today", "const from = d.from || isoToday(new Date(now));", "const from = d.from || '';"],
  [WRITE, "an injury outside the program is stored", "if (!overlayWeekRange(s.prog, { type: 'injury', from, to: null, patch: {} }, s.prog.totalWeeks || 0)) return", "if (false) return"],
  [WRITE, "an injury's id is not its instant", HURT, HURT.replace("id: 'ov_' + now", "id: 'ov_' + from")],
  [WRITE, "an injury is stored as another kind", HURT, HURT.replace("type: 'injury'", "type: 'hurt'")],
  [WRITE, "an injury is stored with an end", HURT, HURT.replace("to: null", "to: from")],
  [WRITE, "an injury is stored worked around whatever was picked", HURT, HURT.replace("tier: T", "tier: 'workaround'")],
  [WRITE, "an injury is stored in another region", HURT, HURT.replace("region: R", "region: 'knee'")],
  [WRITE, "an injury stores no note", HURT, HURT.replace(", note: ''", "")],
  [WRITE, "an injury is not stamped", HURT, HURT.replace(", created: now", "")],
  [WRITE, "an injury is not stored before the rebuild", "  saveOverlays(s);\n  return { toast: T === 'protect'", "  return { toast: T === 'protect'"],
  [WRITE, "an injury rebuilds nothing", "OVERLAY_TOASTS.workaround, closed: true, prog: refresh(s, now, failed) };", "OVERLAY_TOASTS.workaround, closed: true, prog: s.prog };"],
  [WRITE, "an injury leaves the sheet open", "OVERLAY_TOASTS.workaround, closed: true,", "OVERLAY_TOASTS.workaround, closed: false,"],
  [WRITE, "Protect it says Working around it", "toast: T === 'protect' ? OVERLAY_TOASTS.protect : OVERLAY_TOASTS.workaround,", "toast: OVERLAY_TOASTS.workaround,"],
  [WRITE, "Work around it says Protected", "toast: T === 'protect' ? OVERLAY_TOASTS.protect : OVERLAY_TOASTS.workaround,", "toast: OVERLAY_TOASTS.protect,"],
  // ── The ✕ ──
  [WRITE, "the ✕ keeps the change and removes the others", "s.prog.overlays = s.prog.overlays.filter((o) => o && o.id !== id);\n  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.removed", "s.prog.overlays = s.prog.overlays.filter((o) => o && o.id === id);\n  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.removed"],
  [WRITE, "the ✕ is not stored before the rebuild", "  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.removed", "  return { toast: OVERLAY_TOASTS.removed"],
  [WRITE, "the ✕ rebuilds nothing", "return { toast: OVERLAY_TOASTS.removed, closed: false, prog: refresh(s, now, failed) };", "return { toast: OVERLAY_TOASTS.removed, closed: false, prog: s.prog };"],
  [WRITE, "the ✕ says nothing", "return { toast: OVERLAY_TOASTS.removed, closed: false, prog:", "return { toast: null, closed: false, prog:"],
  [WRITE, "the ✕ with no list in hand throws", "export function removeOverlay(s: OverlaySession, id: string, now: number, failed: RefreshReport): OverlayTap | null {\n  if (!Array.isArray(s.prog.overlays)) return null;\n", "export function removeOverlay(s: OverlaySession, id: string, now: number, failed: RefreshReport): OverlayTap | null {\n"],
  // ── I'm back ──
  [WRITE, "I'm back on a change that is no injury does nothing", "if (!ov || !ov.patch || !ov.patch.injury) return removeOverlay(s, id, now, failed);", "if (!ov || !ov.patch || !ov.patch.injury) return null;"],
  [WRITE, "I'm back keeps the injury", "  s.prog.overlays = s.prog.overlays.filter((o) => o && o.id !== id);\n  const day = new Date(now)", "  const day = new Date(now)"],
  [WRITE, "the return week is six days", BRIDGE, BRIDGE.replace("addDaysIso(today, 6, day)", "addDaysIso(today, 5, day)")],
  [WRITE, "the return week starts tomorrow", BRIDGE, BRIDGE.replace("from: today,", "from: addDaysIso(today, 1, day),")],
  [WRITE, "the return week is a plain injury", BRIDGE, BRIDGE.replace(", bridge: true", "")],
  [WRITE, "the return week protects", BRIDGE, BRIDGE.replace("tier: 'workaround'", "tier: 'protect'")],
  [WRITE, "the return week's id is a millisecond on", BRIDGE, BRIDGE.replace("id: 'ov_' + now,", "id: 'ov_' + (now + 2),")],
  [WRITE, "the return week stores no note", BRIDGE, BRIDGE.replace(", note: ''", "")],
  [WRITE, "the return week is not stamped", BRIDGE, BRIDGE.replace(", created: now", "")],
  [WRITE, "every region gets the week after", "  if (hadRunSuppression) {\n    s.prog.overlays.push", "  if (true) {\n    s.prog.overlays.push"],
  [WRITE, "no region gets the week after", "  if (hadRunSuppression) {\n    s.prog.overlays.push", "  if (false) {\n    s.prog.overlays.push"],
  // Every region whose running stops, stops on both tiers (injuryPlan: a lower back and a hip easy and no impact with
  // a swim, a knee easy and no impact, an ankle and a calf reduced and no impact), so one mode taken out of the table
  // alone, or one tier left unread, changes nothing. Each break here takes out both modes of a region.
  [WRITE, "a region's running is judged by neither plan", SUPP, "const hadRunSuppression = false && !!(pw || pp);"],
  [WRITE, "a lower back and a hip did not have their running taken away", "{ easy: 1, reduce: 1, noimpact: 1, noimpact_swim: 1 };", "{ reduce: 1, noimpact: 1 };"],
  [WRITE, "an ankle and a calf did not have their running taken away", "{ easy: 1, reduce: 1, noimpact: 1, noimpact_swim: 1 };", "{ easy: 1, noimpact_swim: 1 };"],
  [WRITE, "the week after starts a day late", HALF, HALF.replace("from: addDaysIso(today, 7, day)", "from: addDaysIso(today, 8, day)")],
  [WRITE, "the week after is six days", HALF, HALF.replace("to: addDaysIso(today, 13, day)", "to: addDaysIso(today, 12, day)")],
  [WRITE, "the week after shares the return week's id", HALF, HALF.replace("id: 'ov_' + (now + 1)", "id: 'ov_' + now")],
  [WRITE, "the week after is a plain injury", HALF, HALF.replace(", halfstep: true", "")],
  [WRITE, "the week after is stamped as the return week", HALF, HALF.replace("created: now + 1 });", "created: now });")],
  [WRITE, "I'm back is not stored before the rebuild", "  saveOverlays(s);\n  const prog = refresh(s, now, failed);", "  const prog = refresh(s, now, failed);"],
  [WRITE, "I'm back rebuilds nothing", "const prog = refresh(s, now, failed);\n  const lbl", "const prog = s.prog;\n  const lbl"],
  [WRITE, "one week back says Good", "msg: 'Good. One week to prove it.',", "msg: 'Good.',"],
  [WRITE, "one week back names its region with capitals", "sub: 'The ' + lbl.toLowerCase() + ' work comes back light", "sub: 'The ' + lbl + ' work comes back light"],
  [WRITE, "one week back holds RPE 8", "work comes back light this week, held at RPE 7. Full send next week.'", "work comes back light this week, held at RPE 8. Full send next week.'"],
  [WRITE, "one week back in a region with no name says it", ".label || 'injury';", ".label || 'it';"],
  [WRITE, "one week back's button is OK", "Full send next week.', dismiss: 'Let’s go' } },", "Full send next week.', dismiss: 'OK' } },"],
  [WRITE, "one week back's icon is a warning", "opts: { icon: 'shield', kicker: 'Back in', msg: 'Good. One week to prove it.'", "opts: { icon: 'warning', kicker: 'Back in', msg: 'Good. One week to prove it.'"],
  [WRITE, "one week back raises another tier", "pop: { tier: 'workout', opts: { icon: 'shield', kicker: 'Back in', msg: 'Good. One week to prove it.'", "pop: { tier: 'streak', opts: { icon: 'shield', kicker: 'Back in', msg: 'Good. One week to prove it.'"],
  [WRITE, "two weeks back says Good", "msg: 'Good. Two weeks to full send.', sub, dismiss", "msg: 'Good.', sub, dismiss"],
  [WRITE, "two weeks back's kicker is Back", "kicker: 'Back in', msg: 'Good. Two weeks to full send.'", "kicker: 'Back', msg: 'Good. Two weeks to full send.'"],
  [WRITE, "two weeks back's button is OK", "sub, dismiss: 'Let’s go' } } };", "sub, dismiss: 'OK' } } };"],
  [WRITE, "two weeks back's line is cut short", "Next week your quality running returns at pace with reduced volume. Full prescription the week after.';", "Next week your quality running returns at pace with reduced volume.';"],
  [WRITE, "the pace clock speaks for every run goal", "if (rg.id === 'run_pace_goal') {", "if (rg.id !== '') {"],
  [WRITE, "the pace clock never speaks", "if (rg.id === 'run_pace_goal') {", "if (rg.id === 'run_pace') {"],
  [WRITE, "the pace clock reads the program's first week", "const n = map && tw ? (map[tw] || 0) : 0;", "const n = map && tw ? (map[1] || 0) : 0;"],
  [WRITE, "the pace clock's first line is reworded", "sub += ' Your pace targets resume where you left off, not where the calendar says.';", "sub += ' Your pace targets resume where you left off.';"],
  [WRITE, "race day moves on a dated goal", "sub += (cfg.raceDate && cfg.eventTargeted !== false)", "sub += (cfg.raceDate && cfg.eventTargeted === false)"],
  [WRITE, "race day does not move on an undated goal", "sub += (cfg.raceDate && cfg.eventTargeted !== false)", "sub += (cfg.eventTargeted !== false)"],
  [WRITE, "race day's line is reworded", "' Race day does not move. Your interval cards now show the revised realistic pace for it.'", "' Race day does not move.'"],
  [WRITE, "one more week reads weeks", "(n === 1 ? 'week' : 'weeks')", "'weeks'"],
  [WRITE, "more weeks read week", "(n === 1 ? 'week' : 'weeks')", "'week'"],
  [WRITE, "the weeks' line is reworded", "' than this block has. The interval cards show the honest target.'", "' than this block has.'"],
  // ── The check in's answers ──
  [WRITE, "Same is not stamped", "  ov.lastAsk = now; saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.snoozed", "  saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.snoozed"],
  [WRITE, "Same is not stored", "  ov.lastAsk = now; saveOverlays(s);\n  return { toast: OVERLAY_TOASTS.snoozed", "  ov.lastAsk = now;\n  return { toast: OVERLAY_TOASTS.snoozed"],
  [WRITE, "Same says nothing", "return { toast: OVERLAY_TOASTS.snoozed, closed: false };", "return { toast: null, closed: false };"],
  [WRITE, "Worse is not stamped", "    ov.lastAsk = now; saveOverlays(s);\n    return {\n      toast: null, closed: false,\n      pop: { tier: 'workout', opts: { icon: 'warning'", "    saveOverlays(s);\n    return {\n      toast: null, closed: false,\n      pop: { tier: 'workout', opts: { icon: 'warning'"],
  [WRITE, "Worse is not stored", "    ov.lastAsk = now; saveOverlays(s);\n    return {\n      toast: null, closed: false,\n      pop: { tier: 'workout', opts: { icon: 'warning'", "    ov.lastAsk = now;\n    return {\n      toast: null, closed: false,\n      pop: { tier: 'workout', opts: { icon: 'warning'"],
  [WRITE, "Better stamps the ask", "  if (ans === 'better') {\n    return {", "  if (ans === 'better') {\n    ov.lastAsk = now;\n    return {"],
  [WRITE, "Worse is the snooze", "  if (ans === 'worse') {", "  if (ans === 'worst') {"],
  [WRITE, "Same raises Better's pop-up", "  if (ans === 'better') {\n    return {", "  if (ans === 'better' || ans === 'same') {\n    return {"],
  [WRITE, "Good sign is reworded", "kicker: 'Check in', msg: 'Good sign.',", "kicker: 'Check in', msg: 'Good.',"],
  [WRITE, "Good sign's line is cut short", "sub: 'Ready to bring it back, or give it more time? Coming back starts with one light week.',", "sub: 'Ready to bring it back, or give it more time?',"],
  [WRITE, "Good sign's first button is Back", "{ label: 'I’m back', cls: 'go',", "{ label: 'Back', cls: 'go',"],
  [WRITE, "Good sign's second button is Later", "{ label: 'More time', cls: 'skip',", "{ label: 'Later', cls: 'skip',"],
  [WRITE, "Good sign's first button has the second's class", "{ label: 'I’m back', cls: 'go',", "{ label: 'I’m back', cls: 'skip',"],
  [WRITE, "Good sign's first handler is not today's", "onclick: \"popClose();imBackFromInjury('\" + id + \"')\" },", "onclick: \"imBackFromInjury('\" + id + \"')\" },"],
  [WRITE, "Good sign's second handler is not today's", "onclick: \"popClose();injSnooze('\" + id + \"')\" },", "onclick: \"popClose();injSnooze(\" + id + \")\" },"],
  [WRITE, "Good sign's buttons change places in what they do", "acts: [{ kind: 'back', id }, { kind: 'snooze', id }],", "acts: [{ kind: 'snooze', id }, { kind: 'back', id }],"],
  [WRITE, "Good sign has one button that does anything", "acts: [{ kind: 'back', id }, { kind: 'snooze', id }],", "acts: [{ kind: 'back', id }],"],
  [WRITE, "trending worse is reworded", "msg: 'Two weeks and trending worse.',", "msg: 'Two weeks and worse.',"],
  [WRITE, "trending worse's line is cut short", "Get it looked at. The plan keeps protecting it in the meantime.', dismiss: 'Understood'", "Get it looked at.', dismiss: 'Understood'"],
  [WRITE, "trending worse's button is OK", "in the meantime.', dismiss: 'Understood' } },", "in the meantime.', dismiss: 'OK' } },"],
  [WRITE, "trending worse's icon is a shield", "opts: { icon: 'warning', kicker: 'Check in', msg: 'Two weeks and trending worse.'", "opts: { icon: 'shield', kicker: 'Check in', msg: 'Two weeks and trending worse.'"],
  [WRITE, "the stored program takes the list of the first program", "const i = progs.findIndex((p) => p.id === s.prog.id);\n  if (i >= 0) { progs[i]!.overlays", "const i = progs.length ? 0 : -1;\n  if (i >= 0) { progs[i]!.overlays"],
  // ── The two dates (week-dates.ts) ──
  [DATES, "a program with no run has a test date", RS, RS.replace("(c.cardioTypes || []).includes('run') && ", "")],
  [DATES, "a race goal has a test date", RS, RS.replace("PACE_GOALS.has(g.id) && ", "")],
  [DATES, "a goal with the event off has a test date", RS, RS.replace("c.eventTargeted !== false && ", "")],
  [DATES, "a date that does not read is the epoch", "if (!d) { d = new Date(now); d.setHours(0, 0, 0, 0); }", "if (!d) { d = new Date(0); d.setHours(0, 0, 0, 0); }"],
  [DATES, "a Monday is a short week", "const partial = offset > 0;", "const partial = offset >= 0;"],
  [DATES, "the entered day is not trained", "const week1Train = _ISO_ORDER.slice(offset).filter((k) => !rest.has(k));", "const week1Train = _ISO_ORDER.slice(offset + 1).filter((k) => !rest.has(k));"],
  [DATES, "rest days are trained", "const rest = new Set(Array.isArray(restDays) ? restDays : []);", "const rest = new Set<unknown>([]);"],
  [DATES, "the week ends on its Saturday", "sun.setDate(mon.getDate() + 6);", "sun.setDate(mon.getDate() + 5);"],
  [DATES, "a test on the entered day is not held", HOLDS, HOLDS.replace("rt >= d", "rt > d")],
  [DATES, "a test on that Sunday is not held", HOLDS, HOLDS.replace("rt <= sun", "rt < sun")],
  [DATES, "a test before the entered day is held", HOLDS, HOLDS.replace("rt >= d && ", "")],
  [DATES, "a test after that Sunday is held", HOLDS, HOLDS.replace(" && rt <= sun", "")],
  [DATES, "a whole week holds the test", HOLDS, HOLDS.replace("partial && ", "")],
  [DATES, "a week with a training day left holds the test", HOLDS, HOLDS.replace("week1Train.length === 0 && ", "")],
  [DATES, "a week that holds the test still moves", "if (partial && week1Train.length === 0 && !holdsTest) {", "if (partial && week1Train.length === 0) {"],
  [DATES, "a Monday with no training day moves", "if (partial && week1Train.length === 0 && !holdsTest) {", "if (week1Train.length === 0 && !holdsTest) {"],
  [DATES, "a short week with a training day left moves", "if (partial && week1Train.length === 0 && !holdsTest) {", "if (partial && !holdsTest) {"],
  [DATES, "a moved start is the entered day", "return { start: _isoOf(nm), entered: _isoOf(d), mon: _isoOf(nm), partial: false, snapped: true,", "return { start: _isoOf(d), entered: _isoOf(d), mon: _isoOf(nm), partial: false, snapped: true,"],
  [DATES, "a moved start does not say it moved", "mon: _isoOf(nm), partial: false, snapped: true,", "mon: _isoOf(nm), partial: false, snapped: false,"],
  [DATES, "a moved start lists the short week's days", "snapped: true, week1Train: _ISO_ORDER.filter((k) => !rest.has(k)), nextMon", "snapped: true, week1Train, nextMon"],
  [DATES, "a start moves two Mondays on", "nm.setDate(mon.getDate() + 7); nm.setHours(0, 0, 0, 0);\n    return {", "nm.setDate(mon.getDate() + 14); nm.setHours(0, 0, 0, 0);\n    return {"],
  [DATES, "a short week's Monday is the next one", "mon: _isoOf(mon), partial, snapped: false, week1Train, nextMon: _isoOf(nm) };", "mon: _isoOf(nm), partial, snapped: false, week1Train, nextMon: _isoOf(nm) };"],
  [DATES, "every start says whether it holds the test", "return holdsTest ? { ...r, holdsTest: true } : r;", "return { ...r, holdsTest: holdsTest as true };"],
  [DATES, "the program in hand is stored first in the list", "if (idx >= 0) { programs[idx] = prog; writePrograms(store, programs as never); }", "if (idx >= 0) { programs[0] = prog; writePrograms(store, programs as never); }"],
  [DATES, "a blank race date is said not to resolve", "if (!dateStr || !prog || !prog.cfg) return null;", "if (!prog || !prog.cfg) return null;"],
  [DATES, "a race date that does not resolve is kept", "if (!al) { c.raceDate = before; return", "if (!al) { return"],
  [DATES, "a race date that does not resolve reads as set", "return { toast: DATE_TOASTS.unresolved, prog, set: false };", "return { toast: DATE_TOASTS.unresolved, prog, set: true };"],
  [DATES, "a race with the event off is laid back", ALIGN, ALIGN.replace("c.eventTargeted !== false)", "true)")],
  [DATES, "a program with no run is laid back from a race", ALIGN, ALIGN.replace("c.cardioTypes && c.cardioTypes.includes('run') && ", "")],
  [DATES, "the race date leaves the start where it was", "  prog.startDate = al.start;\n", ""],
  [DATES, "the race date is not stored before the rebuild", "  keep(store, prog);\n  " + RACE_REFRESH, "  " + RACE_REFRESH],
  [DATES, "the race date rebuilds nothing", RACE_REFRESH, "const next = prog;"],
  [DATES, "the race date's toast puts the start first", "'Race day ' + fmtStartDay(al.raceIso) + ' — plan starts ' + fmtStartDay(al.start) + ' ✓'", "'Race day ' + fmtStartDay(al.start) + ' — plan starts ' + fmtStartDay(al.raceIso) + ' ✓'"],
  [DATES, "the race date's toast is reworded", "' — plan starts '", "', plan starts '"],
  [DATES, "a blank start date is today", "if (!dateStr || !prog) return null;", "if (!prog) return null;"],
  [DATES, "the start is the entered day whatever the week holds", "prog.startDate = r.start;", "prog.startDate = r.entered;"],
  [DATES, "the start's rest days are not read", "(prog.cfg && prog.cfg.restDays) || [], rsRace(prog.cfg)", "[], rsRace(prog.cfg)"],
  [DATES, "the start is not given the test date", "|| [], rsRace(prog.cfg), new Date(now));", "|| [], null, new Date(now));"],
  [DATES, "a dated test's week is not pinned again", PIN, PIN.replace("prog.cfg._testWeek = tp.tw; ", "")],
  [DATES, "a dated test's cap is the goal's length whatever its week", PIN, PIN.replace("tp.tw || tp.len", "tp.len")],
  [DATES, "a dated test's cap is not written", PIN, PIN.replace(" prog.cfg._raceDateCappedWeeks = tp.tw || tp.len;", "")],
  [DATES, "a dated test's start rebuilds nothing", START_REFRESH, "const next = prog;"],
  [DATES, "every start date rebuilds", START_REFRESH, START_REFRESH.replace("const next = tp ? ", "const next = prog ? ")],
  [DATES, "the start date is not stored", "  keep(store, prog);\n  " + START_REFRESH, "  " + START_REFRESH],
  [DATES, "a week that holds the test says only that it is short", "const toast = r.holdsTest ? DATE_TOASTS.holdsTest", "const toast = !r.partial ? DATE_TOASTS.holdsTest"],
  [DATES, "a moved start says only that it is set", ": (r.snapped ? 'Nothing to train that week. Starts '", ": (!r.entered ? 'Nothing to train that week. Starts '"],
  [DATES, "a moved start's toast names the entered day", "'Nothing to train that week. Starts ' + fmtStartDay(r.start) + ' ✓'", "'Nothing to train that week. Starts ' + fmtStartDay(r.entered) + ' ✓'"],
  [DATES, "a moved start's toast is reworded", "'Nothing to train that week. Starts '", "'Nothing to train then. Starts '"],
  [DATES, "a short week and a whole one change toasts", "(r.partial ? DATE_TOASTS.short : DATE_TOASTS.set)", "(r.partial ? DATE_TOASTS.set : DATE_TOASTS.short)"],
  [DATES, "the unresolved toast is reworded", "unresolved: 'That date didn’t resolve',", "unresolved: 'That date did not resolve',"],
  [DATES, "the test week's toast is reworded", "holdsTest: 'That week holds your test. Nothing left to train before it ✓',", "holdsTest: 'That week holds your test ✓',"],
  [DATES, "the short week's toast is reworded", "short: 'Start date set. Short first week ✓',", "short: 'Start date set. Short week ✓',"],
  [DATES, "the start's toast is reworded", "  set: 'Start date set ✓',", "  set: 'Start set ✓',"],
  [DATES, "the title always goes back to today's", "return { reset: cw !== own, own: cw };", "return { reset: true, own: cw };"],
  [DATES, "the title never goes back to today's", "return { reset: cw !== own, own: cw };", "return { reset: false, own: cw };"],
  [DATES, "the screen keeps the week it held after a date", "return { reset: cw !== own, own: cw };", "return { reset: cw !== own, own: own === null ? cw : own };"],
  // ── The date box's sums (date-box.ts) ──
  [BOX, "the calendar opens on today whatever the field holds", "  if (d) return d;\n", ""],
  [BOX, "a blank field's calendar opens on the epoch", "const t = new Date(now); t.setHours(0, 0, 0, 0);\n  return t;", "const t = new Date(0); t.setHours(0, 0, 0, 0);\n  return t;"],
  [BOX, "a blank field's calendar keeps the hour", "const t = new Date(now); t.setHours(0, 0, 0, 0);\n  return t;", "const t = new Date(now);\n  return t;"],
  [BOX, "a picked day is written as its day in Greenwich", "export function pickedValue(d: Date): string { return _isoOf(d); }", "export function pickedValue(d: Date): string { return d.toISOString().slice(0, 10); }"],
  [BOX, "Reset writes a zero", "export const RESET_VALUE = '';", "export const RESET_VALUE = '0';"],
  [BOX, "Reset is named Clear", "reset: 'Reset',", "reset: 'Clear',"],
  [BOX, "Done is named OK", "done: 'Done' }", "done: 'OK' }"],
  // ── The copied text (list-readers.ts, list-screen.ts) ──
  [LREAD, "the copied text's first line is reworded", "'THE ASYLUM — Program selections',", "'THE ASYLUM, Program selections',"],
  [LREAD, "the copied name has no label", "    'Name: ' + s.name,", "    s.name,"],
  [LREAD, "the copied goal is its key", "'Goal: ' + (GOAL_LABELS[s.goal] || s.goal || '—')", "'Goal: ' + (s.goal || '—')"],
  [LREAD, "a goal with no name is copied as nothing", "(GOAL_LABELS[s.goal] || s.goal || '—') + ' | Lift focus: '", "(GOAL_LABELS[s.goal] || s.goal || '') + ' | Lift focus: '"],
  [LREAD, "the copied focus and path change places", "' | Lift focus: ' + s.liftLabel + ' | Path: ' + s.pathLabel,", "' | Lift focus: ' + s.pathLabel + ' | Path: ' + s.liftLabel,"],
  [LREAD, "the copied age is the experience", "'Experience: ' + s.experience + ' | Age: ' + s.ageBracket", "'Experience: ' + s.experience + ' | Age: ' + s.experience"],
  [LREAD, "the copied gear and units change places", "' | Equip: ' + s.equipLabel + ' | Units: ' + s.unit,", "' | Equip: ' + s.unit + ' | Units: ' + s.equipLabel,"],
  [LREAD, "the copied train days are keys", "'Train days: ' + (s.trainDays.map((d) => DAYF[d] || d).join(', ') || '—')", "'Train days: ' + (s.trainDays.join(', ') || '—')"],
  [LREAD, "the copied rest days are keys", "' | Rest: ' + (s.restDays.map((d) => DAYF[d] || d).join(', ') || 'none')", "' | Rest: ' + (s.restDays.join(', ') || 'none')"],
  [LREAD, "no rest days are copied as nothing", ".join(', ') || 'none') + ' | Length: '", ".join(', ') || '') + ' | Length: '"],
  [LREAD, "the copied length has no unit", "' | Length: ' + s.length + ' wks',", "' | Length: ' + s.length,"],
  [LREAD, "lifts from experience are not marked", "'Starting 1RM' + (s.lifts.estimated ? ' (est. from experience)' : '') + ': squat '", "'Starting 1RM' + ': squat '"],
  [LREAD, "entered lifts are marked as estimates", "'Starting 1RM' + (s.lifts.estimated ? ' (est. from experience)' : '') + ': squat '", "'Starting 1RM' + (!s.lifts.estimated ? ' (est. from experience)' : '') + ': squat '"],
  [LREAD, "the copied bench and squat change places", "': squat ' + s.lifts.squat + ' / bench ' + s.lifts.bench +", "': squat ' + s.lifts.bench + ' / bench ' + s.lifts.squat +"],
  [LREAD, "the copied deadlift has no unit", "' / deadlift ' + s.lifts.deadlift + ' ' + s.unit,", "' / deadlift ' + s.lifts.deadlift,"],
  [LREAD, "a lifter's cardio is copied as nothing", ".join(', ') : 'lift only'),", ".join(', ') : ''),"],
  [LREAD, "a sport with no goal is copied as nothing", "c.type + '=' + (c.goal || 'general')", "c.type + '=' + (c.goal || '')"],
  [LREAD, "a sport is copied by its label", "s.cardio.map((c) => c.type + '=' +", "s.cardio.map((c) => c.label + '=' +"],
  [LREAD, "the run anchor's line is not copied", "  if (s.runAnchor) lines.push(runAnchorLine(s.runAnchor));\n", ""],
  [LREAD, "the event's line is copied for every program", "  if (s.eventTargeted) lines.push('Event: '", "  if (true) lines.push('Event: '"],
  [LREAD, "an event with no date is copied as nothing", "(s.raceStr || 'no date')", "(s.raceStr || '')"],
  [LREAD, "the event's countdown is not copied", "+ (s.raceOut ? ' (' + (s.raceOut as unknown as { copy: string }).copy + ')' : ''));", ");"],
  [LREAD, "the event's countdown is the card's", "(s.raceOut as unknown as { copy: string }).copy", "(s.raceOut as unknown as { card: string }).card"],
  [LREAD, "a seed of zero is not copied", "  if (s.seed != null) lines.push('Seed: ' + s.seed);", "  if (s.seed) lines.push('Seed: ' + s.seed);"],
  [LREAD, "the copied toast is reworded", "export const COPIED = 'Selections copied ✓';", "export const COPIED = 'Copied ✓';"],
  [LREAD, "a clamped entry is not said", "const prov = a.clamped ? `entry", "const prov = false ? `entry"],
  [LREAD, "a clamped entry that does not read is copied as zero", "${a.rawSec > 0 ? _fmtMileAnchor(a.rawSec) : 'invalid'} clamped", "${_fmtMileAnchor(a.rawSec)} clamped"],
  [LREAD, "a fast clamp is said to be the slowest row", "chart's ${a.clamped === 'fast' ? 'fastest' : 'slowest'} row`\n    : a.kind === 'seeded' ? `seeded from", "chart's ${'slowest'} row`\n    : a.kind === 'seeded' ? `seeded from"],
  [LREAD, "a seeded mile is copied as entered", ": a.kind === 'seeded' ? `seeded from ${a.prog || 'previous block'}", ": a.kind === 'sown' ? `seeded from ${a.prog || 'previous block'}"],
  [LREAD, "a seeded mile with no program names none", "`seeded from ${a.prog || 'previous block'},", "`seeded from ${a.prog},"],
  [LREAD, "one recovery run reads runs", "logged recovery run${a.n === 1 ? '' : 's'}`\n    : a.kind === 'edited'", "logged recovery runs`\n    : a.kind === 'edited'"],
  [LREAD, "an edited mile is copied as entered", ": a.kind === 'edited' ? `edited in week ${a.wk}`", ": a.kind === 'changed' ? `edited in week ${a.wk}`"],
  [LREAD, "an entered mile is copied as the default", ": a.kind === 'entered' ? 'entered' : a.exp + ' default, no mile time entered';", ": a.exp + ' default, no mile time entered';"],
  [LREAD, "the anchor's line keeps its first chip", "const chips = runAnchorChips(a).slice(1).map((c) => `${c.k.toLowerCase()} ${c.v}`).join(' / ');", "const chips = runAnchorChips(a).map((c) => `${c.k.toLowerCase()} ${c.v}`).join(' / ');"],
  [LREAD, "the anchor's paces keep their capitals", "map((c) => `${c.k.toLowerCase()} ${c.v}`).join(' / ');", "map((c) => `${c.k} ${c.v}`).join(' / ');"],
  [LREAD, "every anchor says Week 1 runs off this row", "const scope = (a.goalId === 'run_pace_goal') ? ' | Week 1", "const scope = (a.goalId !== '') ? ' | Week 1"],
  [LREAD, "the anchor's line is reworded", "return `Run anchor: ${m} mile (${prov}) → ${chips}${scope}`;", "return `Anchor: ${m} mile (${prov}) → ${chips}${scope}`;"],
  [LSCREEN, "the copied lines are joined by spaces", "return p ? progSelLines(p, now).join('\\n') : null;", "return p ? progSelLines(p, now).join(' ') : null;"],
  [LSCREEN, "a program that is gone copies a blank", "return p ? progSelLines(p, now).join('\\n') : null;", "return p ? progSelLines(p, now).join('\\n') : '';"],
  [LSCREEN, "the copy reads the first stored program", "const p = (readPrograms(store) as unknown as ListProgram[]).find((x) => x.id === id);\n  return p ? progSelLines", "const p = (readPrograms(store) as unknown as ListProgram[])[0];\n  return p ? progSelLines"],
  [LIST, "the copy button says Copied before the clipboard answers", "if (text !== null) Clipboard.setStringAsync(text).then(() => say(COPIED), () => say(COPIED)); }}", "if (text !== null) { say(COPIED); Clipboard.setStringAsync(text); } }}"],
  [LIST, "a clipboard that refuses says nothing", "then(() => say(COPIED), () => say(COPIED)); }}", "then(() => say(COPIED), () => {}); }}"],
  [LIST, "the copy button takes no press", "onPress={() => { const text = copyText(store, c.id, new Date()); if (text !== null) Clipboard", "onLongPress={() => { const text = copyText(store, c.id, new Date()); if (text !== null) Clipboard"],
  // ── The sheet's drawing (ChangeSheet.tsx) ──
  [SHEET, "an unpicked card shows its line", "{c.desc !== null && <Text style={[s.eqDesc, { color: p.muted }]}>{c.desc}</Text>}", "{<Text style={[s.eqDesc, { color: p.muted }]}>{c.desc}</Text>}"],
  [SHEET, "every card shows a check", "{c.sel && <Text style={[s.eqChk, { color: p.text }]}>✓</Text>}", "{<Text style={[s.eqChk, { color: p.text }]}>✓</Text>}"],
  [SHEET, "an effect with no title draws a blank one", "{e.title !== null && <Text style={[s.effectTtl, { color: p.text }]}>{e.title}</Text>}", "{<Text style={[s.effectTtl, { color: p.text }]}>{e.title}</Text>}"],
  [SHEET, "a line with no words takes a line's height", "(x.text === '' ? null : <Text key={i}", "(x.text === null ? null : <Text key={i}"],
  [SHEET, "a later line of the effect has no gap", "x.style !== null && x.style.includes('margin-top:6px') && s.subGap", "x.style === null && s.subGap"],
  [SHEET, "a card writes another field", "onPress={() => hold(setDraft(now.current, c.key, c.id, new Date()))}", "onPress={() => hold(setDraft(now.current, 'equipment', c.id, new Date()))}"],
  [SHEET, "a date box opens the calendar with no earliest day", "onPress={() => onDate({ value: f.value, min: f.min, onChange:", "onPress={() => onDate({ value: f.value, min: null, onChange:"],
  [SHEET, "a date box opens the calendar on a blank", "onPress={() => onDate({ value: f.value, min: f.min, onChange:", "onPress={() => onDate({ value: '', min: f.min, onChange:"],
  [SHEET, "a date picked writes From whatever the box", "onChange: (iso) => hold(setDraft(now.current, f.key, iso, new Date())) })}", "onChange: (iso) => hold(setDraft(now.current, 'from', iso, new Date())) })}"],
  [SHEET, "the app is not told of the draft", "const hold = (d: OverlayDraft): void => { now.current = d; setDraftState(d); onDraft(d); };", "const hold = (d: OverlayDraft): void => { now.current = d; setDraftState(d); };"],
  [SHEET, "Got it applies the draft", "    if (a === 'close') { leave(); return; }\n", ""],
  [SHEET, "Traveling?'s Apply change applies an injury", "const r = a === 'travel' ? applyOverlayDraft(session, now.current, Date.now(), report) : applyInjuryDraft(session, now.current, Date.now(), report);", "const r = a !== 'travel' ? applyOverlayDraft(session, now.current, Date.now(), report) : applyInjuryDraft(session, now.current, Date.now(), report);"],
  [SHEET, "a refusal closes the sheet", "if (!r.closed) { if (r.toast) say(r.toast); return; }", "if (!r.closed) { if (r.toast) say(r.toast); }"],
  [SHEET, "a refusal says nothing", "if (!r.closed) { if (r.toast) say(r.toast); return; }", "if (!r.closed) { return; }"],
  [SHEET, "the toast comes before the program in hand", "leave(() => { onDone(r); if (r.toast) say(r.toast); });", "leave(() => { if (r.toast) say(r.toast); onDone(r); });"],
  [SHEET, "Apply change hands back no program", "leave(() => { onDone(r); if (r.toast) say(r.toast); });", "leave(() => { if (r.toast) say(r.toast); });"],
  [SHEET, "Traveling?'s dates stand under its gear", "              {view.travel.dates && dates(view.travel.dates, false)}\n              {label(SHEET_WORDS.gear)}\n              {view.travel.cards.map(card)}\n", "              {label(SHEET_WORDS.gear)}\n              {view.travel.cards.map(card)}\n              {view.travel.dates && dates(view.travel.dates, false)}\n"],
  [SHEET, "Hurt?'s From stands above what changes", "              {view.injury.effect && effect(view.injury.effect)}\n              {view.injury.dates && dates(view.injury.dates, true)}\n", "              {view.injury.dates && dates(view.injury.dates, true)}\n              {view.injury.effect && effect(view.injury.effect)}\n"],
  [SHEET, "How bad is it stands with no tiers under it", "{view.injury.tiers && label(SHEET_WORDS.howBad, true)}", "{label(SHEET_WORDS.howBad, true)}"],
  [SHEET, "the sheet's gear label is reworded", "gear: 'What you’ll have',", "gear: 'What you will have',"],
  [SHEET, "the foot's Apply change is reworded", "apply: 'Apply change',", "apply: 'Apply',"],
  [SHEET, "a card's second line is iOS's own height", "eqDesc: { fontFamily: TEXT, fontSize: 12, lineHeight: 16, marginTop: 2 },", "eqDesc: { fontFamily: TEXT, fontSize: 12, paddingBottom: 1.7, marginTop: 2 },"],
  [SHEET, "the date box's label stands 0.7 high", "paddingBottom: 1.7, marginBottom: 4.7 },", "paddingBottom: 1.7, marginBottom: 4 },"],
  [SHEET, "the effect stands 0.6 low", "paddingTop: 14, marginTop: 11.4, marginBottom: 16 },", "paddingTop: 14, marginTop: 12, marginBottom: 16 },"],
  [SHEET, "the effect's later lines keep 6", "subGap: { marginTop: 5.7 },", "subGap: { marginTop: 6 },"],
  // ── The chips' drawing (ChangeChips.tsx) ──
  [CHIPS, "the check in has a red edge", "style={[s.chip, { backgroundColor: p.surface, borderColor: p.border2, borderLeftColor: p.accent }]}", "style={[s.chip, { backgroundColor: p.surface, borderColor: c.kind === 'checkin' ? p.red : p.border2, borderLeftColor: p.accent }]}"],
  [CHIPS, "I'm back is in ink", "<Text style={[s.actText, { color: p.red }]}>I’m back</Text>", "<Text style={[s.actText, { color: p.text }]}>I’m back</Text>"],
  [CHIPS, "the chips stand apart", "wrap: { marginTop: 8 },", "wrap: { marginTop: 8, gap: 8 },"],
  [CHIPS, "a chip's line keeps 17.4", "fontSize: 12, lineHeight: 17, marginTop: 3 },", "fontSize: 12, lineHeight: 17.4, marginTop: 3 },"],
  [CHIPS, "no chip still draws the gap above", "  if (!chips.length) return null;\n", ""],
  [CHIPS, "every chip offers I'm back", "{c.kind === 'chip' && c.back && (", "{c.kind === 'chip' && ("],
  [CHIPS, "I'm back removes the chip", "onPress={() => onBack(c.id)}", "onPress={() => onRemove(c.id)}"],
  [CHIPS, "the check in's answers are all Better", "onPress={() => onAnswer(c.id, a.ans)}", "onPress={() => onAnswer(c.id, 'better')}"],
  [CHIPS, "the check in has a ✕", "{c.kind === 'chip' && (\n            <Pressable testID=\"change-chip-x\"", "{(\n            <Pressable testID=\"change-chip-x\""],
  [CHIPS, "the ✕ is I'm back", "hitSlop={10} onPress={() => onRemove(c.id)}", "hitSlop={10} onPress={() => onBack(c.id)}"],
  [CHIPS, "a chip's title is its line", "<Text style={[s.ttl, { color: p.text }]}>{c.title}</Text>", "<Text style={[s.ttl, { color: p.text }]}>{c.sub}</Text>"],
  // ── This Week (ThisWeek.tsx) ──
  [WEEK, "the chips are drawn for a day ago", "chips={overlayChips(prog as unknown as OverlayProgram | null, now.getTime())}", "chips={overlayChips(prog as unknown as OverlayProgram | null, now.getTime() - 86400000)}"],
  [WEEK, "a chip's ✕ is handed up as I'm back", "onRemove={(id) => onAsk({ kind: 'remove', id })}", "onRemove={(id) => onAsk({ kind: 'back', id })}"],
  [WEEK, "a chip's I'm back is handed up as the ✕", "onBack={(id) => onAsk({ kind: 'back', id })}", "onBack={(id) => onAsk({ kind: 'remove', id })}"],
  [WEEK, "the check in's answer is not handed up", "onAnswer={(id, ans) => onAsk({ kind: 'answer', id, ans })} />", "onAnswer={() => {}} />"],
  [WEEK, "the Hurt? pill opens Traveling?", "onPress={() => onAsk({ kind: 'hurt' })}", "onPress={() => onAsk({ kind: 'travel' })}"],
  [WEEK, "Traveling? opens Hurt?", "<Pressable testID=\"week-travel\" accessibilityRole=\"button\" onPress={() => onAsk({ kind: 'travel' })}", "<Pressable testID=\"week-travel\" accessibilityRole=\"button\" onPress={() => onAsk({ kind: 'hurt' })}"],
  [WEEK, "the race date is set as a start date", "onAsk({ kind: 'date', which: 'race', value: view.row.iso })", "onAsk({ kind: 'date', which: 'start', value: view.row.iso })"],
  [WEEK, "the start date opens on a blank", "onAsk({ kind: 'date', which: 'start', value: view.row.iso })", "onAsk({ kind: 'date', which: 'start', value: '' })"],
  [WEEK, "Random Workout takes a press", "<View testID=\"week-random\" accessibilityRole=\"button\" accessibilityState={{ disabled: true }}", "<View testID=\"week-random\" accessibilityRole=\"button\""],
  [WEEK, "the chips stand above the two buttons", "          <View style={s.actions}>", "          <ChangeChips palette={p} chips={[]} onBack={() => {}} onRemove={() => {}} onAnswer={() => {}} />\n          <View style={s.actions}>"],
  [WEEK, "the app is not handed the program in hand", "  hand.prog = prog;\n", ""],
  [WEEK, "the screen's own week starts at week 1", "if (prog && hand.own === null) hand.own = currentWeek(prog, midnight(now));", "if (prog && hand.own === null) hand.own = 1;"],
  [WEEK, "a title picked is not the screen's own week", "if (t !== shown) { setShown(t); hand.own = Math.min(t, screen.totalWeeks); }", "if (t !== shown) { setShown(t); }"],
  [WEEK, "the title past the last week is the screen's own", "hand.own = Math.min(t, screen.totalWeeks); }", "hand.own = t; }"],
  [WEEK, "a day opened as its sheet is not the screen's own week", "    hand.own = week;\n    const grid = prog as unknown as SheetProgram;", "    const grid = prog as unknown as SheetProgram;"],
  [WEEK, "a day opened as a deck is not the screen's own week", "    hand.own = week;\n    const grid = prog as unknown as DeckProgram;", "    const grid = prog as unknown as DeckProgram;"],
  [WEEK, "a rest day opened is not the screen's own week", "if (prog) { hand.own = week; onRest(", "if (prog) { onRest("],
  [WEEK, "another program keeps the last one's week", "    hand.own = null;\n    if (shownPick !== null) setShown(null);", "    if (shownPick !== null) setShown(null);"],
  [WEEK, "a date that goes back to today's title keeps the title picked", "    placed.current = false;\n    setShown(null);\n    setPlaceTick((n) => n + 1);", "    placed.current = false;\n    setPlaceTick((n) => n + 1);"],
  [WEEK, "a date that goes back to today's title leaves the strip", "    placed.current = false;\n    setShown(null);\n    setPlaceTick((n) => n + 1);", "    setShown(null);\n    setPlaceTick((n) => n + 1);"],
  [WEEK, "the strip is not placed anew after a date", "useEffect(() => { place(); }, [place, progId, placeTick]);", "useEffect(() => { place(); }, [place, progId]);"],
  // ── The app (App.tsx) ──
  [APP, "This Week is not handed its asks", "hand={hand} resets={resets} onAsk={asked} onDeck=", "hand={hand} resets={resets} onAsk={() => {}} onDeck="],
  [APP, "This Week is not told of a title reset", "hand={hand} resets={resets} onAsk={asked} onDeck=", "hand={hand} resets={0} onAsk={asked} onDeck="],
  [APP, "Hurt? opens Traveling?'s draft", "const draft = ask.kind === 'hurt' ? openInjury(ovDraft.current, s.prog, now) : openTravel(ovDraft.current, now);", "const draft = ask.kind !== 'hurt' ? openInjury(ovDraft.current, s.prog, now) : openTravel(ovDraft.current, now);"],
  [APP, "the draft opened is not kept", "      ovDraft.current = draft;\n      setChange(", "      setChange("],
  [APP, "the draft is new at each sheet", "const draft = ask.kind === 'hurt' ? openInjury(ovDraft.current, s.prog, now) : openTravel(ovDraft.current, now);", "const draft = ask.kind === 'hurt' ? openInjury(newOverlayDraft(), s.prog, now) : openTravel(newOverlayDraft(), now);"],
  [APP, "the app answers the ✕ with I'm back","} else if (ask.kind === 'remove') took(s, removeOverlay(s, ask.id, now.getTime(), report));", "} else if (ask.kind === 'remove') took(s, imBackFromInjury(s, ask.id, now.getTime(), report));"],
  [APP, "I'm back is the ✕", "else if (ask.kind === 'back') took(s, imBackFromInjury(s, ask.id, now.getTime(), report));", "else if (ask.kind === 'back') took(s, removeOverlay(s, ask.id, now.getTime(), report));"],
  [APP, "the check in's answer is always Same", "else if (ask.kind === 'answer') took(s, injReassess(s, ask.id, ask.ans, now.getTime()));", "else if (ask.kind === 'answer') took(s, injReassess(s, ask.id, 'same', now.getTime()));"],
  [APP, "a date of the row has an earliest day", "else openDate({ value: ask.value, min: null, onChange: (iso) => dated(ask.which, iso) });", "else openDate({ value: ask.value, min: ask.value, onChange: (iso) => dated(ask.which, iso) });"],
  [APP, "a date of the row is always the start", "else openDate({ value: ask.value, min: null, onChange: (iso) => dated(ask.which, iso) });", "else openDate({ value: ask.value, min: null, onChange: (iso) => dated('start', iso) });"],
  [APP, "an ask is answered on the program the sheet opened on", "const session = (): OverlaySession | null => (hand.prog ? { store: phoneStore, prog: hand.prog as unknown as OverlayProgram } : null);", "const session = (): OverlaySession | null => (change ? change.session : hand.prog ? { store: phoneStore, prog: hand.prog as unknown as OverlayProgram } : null);"],
  [APP, "a chip's tap leaves the program in hand as it was", TOOK_ORDER, TOOK_ORDER.replace("    if (r.prog) setHeld(r.prog as unknown as DeckProgram);\n", "")],
  [APP, "a chip's tap does not draw This Week again", TOOK_ORDER, TOOK_ORDER.replace("    setWrites((n) => n + 1);\n", "")],
  [APP, "a chip's toast comes before the program in hand", TOOK_ORDER, "    if (r.toast) say(r.toast);\n    if (r.prog) setHeld(r.prog as unknown as DeckProgram);\n    setWrites((n) => n + 1);\n    if (r.pop) {"],
  [APP, "a chip's tap says nothing", TOOK_ORDER, TOOK_ORDER.replace("    if (r.toast) say(r.toast);\n", "")],
  [APP, "the pop-up reads the program before the tap", "const ps = { store: phoneStore, prog: r.prog || s.prog } as unknown as PopSession", "const ps = { store: phoneStore, prog: s.prog } as unknown as PopSession"],
  [APP, "the check in's pop-up has no buttons that act", "raise(ps, popOf(ps, r.pop, now, Math.random), null, r.acts || null);", "raise(ps, popOf(ps, r.pop, now, Math.random), null, null);"],
  [APP, "a button of the check in's pop-up is always More time", "took(s, a.kind === 'back' ? imBackFromInjury(s, a.id, Date.now(), report) : injSnooze(s, a.id, Date.now()));", "took(s, a.kind === 'snooze' ? imBackFromInjury(s, a.id, Date.now(), report) : injSnooze(s, a.id, Date.now()));"],
  [APP, "the check in's pop-up stays up after its button", "    const was = pop;\n    setPop(null);\n    if (was && was.acts) {", "    const was = pop;\n    if (was && was.acts) {"],
  [APP, "a pop-up raised by another's button shares its card", "setPop({ view, s, ask, acts, n: ++popN.current });", "setPop({ view, s, ask, acts, n: 1 });"],
  [APP, "the race date is set as a start date in the app", "const r = which === 'race' ? setProgRace(phoneStore, prog, iso, now, report) : setProgStart(phoneStore, prog, iso, now, report);", "const r = which !== 'race' ? setProgRace(phoneStore, prog, iso, now, report) : setProgStart(phoneStore, prog, iso, now, report);"],
  [APP, "a date leaves the program in hand as it was", "      setHeld(r.prog as unknown as DeckProgram);\n      const t = titleAfterDate(", "      const t = titleAfterDate("],
  [APP, "a date never sends the title back", "      if (t.reset) setResets((n) => n + 1);\n", ""],
  [APP, "a date does not keep the screen's new week", "      hand.own = t.own;\n", ""],
  [APP, "a date that sets nothing still moves the title", "    if (r.set) {\n      setHeld(r.prog as unknown as DeckProgram);", "    if (r) {\n      setHeld(r.prog as unknown as DeckProgram);"],
  [APP, "a date says nothing", "    setWrites((n) => n + 1);\n    say(r.toast);\n  };", "    setWrites((n) => n + 1);\n  };"],
  [APP, "the sheet's draft is not kept by the app", "onDraft={(d) => { ovDraft.current = d; }} onDate={openDate}", "onDraft={() => {}} onDate={openDate}"],
  [APP, "the sheet's date boxes open nothing", "onDraft={(d) => { ovDraft.current = d; }} onDate={openDate}", "onDraft={(d) => { ovDraft.current = d; }} onDate={() => {}}"],
  [APP, "Apply change leaves the program in hand as it was", "onDone={(r) => { if (r.prog) setHeld(r.prog as unknown as DeckProgram); setWrites((n) => n + 1); }} />", "onDone={() => { setWrites((n) => n + 1); }} />"],
  [APP, "the calendar stands under the sheet", "      {change && (\n        <ChangeSheet", "      {dateAsk && <DateBox key={'under' + dateAsk.n} palette={p} ask={dateAsk.ask} calm={calm} onClose={() => setDateAsk(null)} />}\n      {change && (\n        <ChangeSheet"],
  // ── The date box's wiring (DateBox.tsx) ──
  [BOXC, "a calendar dismissed writes its day", PICK, PICK.replace("if (e.type !== 'set' || !d) return;", "if (!d) return;")],
  [BOXC, "a day picked closes the box", PICK, PICK.replace("ask.onChange(pickedValue(d)); }}", "ask.onChange(pickedValue(d)); onClose(); }}")],
  [BOXC, "a day picked writes nothing until Done", PICK, PICK.replace(" ask.onChange(pickedValue(d));", "")],
  [BOXC, "Reset closes the box", "onPress={() => { ask.onChange(RESET_VALUE); setDay(calendarDay(RESET_VALUE, new Date())); }}", "onPress={() => { ask.onChange(RESET_VALUE); onClose(); }}"],
  [BOXC, "Reset writes nothing", "onPress={() => { ask.onChange(RESET_VALUE); setDay(calendarDay(RESET_VALUE, new Date())); }}", "onPress={() => { setDay(calendarDay(RESET_VALUE, new Date())); }}"],
  [BOXC, "Reset leaves the calendar on the day it held", "onPress={() => { ask.onChange(RESET_VALUE); setDay(calendarDay(RESET_VALUE, new Date())); }}", "onPress={() => { ask.onChange(RESET_VALUE); }}"],
  [BOXC, "the calendar has an earliest day", "          display=\"inline\"\n", "          display=\"inline\"\n          minimumDate={calendarDay(ask.min || '', new Date())}\n"],
  [BOXC, "the check does nothing", "accessibilityLabel={DATE_WORDS.done} hitSlop={8} onPress={onClose}", "accessibilityLabel={DATE_WORDS.done} hitSlop={8}"],
  [BOXC, "the calendar opens on today whatever the field", "useState(() => calendarDay(ask.value, new Date()))", "useState(() => calendarDay('', new Date()))"],
  [BOXC, "the calendar is a wheel", "          display=\"inline\"\n", "          display=\"spinner\"\n"],
  [BOXC, "a tap outside the calendar does nothing", "<Pressable testID=\"date-box-out\" accessibilityLabel=\"Close the calendar\" onPress={onClose}", "<Pressable testID=\"date-box-out\" accessibilityLabel=\"Close the calendar\""],
];

/** The files run in the copy: per file, how many tests failed (a file that could not load counts as failed whole). */
function run(files) {
  const out = join(tree, 'break-run.json');
  try { execFileSync('npx', ['vitest', 'run', ...files, '--reporter=json', '--outputFile=' + out], { cwd: TESTS, stdio: 'ignore' }); } catch { /* red is the point */ }
  const r = JSON.parse(readFileSync(out, 'utf8'));
  if (r.testResults.length !== files.length) throw new Error('the copy ran ' + r.testResults.length + ' files of ' + files.length);
  const red = {};
  let tests = 0;
  for (const f of r.testResults) {
    const name = files.find((x) => f.name.endsWith(x));
    const failed = f.assertionResults.filter((t) => t.status !== 'passed' && t.status !== 'pending' && t.status !== 'skipped').length;
    const n = f.status !== 'passed' ? Math.max(failed, 1) : 0;
    tests += f.assertionResults.length;
    if (n) red[name] = n;
  }
  return { files: red, tests };
}

const line = (list) => list.map((f) => '`' + f + '`').join(', ');
/** The report from every break's row: [n, file, rule, {file: tests red}, whether the sweep was run]. */
function report(rows, clean) {
  const say = [];
  say.push('# The Expo app\'s Hurt? and Traveling?, its chips, its two dates, its date box and its copy button: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-change-sheet_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
  say.push('');
  say.push('- The fast files, run on each break: ' + line(FAST) + '. Unbroken, they hold ' + clean.fast + ' tests and all pass.');
  say.push('- The sweep, run only on a break the fast files let through: ' + line(SLOW) + ' (' + clean.slow + ' tests, all passing unbroken).');
  say.push('');
  say.push('| # | File | The rule broken | Files red | Tests red | Which |');
  say.push('|---|---|---|---|---|---|');
  let missed = 0, swept = 0;
  for (const [n, file, rule, files, slow] of rows.sort((x, y) => x[0] - y[0])) {
    const names = Object.keys(files), tests = names.reduce((t, k) => t + files[k], 0);
    if (!names.length) missed++;
    if (slow) swept++;
    say.push('| ' + n + ' | `' + file.split('/').pop() + '` | ' + rule + ' | **' + names.length + '** | ' + tests + ' | ' + (names.map((k) => k.replace('.test.ts', '') + ' ' + files[k]).join(', ') || '**none: let through**') + (slow ? ' (the sweep was run)' : '') + ' |');
  }
  say.push('');
  say.push('- Breaks made: **' + rows.length + '** of ' + BREAKS.length + '. Let through by the fast files, so swept: ' + swept + '. Let through by every file: **' + missed + '**.');
  return say;
}

if (merging) {
  const parts = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, 'utf8')));
  // A break run again later replaces its earlier row (a part named after the others wins).
  const byN = new Map();
  for (const x of parts) for (const r of x.rows) byN.set(r[0], r);
  const rows = [...byN.values()];
  if (rows.length !== BREAKS.length) throw new Error('the parts hold ' + rows.length + ' breaks of ' + BREAKS.length);
  const say = report(rows, parts[0].clean);
  writeFileSync(join(HERE, 'native-change-sheet_breaks.md'), say.join('\n') + '\n');
  console.log(say.slice(-1)[0]);
  process.exit(0);
}

// --check: the whole list read against this checkout, every text that is not in its file once named, nothing run.
if (checking) {
  const root = resolve(HERE, '..', '..');
  let bad = 0;
  BREAKS.forEach(([file, rule, from, to], i) => {
    const text = readFileSync(join(root, file), 'utf8');
    const times = text.split(from).length - 1;
    if (times !== 1) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + times + ' times, not once'); }
    else if (from === to) { bad++; console.log('break ' + (i + 1) + ' (' + rule + '): its replacement is its own text'); }
  });
  const names = new Set(BREAKS.map((b) => b[1]));
  if (names.size !== BREAKS.length) { bad++; console.log('two breaks share a name'); }
  console.log(BREAKS.length + ' breaks read against this checkout, ' + bad + ' with a text not found once');
  process.exit(bad ? 1 : 0);
}

// Every break's text is in its file once, before anything is run.
BREAKS.forEach(([file, rule, from], i) => {
  const text = readFileSync(join(tree, file), 'utf8');
  if (text.split(from).length !== 2) throw new Error('break ' + (i + 1) + ' (' + rule + '): its text is in ' + file + ' ' + (text.split(from).length - 1) + ' times, not once');
});
const cleanFast = run(FAST), cleanSlow = run(SLOW);
if (Object.keys(cleanFast.files).length || Object.keys(cleanSlow.files).length) throw new Error('the copy is red before any break: ' + JSON.stringify({ ...cleanFast.files, ...cleanSlow.files }));
const clean = { fast: cleanFast.tests, slow: cleanSlow.tests };
const rows = [];
let n = 0;
for (const [file, rule, from, to] of BREAKS) {
  n++;
  if (only && !rule.includes(only)) continue;
  if (part && (n - 1) % part[1] !== part[0]) continue;
  const path = join(tree, file), src = readFileSync(path, 'utf8');
  let r, slow = false;
  try {
    writeFileSync(path, src.replace(from, to));
    r = run(FAST);
    if (!Object.keys(r.files).length) { slow = true; r = run(SLOW); }
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files, slow]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files' + (slow ? ' (swept)' : ''));
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean, rows }));
const say = report(rows, clean);
if (!only && !part) writeFileSync(join(HERE, 'native-change-sheet_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
