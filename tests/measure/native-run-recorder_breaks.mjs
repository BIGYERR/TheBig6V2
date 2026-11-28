// native-run-recorder: when one rule of the Expo app's Run recorder is broken, which test files go red?
// Read-only on this checkout (measure). Each break changes one rule in a copy of the tree: a rule of the screen
// (frontends/native/src/run-recorder/recorder-screen.ts), of today's calls over the Swift module (gps-bridge.ts,
// gps.ts), of the file that is today's own (run-recorder-model.ts), of the drawing and the wiring (RunRecorder.tsx,
// RecordOpening.tsx, this-week/ThisWeek.tsx, App.tsx, bugs/Bugs.tsx), of the Swift (modules/ia-gps/ios) or of what
// the app asks of iOS (app.config.js). The fast files are run on each; the files and tests that turn red are
// counted. A break no file turns red on is a rule no test holds. The recorder has no sweep: it stores nothing.
//
// Usage: node tools/tree-at.mjs --working <scratch>/tree     (a copy of this checkout, the tests' packages alone)
//        node tests/measure/native-run-recorder_breaks.mjs <scratch>/tree [--only <text in a break's name>] [--file <the end of a source file's path>]
//        (writes tests/measure/native-run-recorder_breaks.md here; each file of the copy is put back after its break)
// It runs in parts from its first run, each in a copy of its own, at once:
//        node tests/measure/native-run-recorder_breaks.mjs <scratch>/tree1 --part 0/4 --json <scratch>/part0.json
//        (and 1/4, 2/4, 3/4 on three more copies), then
//        node tests/measure/native-run-recorder_breaks.mjs --merge <scratch>/part0.json <scratch>/part1.json ...
// A break run again alone (--only <text> --json <file>) is merged after the parts and replaces its earlier row.
// Before a list written in an earlier session runs again, it is read against the code as it stands, with no copy:
//        node tests/measure/native-run-recorder_breaks.mjs --check
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
if (!tree && !merging && !checking) { console.error('usage: node tests/measure/native-run-recorder_breaks.mjs <a tools/tree-at.mjs --working copy> [--only <text>] [--part k/n --json <file>] | --merge <files> | --check'); process.exit(2); }
const only = arg('--only');
const onlyFile = arg('--file');
const part = arg('--part') ? arg('--part').split('/').map(Number) : null;
const TESTS = tree ? join(tree, 'tests') : '';
const FAST = ['unit/native-run-recorder.test.ts', 'unit/native-shell.test.ts', 'unit/native-cardio-sheet.test.ts', 'unit/native-bugs-tab.test.ts'];
const N = 'frontends/native/src/', M = 'frontends/native/modules/ia-gps/';
const SC = N + 'run-recorder/recorder-screen.ts', BR = N + 'run-recorder/gps-bridge.ts', GPS = N + 'run-recorder/gps.ts', MODEL = N + 'run-recorder/run-recorder-model.ts';
const REC = N + 'run-recorder/RunRecorder.tsx', OPEN = N + 'run-recorder/RecordOpening.tsx', WEEK = N + 'this-week/ThisWeek.tsx', APP = N + 'App.tsx', BUGS = N + 'bugs/Bugs.tsx';
const SWIFT = M + 'ios/IAGps.swift', MOD = M + 'ios/IAGpsModule.swift', POD = M + 'ios/IAGps.podspec', EMC = M + 'expo-module.config.json', CFG = 'frontends/native/app.config.js';

const OVER = "return st.runId && !st.live ? drawnLabel(runLabel(st.runId)) : heading ? heading.over : RECORDER_COPY.rowNote;";
const TITLE = "return (heading && heading.title) || RECORDER_COPY.row;";
const OFFER = "return !!heading && !st.live && !st.runId;";
const DRAWN = "return recorderView(st.lines, { auth: st.auth, lastFix: st.lastFix, live: st.live, now });";
const BACK = "if (!st.live && st.runId) { clear(st); d.draw(); } else d.closed();";
const CLEAR = "  st.runId = null;\n  st.lines = [];\n  st.message = '';\n}";
const FIN_OK = "        st.live = false;\n        st.runId = done;\n        gps.read(done, (text) => { st.lines = parseRecording(text); d.draw(); });\n        refreshPast(st, d, null);\n        d.draw();";
const DEL_OK = "          clear(st);\n          refreshPast(st, d, null);\n          d.draw();";
const RESYNC = "      st.live = true;\n      st.runId = id;\n      gps.read(id, (text) => { st.lines = parseRecording(text); d.draw(); });";
const OPENRUN = "    st.message = '';\n    st.runId = id;\n    st.lines = parseRecording(text);\n    d.draw();";
const PAST_SET = "if (rows.size === ids.length) { st.past = ids.map((i) => ({ id: i, label: drawnLabel(runLabel(i)), line: rows.get(i) ?? '' })); d.draw(); }";
const B_FIN = "        if (a.ok && typeof a.id === 'string') done(a.id);\n        else if (fail) fail(a.why || '');";
const B_READ = "        if (a.ok && typeof a.text === 'string') done(a.text);\n        else if (fail) fail(a.why || '');";
const B_REM = "        if (a.ok) done();\n        else if (fail) fail(a.why || '');";
const B_STATUS = "done({ recording: !!s.recording, paused: !!s.paused, id: typeof s.id === 'string' ? s.id : null })";
const R_EFFECT = "      shown.current = false;\n      clearInterval(tick);\n      front.remove();\n      gps.quiet();\n      recorderGone(d);";
const R_SHARE = "          const file = new File(Paths.cache, fileName);\n          file.create({ overwrite: true });\n          await file.write(text);\n          await SystemShare.share({ url: file.uri });\n          done();";
const O_CLOSE = "    if (stageNow.current !== 'open') return;\n    const done = (): void => { onClose(); if (then) then(); };\n    if (!moves) { done(); return; }\n    setStage('out');\n    run(growPlan().close, done);";
const W_CARD = "    const head = { over: when || '', title: k.title };\n    const el = box.current;\n    if (!el) { onRecord(k.week, k.key, head, null); return; }\n    el.measureInWindow((x, y, w, h) => onRecord(k.week, k.key, head, w > 0 && h > 0 ? { box: { t: y, l: x, w, h }, card: k } : null));";
const W_REC = "onRecord({ week, key, over: head.over, title: head.title, workout: recordWorkout(day), handLog: () => openSheet(week, key, head) }, from);";
const A_OPEN = "{record && GPS && <RecordOpening palette={p} gps={GPS} rec={record.rec} from={record.from} calm={calm} under={under} onClose={() => setRecord(null)} />}";
const A_BENCH = "{bench && GPS && <RunRecorder palette={p} gps={GPS} heading={null} workout={null} onClose={() => setBench(false)} onHandLog={() => setBench(false)} />}";

