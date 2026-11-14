# Stored state: the ninth lift slice as a move, 0.262.1 to 0.262.2

Written by `tests/measure/stored-state_freeze-moved.mjs` from the two built pages.

## Each moved function against its text in 0.262.1

- `refreshProgram` to `refreshStoredProgram`: the same but for blank lines with 20 named substitutions (126 lines)
- `paceShiftMap`: the same to the byte with 2 named substitutions (42 lines)
- `progTestPin`: the same to the byte (8 lines)
- `applyRestDayMoves`: the same to the byte (15 lines)
- `_progDayDate`: the same to the byte (7 lines)
- `weekOfDate`: the same to the byte (7 lines)
- `overlayWeekRange`: the same to the byte (9 lines)
- `dayOverlayInfo`: the same to the byte (4 lines)
- `_dayPlanCfg`: the same to the byte (6 lines)
- `ssSkipToken`: the same to the byte (1 lines)
- `applyDayEdits`: the same to the byte (27 lines)
- `applySessionSwaps`: the same to the byte (22 lines)

## The rest of the page

Both pages with the moved functions taken out and blank lines dropped: 9 lines gone, 12 lines new.

```diff
-<meta name="ia-version" content="0.262.1">
+<meta name="ia-version" content="0.262.2">
-function pruneDayEdits(pid,cutWeek){pruneDayEditsBefore(iaStore,pid,cutWeek);}
-function applyOverlays(prog, rebuilt){
-  return spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, (ov, e)=>{
-    console.error('overlay apply failed', ov && ov.id, e);
-    try{ showToast('A plan change failed to apply. Flag it in Bugs.'); }catch(_e){}
-  });
-}
-      const _map=paceShiftMap(activeProg);
+      const _map=paceShiftMap(activeProg, Date.now());
+function refreshProgram(prog){
+  return refreshStoredProgram(iaStore, prog, Date.now(), {
+    overlay: (ov, e)=>{
+      console.error('overlay apply failed', ov && ov.id, e);
+      try{ showToast('A plan change failed to apply. Flag it in Bugs.'); }catch(_e){}
+    },
+    freeze: (e)=>{ console.error('week freeze failed; showing fully rebuilt weeks', e); },
+    rebuild: (e)=>{ console.error('refreshProgram failed; using stored program', e); },
+  });
+}
```

**Every moved function is its old text with the named substitutions, and the rest of the page differs by the lines above alone.**