// [file, the rule broken (its name), the text in the file, what it becomes]
const BREAKS = [
  // ── The screen's rules (recorder-screen.ts) ──
  [SC, 'a finished run keeps the day\'s line over it', OVER, "return heading ? heading.over : RECORDER_COPY.rowNote;"],
  [SC, 'a live run shows its start over it', OVER, "return st.runId ? drawnLabel(runLabel(st.runId)) : heading ? heading.over : RECORDER_COPY.rowNote;"],
  [SC, 'a run card\'s recorder reads the test bench\'s note', OVER, "return st.runId && !st.live ? drawnLabel(runLabel(st.runId)) : RECORDER_COPY.rowNote;"],
  [SC, 'the test bench reads no note', OVER, "return st.runId && !st.live ? drawnLabel(runLabel(st.runId)) : heading ? heading.over : '';"],
  [SC, 'a finished run\'s start is drawn as iOS wrote it', OVER, "return st.runId && !st.live ? runLabel(st.runId) : heading ? heading.over : RECORDER_COPY.rowNote;"],
  [SC, 'a past run\'s start is drawn as iOS wrote it', "label: drawnLabel(runLabel(i))", "label: runLabel(i)"],
  [SC, 'only the first narrow space is drawn plain', "return label.split(String.fromCharCode(0x202f)).join(' ');", "return label.replace(String.fromCharCode(0x202f), ' ');"],
  [SC, 'the narrow space is drawn as nothing', "return label.split(String.fromCharCode(0x202f)).join(' ');", "return label.split(String.fromCharCode(0x202f)).join('');"],
  [SC, 'a card with no name leaves the title blank', TITLE, "return heading ? heading.title : RECORDER_COPY.row;"],
  [SC, 'a run card\'s recorder is titled as the test bench', TITLE, "return RECORDER_COPY.row;"],
  [SC, 'the test bench offers the hand log', OFFER, "return !st.live && !st.runId;"],
  [SC, 'a live run offers the hand log', OFFER, "return !!heading && !st.runId;"],
  [SC, 'a finished run offers the hand log', OFFER, "return !!heading && !st.live;"],
  [SC, 'the screen opens no channel', "  if (d.gps) d.gps.listen((e) => recorderEvent(st, d, e));\n", ""],
  [SC, 'the screen does not turn location on', "  if (d.gps) d.gps.warm();\n", ""],
  [SC, 'location goes on before the channel opens', "  if (d.gps) d.gps.listen((e) => recorderEvent(st, d, e));\n  if (d.gps) d.gps.warm();", "  if (d.gps) d.gps.warm();\n  if (d.gps) d.gps.listen((e) => recorderEvent(st, d, e));"],
  [SC, 'the screen does not read what the module holds as it opens', "  if (d.gps) d.gps.warm();\n  recorderResync(st, d);", "  if (d.gps) d.gps.warm();"],
  [SC, 'the screen leaves location on as it goes', "  if (d.gps) d.gps.cool();", ""],
  [SC, 'the permission event is dropped', "if (e.type === 'auth') st.auth = e.status;", "if (e.type === 'auth') { /* dropped */ }"],
  [SC, 'a fix is not kept for the GPS line', "    st.lastFix = e.fix;\n", ""],
  [SC, 'a recorded fix is counted before Start', "if (e.recorded && st.live) st.lines = [...st.lines, e.fix];", "if (e.recorded) st.lines = [...st.lines, e.fix];"],
  [SC, 'a fix that was not recorded is counted', "if (e.recorded && st.live) st.lines = [...st.lines, e.fix];", "if (st.live) st.lines = [...st.lines, e.fix];"],
  [SC, 'a step reading is counted before Start', "} else if (e.type === 'motion') {\n    if (st.live) st.lines = [...st.lines, e.line];", "} else if (e.type === 'motion') {\n    st.lines = [...st.lines, e.line];"],
  [SC, 'a step reading is dropped', "} else if (e.type === 'motion') {\n    if (st.live) st.lines = [...st.lines, e.line];", "} else if (e.type === 'motion') {\n    /* dropped */"],
  [SC, 'a mark is counted before Start', "    } else if (st.live) st.lines = [...st.lines, e.line];", "    } else st.lines = [...st.lines, e.line];"],
  [SC, 'the start mark does not make the run live', "      st.live = true;\n      st.lines = [e.line];", "      st.lines = [e.line];"],
  [SC, 'the start mark is added to what the screen held', "      st.lines = [e.line];", "      st.lines = [...st.lines, e.line];"],
  [SC, 'the start mark asks for no run id', "      if (d.gps) d.gps.status((s) => { st.runId = s.id; d.draw(); });\n", ""],
  [SC, 'the run id a start hands back is not drawn', "d.gps.status((s) => { st.runId = s.id; d.draw(); });", "d.gps.status((s) => { st.runId = s.id; });"],
  [SC, 'every mark is read as a start', "if ('mark' in e.line && e.line.mark === 'start') {", "if ('mark' in e.line) {"],
  [SC, 'the module\'s error is not shown', "  } else st.message = e.message;", "  } else { /* dropped */ }"],
  [SC, 'an event is not drawn', "  } else st.message = e.message;\n  d.draw();", "  } else st.message = e.message;"],
  [SC, 'a status that is not recording is read as a live run', "if (s.recording && s.id) {", "if (s.id) {"],
  [SC, 'a status with no run named is read as a live run', "if (s.recording && s.id) {\n      const id = s.id;", "if (s.recording) {\n      const id = s.id || 'none';"],
  [SC, 'a run read back is not live', RESYNC, RESYNC.replace("      st.live = true;\n", "")],
  [SC, 'a run read back has no id', RESYNC, RESYNC.replace("      st.runId = id;\n", "")],
  [SC, 'a live run is not read back from its file', RESYNC, "      st.live = true;\n      st.runId = id;"],
  [SC, 'a run read back is not drawn', RESYNC, RESYNC.replace("st.lines = parseRecording(text); d.draw(); }", "st.lines = parseRecording(text); }")],
  [SC, 'the past runs are not listed as the screen opens', "    refreshPast(st, d, s.id);\n    d.draw();", "    d.draw();"],
  [SC, 'the status itself is not drawn', "    refreshPast(st, d, s.id);\n    d.draw();", "    refreshPast(st, d, s.id);"],
  [SC, 'the live run is listed among the past runs', ".filter((id) => id !== liveId)", ""],
  [SC, 'an empty list of past runs is not taken', "if (!ids.length) { st.past = []; d.draw(); }", "if (!ids.length) { d.draw(); }"],
  [SC, 'an empty list of past runs is not drawn', "if (!ids.length) { st.past = []; d.draw(); }", "if (!ids.length) { st.past = []; }"],
  [SC, 'the past runs are set when the first one answers', PAST_SET, PAST_SET.replace("rows.size === ids.length", "rows.size === 1")],
  [SC, 'a past run carries no miles and time', "rows.set(id, runListLine(parseRecording(text)));", "rows.set(id, '');"],
  [SC, 'the past runs stand oldest first', PAST_SET, PAST_SET.replace("st.past = ids.map(", "st.past = [...ids].reverse().map(")],
  [SC, 'the past runs are not drawn', PAST_SET, PAST_SET.replace(" d.draw(); }", " }")],
  [SC, 'a past run opens over a live one', "  if (st.live) return;\n", ""],
  [SC, 'a past run opened keeps the old message', OPENRUN, OPENRUN.replace("    st.message = '';\n", "")],
  [SC, 'a past run opened has no id', OPENRUN, OPENRUN.replace("    st.runId = id;\n", "")],
  [SC, 'a past run opened draws no lines', OPENRUN, OPENRUN.replace("    st.lines = parseRecording(text);\n", "")],
  [SC, 'a past run opened is not drawn', OPENRUN, OPENRUN.replace("\n    d.draw();", "")],
  [SC, 'a tap keeps the old message', "  st.message = '';\n  const id = st.runId;", "  const id = st.runId;"],
  [SC, 'Start keeps the last run\'s id', "    st.runId = null;\n    st.lines = [];\n    gps.start();", "    st.lines = [];\n    gps.start();"],
  [SC, 'Start keeps the last run\'s lines', "    st.runId = null;\n    st.lines = [];\n    gps.start();", "    st.runId = null;\n    gps.start();"],
  [SC, 'Start starts nothing', "    st.lines = [];\n    gps.start();", "    st.lines = [];"],
  [SC, 'Pause resumes', "} else if (b === 'pause') gps.pause();", "} else if (b === 'pause') gps.resume();"],
  [SC, 'Resume pauses', "else if (b === 'resume') gps.resume();", "else if (b === 'resume') gps.pause();"],
  [SC, 'a finished run is still live', FIN_OK, FIN_OK.replace("        st.live = false;\n", "")],
  [SC, 'a finished run has no id', FIN_OK, FIN_OK.replace("        st.runId = done;\n", "")],
  [SC, 'a finished run is not read back', FIN_OK, FIN_OK.replace("        gps.read(done, (text) => { st.lines = parseRecording(text); d.draw(); });\n", "")],
  [SC, 'a finished run read back is not drawn', FIN_OK, FIN_OK.replace("st.lines = parseRecording(text); d.draw(); });", "st.lines = parseRecording(text); });")],
  [SC, 'Finish does not list the past runs again', FIN_OK, FIN_OK.replace("        refreshPast(st, d, null);\n", "")],
  [SC, 'Finish\'s answer is not drawn', FIN_OK, FIN_OK.replace("\n        d.draw();", "")],
  [SC, 'Finish refused says nothing', "      (why) => { st.message = why; d.draw(); },\n    );\n  } else if (b === 'share' && id) {", "      () => { d.draw(); },\n    );\n  } else if (b === 'share' && id) {"],
  [SC, 'Finish refused is not drawn', "      (why) => { st.message = why; d.draw(); },\n    );\n  } else if (b === 'share' && id) {", "      (why) => { st.message = why; },\n    );\n  } else if (b === 'share' && id) {"],
  [SC, 'Share with no run in hand shares', "} else if (b === 'share' && id) {", "} else if (b === 'share') {"],
  [SC, 'the shared file carries the run\'s id as its name', "d.share(gpxFileName(id), runGpx(id, st.lines),", "d.share(id + '.gpx', runGpx(id, st.lines),"],
  [SC, 'the shared file holds no run', "runGpx(id, st.lines)", "runGpx(id, [])"],
  [SC, 'a share that failed says nothing', "const fail = (): void => { st.message = RECORDER_COPY.shareFailed; d.draw(); };", "const fail = (): void => { d.draw(); };"],
  [SC, 'a share that failed is not drawn', "const fail = (): void => { st.message = RECORDER_COPY.shareFailed; d.draw(); };", "const fail = (): void => { st.message = RECORDER_COPY.shareFailed; };"],
  [SC, 'a share that ended is not drawn', "() => { st.message = ''; d.draw(); }, fail);", "() => { st.message = ''; }, fail);"],
  [SC, 'a build with no share sheet says nothing', "    else fail();\n", ""],
  [SC, 'Delete asks in other words', "d.ask(RECORDER_COPY.confirmDelete, () => {", "d.ask(RECORDER_COPY.shareFailed, () => {"],
  [SC, 'Delete does not wait for the answer', "d.ask(RECORDER_COPY.confirmDelete, () => {", "((_t: string, yes: () => void) => yes())(RECORDER_COPY.confirmDelete, () => {"],
  [SC, 'Delete with no run in hand asks', "} else if (b === 'delete' && id) {", "} else if (b === 'delete') {"],
  [SC, 'a deleted run stays on the screen', DEL_OK, DEL_OK.replace("          clear(st);\n", "")],
  [SC, 'Delete does not list the past runs again', DEL_OK, DEL_OK.replace("          refreshPast(st, d, null);\n", "")],
  [SC, 'a delete is not drawn', DEL_OK, DEL_OK.replace("\n          d.draw();", "")],
  [SC, 'a delete refused says nothing', "        (why) => { st.message = why; d.draw(); },\n      );\n    });", "        () => { d.draw(); },\n      );\n    });"],
  [SC, 'a delete refused is not drawn', "        (why) => { st.message = why; d.draw(); },\n      );\n    });", "        (why) => { st.message = why; },\n      );\n    });"],
  [SC, 'a tap is not drawn', "    });\n  }\n  d.draw();\n}", "    });\n  }\n}"],
  [SC, 'Back from a finished run closes the screen', BACK, "d.closed();"],
  [SC, 'Back from a live run clears it', BACK, "if (st.runId) { clear(st); d.draw(); } else d.closed();"],
  [SC, 'Back from the start does nothing', BACK, "if (!st.live && st.runId) { clear(st); d.draw(); }"],
  [SC, 'Back to the start is not drawn', BACK, "if (!st.live && st.runId) { clear(st); } else d.closed();"],
  [SC, 'the start keeps the last run\'s id', CLEAR, CLEAR.replace("  st.runId = null;\n", "")],
  [SC, 'the start keeps the last run\'s lines', CLEAR, CLEAR.replace("  st.lines = [];\n", "")],
  [SC, 'the start keeps the last message', CLEAR, CLEAR.replace("  st.message = '';\n", "")],
  [SC, 'the draw does not know the run is live', DRAWN, DRAWN.replace("live: st.live", "live: false")],
  [SC, 'the live clock stops at the run\'s last line', DRAWN, DRAWN.replace(", now });", " });")],
  [SC, 'the draw does not know location is off', DRAWN, DRAWN.replace("auth: st.auth", "auth: 'granted'")],
  [SC, 'the GPS line does not follow the last fix', DRAWN, DRAWN.replace("lastFix: st.lastFix", "lastFix: null")],
  [SC, 'a tap breaks a build with no module', "  const gps = d.gps;\n  if (!gps) return;\n  st.message = '';", "  const gps = d.gps as GpsBridge;\n  st.message = '';"],
  [SC, 'reading back breaks a build with no module', "  const gps = d.gps;\n  if (!gps) return;\n  gps.status((s) => {", "  const gps = d.gps as GpsBridge;\n  gps.status((s) => {"],

  // ── Today's calls over the Swift module (gps-bridge.ts, gps.ts) ──
  [BR, 'a second listen keeps the first channel open', "      quiet();\n      channel = native.addListener('onGps', onEvent);", "      channel = native.addListener('onGps', onEvent);"],
  [BR, 'listen opens no channel', "      channel = native.addListener('onGps', onEvent);\n", ""],
  [BR, 'listen does not ask for the permission as it stands', "      native.listen().catch(none);\n", ""],
  [BR, 'listen asks before the channel is open', "      channel = native.addListener('onGps', onEvent);\n      native.listen().catch(none);", "      native.listen().catch(none);\n      channel = native.addListener('onGps', onEvent);"],
  [BR, 'the channel listens for another event', "native.addListener('onGps', onEvent)", "native.addListener('gps' as 'onGps', onEvent)"],
  [BR, 'quiet leaves the channel open', "    if (channel) channel.remove();\n", ""],
  [BR, 'a channel is closed twice', "    if (channel) channel.remove();\n    channel = null;", "    if (channel) channel.remove();"],
  [BR, 'warm cools', "warm() { native.warm().catch(none); },", "warm() { native.cool().catch(none); },"],
  [BR, 'cool warms', "cool() { native.cool().catch(none); },", "cool() { native.warm().catch(none); },"],
  [BR, 'start pauses', "start() { native.start().catch(none); },", "start() { native.pause().catch(none); },"],
  [BR, 'pause resumes in the module', "pause() { native.pause().catch(none); },", "pause() { native.resume().catch(none); },"],
  [BR, 'resume starts', "resume() { native.resume().catch(none); },", "resume() { native.start().catch(none); },"],
  [BR, 'a finish with no id is taken as done', B_FIN, B_FIN.replace("a.ok && typeof a.id === 'string'", "a.ok")],
  [BR, 'a finish refused is taken as done', B_FIN, B_FIN.replace("a.ok && typeof a.id === 'string'", "typeof a.id === 'string'")],
  [BR, 'a finish refused gives no reason', B_FIN, B_FIN.replace("fail(a.why || '')", "fail('')")],
  [BR, 'a finish refused is told to no one', B_FIN, B_FIN.replace("\n        else if (fail) fail(a.why || '');", "")],
  [BR, 'a finish the module throws on is silent', "        else if (fail) fail(a.why || '');\n      }, tell(fail));\n    },\n    status(done) {", "        else if (fail) fail(a.why || '');\n      }, none);\n    },\n    status(done) {"],
  [BR, 'a read with no text is taken', B_READ, B_READ.replace("a.ok && typeof a.text === 'string'", "a.ok")],
  [BR, 'a read refused is taken', B_READ, B_READ.replace("a.ok && typeof a.text === 'string'", "typeof a.text === 'string'")],
  [BR, 'a read refused gives no reason', B_READ, B_READ.replace("fail(a.why || '')", "fail('')")],
  [BR, 'a read the module throws on is silent', "        else if (fail) fail(a.why || '');\n      }, tell(fail));\n    },\n    remove(id, done, fail) {", "        else if (fail) fail(a.why || '');\n      }, none);\n    },\n    remove(id, done, fail) {"],
  [BR, 'a delete refused is taken as done', B_REM, B_REM.replace("if (a.ok) done();", "done();")],
  [BR, 'a delete refused gives no reason', B_REM, B_REM.replace("fail(a.why || '')", "fail('')")],
  [BR, 'a delete the module throws on is silent', "        else if (fail) fail(a.why || '');\n      }, tell(fail));\n    },\n  };", "        else if (fail) fail(a.why || '');\n      }, none);\n    },\n  };"],
  [BR, 'a thrown call gives no reason', "if (fail) fail(String(e));", "if (fail) fail('');"],
  [BR, 'a status hands back what the module wrote for recording', B_STATUS, B_STATUS.replace("recording: !!s.recording", "recording: s.recording")],
  [BR, 'a status hands back what the module wrote for paused', B_STATUS, B_STATUS.replace("paused: !!s.paused", "paused: s.paused")],
  [BR, 'a status with no id hands back none at all', B_STATUS, B_STATUS.replace("id: typeof s.id === 'string' ? s.id : null", "id: s.id")],
  [BR, 'the list hands back no runs', "native.list().then((runs) => done(runs), none);", "native.list().then(() => done([]), none);"],
  [BR, 'read asks for another run', "native.read(id).then((a) => {", "native.read('run-0').then((a) => {"],
  [BR, 'remove asks for another run', "native.remove(id).then((a) => {", "native.remove('run-0').then((a) => {"],
  [GPS, 'the app asks for a module of another name', "requireOptionalNativeModule<NativeGps>('IAGps')", "requireOptionalNativeModule<NativeGps>('IAGPS')"],
  [GPS, 'a build without the module still has a recorder', "return native ? gpsOver(native) : null;", "return gpsOver(native as NativeGps);"],
  [GPS, 'a lookup that throws breaks the app', "  } catch {\n    return null;\n  }", "  } catch (e) {\n    throw e;\n  }"],
  [MODEL, 'the model is no longer today\'s', "row: 'Run recorder',", "row: 'Recorder',"],

  // ── The drawing (RunRecorder.tsx) ──
  [REC, 'the first row draws This mile under Avg pace', "[W.avg, view.avgPace], [W.mile, view.milePace]", "[W.avg, view.milePace], [W.mile, view.avgPace]"],
  [REC, 'the first row draws no Miles', "const big = [[W.miles, view.distance], ", "const big = ["],
  [REC, 'the second row draws Steps under Climb', "[[W.climb, view.climb], [W.cadence, view.cadence], [W.steps, view.steps]]", "[[W.climb, view.steps], [W.cadence, view.cadence], [W.steps, view.climb]]"],
  [REC, 'the second row is not drawn', "        <View style={s.figures}>\n          {small.map(([label, value]) => (", "        <View style={s.none}>\n          {[].map(([label, value]) => ("],
  [REC, 'a label is another word', "avg: 'Avg pace'", "avg: 'Pace'"],
  [REC, 'a split draws no climb', "{sp.time + (sp.climb ? GAP + sp.climb : '')}", "{sp.time}"],
  [REC, 'a split\'s climb stands hard against its time', "const GAP = String.fromCharCode(160, 160);", "const GAP = '';"],
  [REC, 'a split is called a lap', "{'Mile ' + sp.mile}", "{'Lap ' + sp.mile}"],
  [REC, 'a past run draws its start alone', "{r.label + ' · ' + r.line}", "{r.label}"],
  [REC, 'a button draws its key', "{BUTTON_LABEL[b]}", "{b}"],
  [REC, 'Back presses nothing', "onPress={() => recorderBack(st, d)}", "onPress={() => {}}"],
  [REC, 'a button presses Start whatever it is', "onPress={() => recorderPress(st, d, b)}", "onPress={() => recorderPress(st, d, 'start')}"],
  [REC, 'a past run opens nothing', "onPress={() => recorderOpenRun(st, d, r.id)}", "onPress={() => {}}"],
  [REC, 'Ran without the phone? goes nowhere', "onPress={onHandLog}", "onPress={() => {}}"],
  [REC, 'Ran without the phone? is always drawn', "{offersHandLog(st, heading) && (", "{(st as unknown) && ("],
  [REC, 'the message line is always drawn', "{st.message !== '' && <Note id=\"rec-message\"", "{<Note id=\"rec-message\""],
  [REC, 'the splits are drawn with none', "{view.splits.length > 0 && (", "{(view as unknown) && ("],
  [REC, 'the past runs are drawn with none', "{st.past.length > 0 && (", "{(st as unknown) && ("],
  [REC, 'the workout is not drawn above the clock', "{workout && <View testID=\"rec-workout\"><Cardio c={workout} p={p} /></View>}", ""],
  [REC, 'the when line is not the rule\'s', "{recorderOver(st, heading)}", "{RECORDER_COPY.rowNote}"],
  [REC, 'the title is not the rule\'s', ">{recorderTitle(heading)}</Text>", ">{RECORDER_COPY.row}</Text>"],
  [REC, 'the hand log link reads other words', "{RECORDER_COPY.noPhone}", "{'Log by hand'}"],
  [REC, 'the draw is not the model\'s', "const view = recorderDrawn(st, now);", "const view = recorderDrawn(st, 0);"],
  [REC, 'the screen does not open the channel', "    recorderOpened(st, d);\n    const tick", "    const tick"],
  [REC, 'the clock ticks twice a second', "const tick = setInterval(() => setNow(Date.now()), 1000);", "const tick = setInterval(() => setNow(Date.now()), 500);"],
  [REC, 'the run is read back as the app goes behind', "if (s === 'active') recorderResync(st, d);", "if (s === 'background') recorderResync(st, d);"],
  [REC, 'the run is not read back on the app\'s return', "const front = AppState.addEventListener('change', (s) => { if (s === 'active') recorderResync(st, d); });", "const front = { remove: (): void => {} };"],
  [REC, 'the clock ticks on after the screen', R_EFFECT, R_EFFECT.replace("      clearInterval(tick);\n", "")],
  [REC, 'the app\'s return is listened for after the screen', R_EFFECT, R_EFFECT.replace("      front.remove();\n", "")],
  [REC, 'the channel stays open after the screen', R_EFFECT, R_EFFECT.replace("      gps.quiet();\n", "")],
  [REC, 'location stays on after the screen', R_EFFECT, R_EFFECT.replace("      recorderGone(d);", "")],
  [REC, 'an answer after the screen is drawn', "draw: () => { if (shown.current) setDraws((n) => n + 1); },", "draw: () => { setDraws((n) => n + 1); },"],
  [REC, 'the question stands under another name', "export const ASK_TITLE = 'IA Next';", "export const ASK_TITLE = 'The Asylum';"],
  [REC, 'the question puts OK first', "[{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: yes }]", "[{ text: 'OK', onPress: yes }, { text: 'Cancel', style: 'cancel' }]"],
  [REC, 'Cancel deletes', "[{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: yes }]", "[{ text: 'Cancel', style: 'cancel', onPress: yes }, { text: 'OK' }]"],
  [REC, 'the shared run is written outside the cache', R_SHARE, R_SHARE.replace("new File(Paths.cache, fileName)", "new File(Paths.document, fileName)")],
  [REC, 'the shared run is not written', R_SHARE, R_SHARE.replace("          await file.write(text);\n", "")],
  [REC, 'the share sheet is handed no file', R_SHARE, R_SHARE.replace("{ url: file.uri }", "{ message: text }")],
  [REC, 'a share is never said to have ended', R_SHARE, R_SHARE.replace("\n          done();", "")],
  [REC, 'a share that throws is not said to have failed', "        } catch {\n          fail();\n        }", "        } catch {\n          /* silent */\n        }"],
  [REC, 'the band\'s edge stands 13 under the title', "paddingBottom: 14.7, borderBottomWidth: 1", "paddingBottom: 13, borderBottomWidth: 1"],
  [REC, 'Back\'s word stands on its own line height', "fontSize: 14, fontWeight: '700', lineHeight: 19 },", "fontSize: 14, fontWeight: '700' },"],
  [REC, 'Back is no pill', "back: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },", "back: { paddingVertical: 8, paddingHorizontal: 14 },"],
  [REC, 'the title stands hard under the when line', "fontSize: 22, fontWeight: '700', marginTop: 1.7 },", "fontSize: 22, fontWeight: '700' },"],
  [REC, 'the clock is 48', "fontSize: 56, fontWeight: '700', lineHeight: 56, paddingTop: 5, marginBottom: -5.6,", "fontSize: 48, fontWeight: '700', lineHeight: 56, paddingTop: 5, marginBottom: -5.6,"],
  [REC, 'the clock stands 5 high in its line', "lineHeight: 56, paddingTop: 5, marginBottom: -5.6,", "lineHeight: 56,"],
  [REC, 'the first row\'s figures are 18', "big: { fontFamily: DISPLAY, fontSize: 24,", "big: { fontFamily: DISPLAY, fontSize: 18,"],
  [REC, 'the first row stands 2 short', "fontSize: 24, fontWeight: '700', paddingBottom: 2,", "fontSize: 24, fontWeight: '700',"],
  [REC, 'the second row\'s figures are 24', "small: { fontFamily: DISPLAY, fontSize: 18,", "small: { fontFamily: DISPLAY, fontSize: 24,"],
  [REC, 'the buttons are 48 tall', "fontSize: 15, fontWeight: '700', lineHeight: 20 },", "fontSize: 15, fontWeight: '700' },"],
  [REC, 'the buttons have 11 of room', "borderWidth: 1, borderRadius: 999, padding: 14 },", "borderWidth: 1, borderRadius: 999, padding: 11 },"],
  [REC, 'the parts stand 16 apart', "body: { paddingTop: 16, paddingHorizontal: 16, gap: 14 },", "body: { paddingTop: 16, paddingHorizontal: 16, gap: 16 },"],
  [REC, 'the figures stand 14 apart', "figures: { flexDirection: 'row', gap: 8 },", "figures: { flexDirection: 'row', gap: 14 },"],
  [REC, 'a label stands hard over its figure', "figure: { flex: 1, gap: 8 },", "figure: { flex: 1 },"],
  [REC, 'the hand log link is short of 44', "nophone: { alignSelf: 'center', minHeight: 44,", "nophone: { alignSelf: 'center', minHeight: 30,"],
  [REC, 'the hand log link is not underlined', ", textDecorationLine: 'underline' },", " },"],
  [REC, 'a split\'s line is the face\'s own', "splitText: { fontFamily: TEXT, fontSize: 14, lineHeight: 18,", "splitText: { fontFamily: TEXT, fontSize: 14,"],
  [REC, 'a past run\'s pill is 39.7 tall', "textAlign: 'left', paddingBottom: 1.5 },", "textAlign: 'left' },"],
  [REC, 'Back\'s pill is clear', "style={[s.back, { backgroundColor: p.surface, borderColor: p.border2 }]}", "style={[s.back, { borderColor: p.border2 }]}"],
  [REC, 'the when line is as bright as the title', "style={[s.over, { color: on(0.6) }]}", "style={[s.over, { color: on(1) }]}"],
  [REC, 'the header is the page\'s ground', "backgroundColor: p.bandHeader, borderBottomColor: p.border, paddingTop: insets.top", "backgroundColor: p.bg, borderBottomColor: p.border, paddingTop: insets.top"],
  [REC, 'the scroll ends hard on the last line', "contentContainerStyle={[s.body, { paddingBottom: 20 + insets.bottom }]}", "contentContainerStyle={[s.body]}"],
  [REC, 'the Bugs row reads another name', "<Row id=\"recorder-row\" label={RECORDER_COPY.row} palette={p}>", "<Row id=\"recorder-row\" label={'GPS'} palette={p}>"],
  [REC, 'the Bugs row has no note', "      <Note palette={p}>{RECORDER_COPY.rowNote}</Note>\n", ""],
  [REC, 'the Bugs row\'s button says Start', "<Opt id=\"recorder-open\" label=\"Open\" palette={p} onPress={onOpen} />", "<Opt id=\"recorder-open\" label=\"Start\" palette={p} onPress={onOpen} />"],
  [REC, 'the Bugs row\'s button opens nothing', "label=\"Open\" palette={p} onPress={onOpen} />", "label=\"Open\" palette={p} onPress={() => {}} />"],

  // ── Record run's door (RecordOpening.tsx, ThisWeek.tsx, App.tsx, Bugs.tsx) ──
  [OPEN, 'a way out is taken while it still opens', O_CLOSE, O_CLOSE.replace("    if (stageNow.current !== 'open') return;\n", "")],
  [OPEN, 'the hand log opens before the recorder has gone', O_CLOSE, O_CLOSE.replace("onClose(); if (then) then();", "if (then) then(); onClose();")],
  [OPEN, 'the hand log never opens', O_CLOSE, O_CLOSE.replace("onClose(); if (then) then();", "onClose();")],
  [OPEN, 'the app is never told it closed', O_CLOSE, O_CLOSE.replace("onClose(); if (then) then();", "if (then) then();")],
  [OPEN, 'a still recorder plays the close', O_CLOSE, O_CLOSE.replace("    if (!moves) { done(); return; }\n", "")],
  [OPEN, 'the close is not played', O_CLOSE, O_CLOSE.replace("    setStage('out');\n    run(growPlan().close, done);", "    done();")],
  [OPEN, 'it moves under Reduce Motion', "useState(!calm && !!from);", "useState(!!from);"],
  [OPEN, 'it moves with no card to open out of', "useState(!calm && !!from);", "useState(!calm);"],
  [OPEN, 'Ran without the phone? closes and no more', "onHandLog={() => way.current.close(way.current.rec.handLog)}", "onHandLog={() => way.current.close()}"],
  [OPEN, 'Back does not close into the card', "onClose={() => way.current.close()}", "onClose={() => {}}"],
  [OPEN, 'the recorder opens under the test bench\'s words', "<RunRecorder palette={p} gps={gps} heading={heading} workout={rec.workout}", "<RunRecorder palette={p} gps={gps} heading={null} workout={rec.workout}"],
  [OPEN, 'the recorder opens without the run\'s workout', "heading={heading} workout={rec.workout}", "heading={heading} workout={null}"],
  [OPEN, 'the words over it are another run\'s title', "({ over: rec.over, title: rec.title })", "({ over: rec.over, title: rec.over })"],
  [OPEN, 'a tap lands while it moves', "pointerEvents={stage === 'open' ? 'auto' : 'none'}", "pointerEvents=\"auto\""],
  [OPEN, 'the lift waits 16 ms', "held: setTimeout(lift, 64) };", "held: setTimeout(lift, 16) };"],
  [OPEN, 'it opens before it lifts', "run(plan.lift, () => run(plan.open, () => setStage('open')));", "run(plan.open, () => run(plan.lift, () => setStage('open')));"],
  [OPEN, 'the frame opens from the screen\'s corner', "const f = growFrames(from.box, vw, vh);", "const f = growFrames({ t: 0, l: 0, w: 1, h: 1 }, vw, vh);"],
  [OPEN, 'the copy of the card draws its buttons', "<Card k={from.card} p={p} copy />", "<Card k={from.card} p={p} />"],
  [OPEN, 'the copy of the card stays over the open recorder', "      {stage !== 'open' && (", "      {(stage as string) !== 'never' && ("],
  [OPEN, 'a still recorder is drawn on no ground', "<View testID=\"record-opening\" style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>{body}</View>", "<View testID=\"record-opening\" style={[StyleSheet.absoluteFill]}>{body}</View>"],
  [WEEK, 'Record run is offered on a build with no recorder', "picked: picks.current.get(shownNow) ?? null }, !!onRecord) : null;", "picked: picks.current.get(shownNow) ?? null }, true) : null;"],
  [WEEK, 'Record run opens the hand log', "    else if (r.to === 'record') record();\n", ""],
  [WEEK, 'Record run opens the deck', "else if (r.to === 'record') record();", "else if (r.to === 'record') start();"],
  [WEEK, 'the recorder opens under the card\'s label', W_CARD, W_CARD.replace("title: k.title }", "title: k.label }")],
  [WEEK, 'the recorder opens with no when line', W_CARD, W_CARD.replace("over: when || ''", "over: ''")],
  [WEEK, 'a card with no place records nothing', W_CARD, W_CARD.replace("if (!el) { onRecord(k.week, k.key, head, null); return; }", "if (!el) return;")],
  [WEEK, 'Record run hands on no place for the card', W_CARD, W_CARD.replace("onRecord(k.week, k.key, head, w > 0 && h > 0 ? { box: { t: y, l: x, w, h }, card: k } : null)", "onRecord(k.week, k.key, head, null)")],
  [WEEK, 'the day\'s cards are handed no recorder', "onCardio={openSheet} onRecord={record} onRest={", "onCardio={openSheet} onRecord={() => {}} onRest={"],
  [WEEK, 'a card is handed no recorder', "onCardio={onCardio} onRecord={onRecord} />", "onCardio={onCardio} />"],
  [WEEK, 'the run recorded carries no workout', W_REC, W_REC.replace("workout: recordWorkout(day)", "workout: null")],
  [WEEK, 'Ran without the phone? opens the whole day', W_REC, W_REC.replace("handLog: () => openSheet(week, key, head)", "handLog: () => openSheet(week, key)")],
  [WEEK, 'the run recorded carries another week\'s day', "const day = weeks && weeks[week] ? weeks[week]![key] : null;", "const day = weeks && weeks[1] ? weeks[1]![key] : null;"],
  [WEEK, 'Record run records with no program in hand', "    if (!prog || !onRecord) return;\n    const weeks", "    if (!onRecord) return;\n    const weeks"],
  [APP, 'This Week is handed a recorder on a build with none', "onRecord={GPS ? (rec, from) => setRecord({ rec, from }) : null}", "onRecord={(rec, from) => setRecord({ rec, from })}"],
  [APP, 'Record run opens nothing', "onRecord={GPS ? (rec, from) => setRecord({ rec, from }) : null}", "onRecord={GPS ? () => {} : null}"],
  [APP, 'the recorder forgets the card it opened out of', "(rec, from) => setRecord({ rec, from })", "(rec) => setRecord({ rec, from: null })"],
  [APP, 'the recorder out of a card moves under Reduce Motion', A_OPEN, A_OPEN.replace("calm={calm}", "calm={false}")],
  [APP, 'the recorder out of a card is never taken away', A_OPEN, A_OPEN.replace("onClose={() => setRecord(null)}", "onClose={() => {}}")],
  [APP, 'This Week does not shrink under the recorder', A_OPEN, A_OPEN.replace("under={under}", "under={new Animated.Value(1)}")],
  [APP, 'the recorder out of a card is drawn under the tab bar\'s screens', "      " + A_OPEN + "\n      {sheet && (", "      {sheet && " + A_OPEN.slice(1, -1) + "}\n      {sheet && ("],
  [APP, 'the Bugs row is drawn on a build with no recorder', "onRecorder={GPS ? () => setBench(true) : null}", "onRecorder={() => setBench(true)}"],
  [APP, 'the Bugs row opens nothing', "onRecorder={GPS ? () => setBench(true) : null}", "onRecorder={GPS ? () => {} : null}"],
  [APP, 'the test bench opens under a card\'s words', A_BENCH, A_BENCH.replace("heading={null}", "heading={{ over: '', title: '' }}")],
  [APP, 'the test bench cannot be closed', A_BENCH, A_BENCH.replace("onClose={() => setBench(false)}", "onClose={() => {}}")],
  [BUGS, 'the Bugs row is drawn with no recorder to open', "{onRecorder && <RecorderRow palette={p} onOpen={onRecorder} />}", "{<RecorderRow palette={p} onOpen={onRecorder || (() => {})} />}"],
  [BUGS, 'the Bugs row stands above Engine', "        <EngineCheck palette={p} state={engine} />\n        {onRecorder && <RecorderRow palette={p} onOpen={onRecorder} />}", "        {onRecorder && <RecorderRow palette={p} onOpen={onRecorder} />}\n        <EngineCheck palette={p} state={engine} />"],

  // ── The Swift and what the app asks of iOS ──
  [SWIFT, 'a run stops when the phone locks', "        m.allowsBackgroundLocationUpdates = true\n", ""],
  [SWIFT, 'iOS may pause the fixes by itself', "m.pausesLocationUpdatesAutomatically = false", "m.pausesLocationUpdatesAutomatically = true"],
  [SWIFT, 'the fixes are coarse', "m.desiredAccuracy = kCLLocationAccuracyBest", "m.desiredAccuracy = kCLLocationAccuracyHundredMeters"],
  [SWIFT, 'a fix every 10 m only', "m.distanceFilter = kCLDistanceFilterNone", "m.distanceFilter = 10"],
  [SWIFT, 'location is asked for always', "m.requestWhenInUseAuthorization()", "m.requestAlwaysAuthorization()"],
  [SWIFT, 'a fix is not written to the run\'s file', "            if runId != nil { write(fix) }\n", ""],
  [SWIFT, 'fixes are sent while the app is behind', "if active { send([\"type\": \"fix\", \"fix\": fix, \"recorded\": runId != nil]) }", "send([\"type\": \"fix\", \"fix\": fix, \"recorded\": runId != nil])"],
  [SWIFT, 'a step reading is written with no run', "        guard runId != nil else { return }\n        write(line)", "        write(line)"],
  [SWIFT, 'the steps are counted from the phone\'s day', "pedometer.startUpdates(from: start)", "pedometer.startUpdates(from: Date.distantPast)"],
  [SWIFT, 'the pause mark is written twice', "if runId != nil && !paused {", "if runId != nil {"],
  [SWIFT, 'the finish mark is not written', "        writeMark(\"finish\")\n", ""],
  [SWIFT, 'the sensors run on after Finish', "        writeMark(\"finish\")\n        stopMotion()", "        writeMark(\"finish\")"],
  [SWIFT, 'the file stays open after Finish', "        stopMotion()\n        closeFile()", "        stopMotion()"],
  [SWIFT, 'the blue pill stays after Finish', "        manager?.allowsBackgroundLocationUpdates = false\n", ""],
  [SWIFT, 'a run is kept in another folder', "base.appendingPathComponent(\"ia-gps\", isDirectory: true)", "base.appendingPathComponent(\"runs\", isDirectory: true)"],
  [SWIFT, 'a run is kept in Documents', "for: .applicationSupportDirectory", "for: .documentDirectory"],
  [SWIFT, 'a call can name any file', "        guard id.hasPrefix(\"run-\"),\n              id.allSatisfy({ $0.isLetter || $0.isNumber || $0 == \"-\" }) else { return nil }\n", ""],
  [SWIFT, 'a run id may hold a path', "id.allSatisfy({ $0.isLetter || $0.isNumber || $0 == \"-\" })", "!id.isEmpty"],
  [SWIFT, 'the run recording can be deleted', "guard let url = runFile(id), url.deletingPathExtension().lastPathComponent != runId else {", "guard let url = runFile(id) else {"],
  [SWIFT, 'the lines run together in the file', "        data.append(0x0a)\n", ""],
  [SWIFT, 'a refusal answers ok', "[\"ok\": false, \"why\": message]", "[\"ok\": true, \"why\": message]"],
  [SWIFT, 'Finish answers with no id', "return [\"ok\": true, \"id\": id]", "return [\"ok\": true]"],
  [SWIFT, 'a read answers with no text', "return [\"ok\": true, \"text\": text]", "return [\"ok\": true]"],
  [SWIFT, 'a status names no run', "\"id\": runId ?? NSNull()]", "\"id\": NSNull()]"],
  [SWIFT, 'the run starts before permission is given', "        case .notDetermined:\n            m.requestWhenInUseAuthorization()", "        case .notDetermined:\n            begin()"],
  [SWIFT, 'a refused permission is not told', "            wantsStart = false\n            send([\"type\": \"auth\", \"status\": \"denied\"])", "            wantsStart = false"],
  [SWIFT, 'the events go nowhere', "        emit(event)\n", ""],
  [MOD, 'a call runs off the main queue', "      self.gps.warm()\n    }.runOnQueue(.main)", "      self.gps.warm()\n    }"],
  [MOD, 'a call has another name', "AsyncFunction(\"warm\")", "AsyncFunction(\"warmUp\")"],
  [MOD, 'Resume is wired to Pause', "      self.gps.resume()", "      self.gps.pause()"],
  [MOD, 'the event has another name', "Events(\"onGps\")", "Events(\"gps\")"],
  [MOD, 'the event is sent under another name', "self?.sendEvent(\"onGps\", event)", "self?.sendEvent(\"gps\", event)"],
  [MOD, 'the module has another name', "Name(\"IAGps\")", "Name(\"IAGPS\")"],
  [MOD, 'read takes no id', "AsyncFunction(\"read\") { (id: String) -> [String: Any] in\n      self.gps.read(id)", "AsyncFunction(\"read\") { () -> [String: Any] in\n      self.gps.read(\"\")"],
  [EMC, 'Expo is told of another module', "\"modules\": [\"IAGpsModule\"]", "\"modules\": [\"IAGps\"]"],
  [POD, 'the module links no Core Motion', "s.frameworks = 'CoreLocation', 'CoreMotion'", "s.frameworks = 'CoreLocation'"],
  [POD, 'the module asks for iOS 17', ":ios => '16.4'", ":ios => '17.0'"],
  [POD, 'the module does not depend on Expo\'s core', "  s.dependency 'ExpoModulesCore'\n", ""],
  [CFG, 'the app gives no reason for location', "        NSLocationWhenInUseUsageDescription: 'The Asylum records your route while you run. It stays on this phone.',\n", ""],
  [CFG, 'the app gives another reason for location', "The Asylum records your route while you run.", "IA Next records your route while you run."],
  [CFG, 'the app gives no reason for motion', "        NSMotionUsageDescription: 'The Asylum counts your steps and your climb while you record a run. It stays on this phone.',\n", ""],
  [CFG, 'the app has no location background mode', "        UIBackgroundModes: ['location'],\n", ""],
  [CFG, 'the app asks for another background mode too', "UIBackgroundModes: ['location'],", "UIBackgroundModes: ['location', 'fetch'],"],
  [CFG, 'the app asks for an entitlement', "      infoPlist: {\n        NSLocationWhenInUseUsageDescription", "      entitlements: { 'com.apple.developer.healthkit': true },\n      infoPlist: {\n        NSLocationWhenInUseUsageDescription"],
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
/** The report from every break's row: [n, file, rule, {file: tests red}]. */
function report(rows, clean) {
  const say = [];
  say.push('# The Expo app\'s Run recorder: a break per rule, and the test files each turns red');
  say.push('');
  say.push('Written by `node tests/measure/native-run-recorder_breaks.mjs` (read-only here; each break is made in a copy of the tree and put back).');
  say.push('');
  say.push('- The fast files, run on each break: ' + line(FAST) + '. Unbroken, they hold ' + clean.fast + ' tests and all pass.');
  say.push('- The recorder has no sweep: it reads and writes no stored state.');
  say.push('');
  say.push('| # | File | The rule broken | Files red | Tests red | Which |');
  say.push('|---|---|---|---|---|---|');
  let missed = 0;
  for (const [n, file, rule, files] of rows.sort((x, y) => x[0] - y[0])) {
    const names = Object.keys(files), tests = names.reduce((t, k) => t + files[k], 0);
    if (!names.length) missed++;
    say.push('| ' + n + ' | `' + file.split('/').pop() + '` | ' + rule + ' | **' + names.length + '** | ' + tests + ' | ' + (names.map((k) => k.replace('.test.ts', '') + ' ' + files[k]).join(', ') || '**none: let through**') + ' |');
  }
  say.push('');
  say.push('- Breaks made: **' + rows.length + '** of ' + BREAKS.length + '. Let through by every file: **' + missed + '**.');
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
  writeFileSync(join(HERE, 'native-run-recorder_breaks.md'), say.join('\n') + '\n');
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
const cleanFast = run(FAST);
if (Object.keys(cleanFast.files).length) throw new Error('the copy is red before any break: ' + JSON.stringify(cleanFast.files));
const clean = { fast: cleanFast.tests };
const rows = [];
let n = 0;
for (const [file, rule, from, to] of BREAKS) {
  n++;
  if (only && !rule.includes(only)) continue;
  if (onlyFile && !file.endsWith(onlyFile)) continue;
  if (part && (n - 1) % part[1] !== part[0]) continue;
  const path = join(tree, file), src = readFileSync(path, 'utf8');
  let r;
  try {
    writeFileSync(path, src.replace(from, () => to));
    r = run(FAST);
  } finally { writeFileSync(path, src); }
  rows.push([n, file, rule, r.files]);
  console.log(n + '/' + BREAKS.length + ' ' + rule + ': ' + Object.keys(r.files).length + ' files');
}
if (arg('--json')) writeFileSync(arg('--json'), JSON.stringify({ clean, rows }));
const say = report(rows, clean);
if (!only && !part && !onlyFile) writeFileSync(join(HERE, 'native-run-recorder_breaks.md'), say.join('\n') + '\n');
console.log(say.slice(-1)[0]);
