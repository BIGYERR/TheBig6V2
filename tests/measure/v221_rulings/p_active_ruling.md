# P-ACTIVE — One program is active, one place says so, one button makes it so (provisional; D-code at builder dispatch)

Coach ruling, 2026-09-23, baseline V209 (3b98a0c). Persisted by the orchestrator from coach's return (coach is read-only).

## Correction to the brief (coach, code-read; measure to verify as (a) below)
`ia_active` has no data reader: its only consumers are the card check, `_handoffActiveFrom`, and boot. Every site that moves `activeProgId` (:7335, :15583, :15610-15611, :17263) moves `activeProg` with it. So logs always land on the program whose grid was on screen. The "split" is a display and persistence lie, not a misattribution.

## Mario's calls
1. **One button, "Set Active", lands on This Week.** Recommend. OPEN goes. The "look at an old block" need is already served by Progress (V156 G1 selector, read-only, archived included). Counter: OPEN is the only way to preview a not-yet-started program's week; Progress shows history, not the grid.
2. **`ia_active` is the record; one loader writes it and the globals together.** Boot, wizard, archive/delete handoff and the button all route through it. Boot's fallback writes back (today it does not, :17263).
3. **Archived never loads.** Guard lives in the loader, not the button; restore first. Closes §12's `openProg` item by deletion.
4. **No repair.** Expected wrong-program logs: zero, by the reading above. Measure proves it before build.
5. **Card goal line drops the dash:** `[icon] Hit a Pace / Time Goal + [icon] Build Cycling Base`. Sibling at :3013 (wizard review) same fix.

## Measures needed
(a) Harness: after `setActive("P1")`, log one session, assert the key lands under P0 and the `ia_comp_` title equals P0's card at that key.
(b) Mario's localStorage dump (Safari Web Inspector, `JSON.stringify(localStorage)`; no in-app export exists): count `ia_comp_<id>` records whose `title` differs from that program's own card title at `w<N>_<day>`, plus store keys whose id is absent from `ia_programs`. Only needed if (a) contradicts the reading.
(c) `progDigest` identical on all fixtures, no engine hunk.

## Finding
Measured on V209 (`tests/measure/v221_open_vs_active.js`, PASS 3 FAIL 5). SET ACTIVE writes `ia_active` and repaints the list; `activeProgId` stays P0, `renderWeekView` never runs. OPEN loads P1 into This Week and never writes `ia_active`; the card check stays on P0 and a reboot returns P0. `openProg("P2")` loads an archived program. Root: two stores for one value.

## Coaching argument
The active program is the block the athlete is training. There is exactly one, and the app must never show a check on one program and a session from another. A switch is complete only when the athlete sees today's session on the new block; the wizard already lands on This Week (:7339) and that is the proof-of-switch pattern. Browsing history without switching is a Progress job, ruled per-program in V156 G1, and OPEN is not a browse: it routes every log write to the program it shows.

## What changes
- Card: one button per non-active card, "Set Active". Active card keeps "Active ✓" as a state label. OPEN removed; `openProg` removed (only caller was :14700).
- Loader: one function performs the whole switch: refuse archived (toast "Restore this program first"), write `ia_active`, set `activeProgId`, `activeProg=refreshProgram(stored)`, `currentWeek`, `currentDayKey=null`. Button, boot (:17263, including the fallback arm, which now writes back), wizard commit (:7335) and both arms of `_handoffActiveFrom` (:15610-15611, null arm clears both) call it. Invariant: `localStorage.ia_active === activeProgId` and `activeProg.id === activeProgId`, or all null, after every path.
- Button lands on This Week: `showScreen('screenWeek'); renderWeekView()`; toast "Active program updated" stays.
- Copy :14719: drop `' — '`; icon then label, joined by ` + `. Sibling :3013: `Run — Label` becomes `Run: Label`.

## What does NOT change
The engine, every grid, `HALF_MANNY`'s digest. Archive/restore/delete semantics (V156 D1b, V169). Progress selector and `*For(_vid)` accessors. Bottom-nav path (:1555). Zero-arg store accessors keyed on `activeProgId`.

## Before / After
```
BEFORE
setActive(P1):   ia_active=P1  activeProgId=P0  card=P1  week=Prog0
openProg(P1):    ia_active=P0  activeProgId=P1  card=P0  week=Prog1
reboot after:    ia_active=P0  activeProgId=P0
openProg(P2 archived): loads it

AFTER (expected)
setActive(P1):   ia_active=P1  activeProgId=P1  card=P1  week=Prog1  renderWeekView called
reboot after:    ia_active=P1  activeProgId=P1
setActive(P2 archived): refused, toast, nothing moves
openProg: absent
```

## Blast radius
No goal, focus, calendar or week moves. Surfaces: Programs card (every athlete with two or more programs), boot resolver (every boot), wizard commit, archive/delete handoff. Gates: `progDigest` byte-identical on all fixtures; sabotage drops the persist, drops the global set, drops the archived guard, each must trip; `openProg` removal is a ruled deletion.

**Recommendation:** one "Set Active" button that persists, loads and lands on This Week through a single loader that refuses archived, with no data repair pending measure's zero.
**Counter:** OPEN was the only way to preview an unstarted program's week without committing to it; if Mario wants that, it is a read-only preview built later, never a switch.

## MEASURE VERIFICATION (2026-09-23, V209)
- Coach reading HOLDS. v221_open_vs_active.js PART2 8 PASS 0 FAIL: after setActive(P1) all of ia_logs_/ia_comp_/ia_hist_/ia_exw_ land under P0 with P0 titles; after openProg(P1) all under P1. After reboot the session is filed correctly but disappears from This Week (display/persistence failure, not misattribution).
- ia_active readers: :14716 display, :15608 and :17262 persistence, 0 data readers. No site sets activeProgId without activeProg.
- Call 4 (no repair) stands; measure (b) Mario device dump NOT needed.

## MARIO DECISION
- Pending. Mario dismissed the button question 2026-09-23 ("wait for next instruction"). Do not re-ask until he returns to it.

## MARIO DECISION (2026-09-24, build-1 chat)
- CONCUR: one "Set Active" button that persists, loads and lands on This Week through a single loader that refuses archived; OPEN goes; no data repair. Builds in build 2 (with P-SWAPFLOOR, P-DONENAV). Re-baselined on V219: still reproduces (logs file under P0 after setActive(P1), 8/8); `openProg` sites now :14933, :14983, :15006; `ia_active` :1215, :1216, :15894 (re-grep at build).

## AMENDMENT ON V220 (stale Open copy)

Coach (fresh spawn), 2026-09-24, read on the V220 working tree with D178 slices 1 to 3 landed. Copy only; no engine, no grid, no `HALF_MANNY` movement.

**Finding.** Six `showToast` guards still instruct the athlete to "Open" a program: `:1330 openRestSheet`, `:1554 tabGo`, `:15373 openOverlaySheet`, `:15387 openInjurySheet`, `:15530 applyInjuryDraft`, `:15640 applyOverlayDraft`. "Open" in these strings was never a plain verb; it was the card button's name (the handoff at :1577 calls it "the Open button"). After D178 no control on any screen is named Open, and the only "OPEN" left in the athlete's view is `OPEN SESSION` on the Today hero, a session verb. A coach does not tell the athlete to press a button that is not there.

**Reachability (code read).** Only `:1554` (tabGo, from Home) can fire: no programs; all archived; `ia_active` missing at boot with cards present. The other five sit behind `screenWeek`, entered only through paths that set `activeProg`; they are defensive guards, unreachable in the shipped flow. They change anyway: a guard that can print is a guard that must be true.

**Ruling.**
1. The strings change with D178. Deleting the button and leaving its name in the instructions ships half a deletion.
2. One string serves all six: `No active program. Tap Set Active or build a new one.`
3. Inside D178's licence as a direct consequence of the ruled deletion of OPEN; copy form, the session's call, not Mario's. The "Bottom-nav path" line in "What does NOT change" freezes `tabGo`'s routing and its guard predicate; the toast literal is the guard's message, not the path. Predicate, early return and dispatch stay byte-identical; only the string inside `showToast(...)` moves.

**What changes.** Six string literals, one per site above. Nothing else in any of the six functions.

**What deliberately does NOT change.** `tabGo`'s predicate and routing. `OPEN SESSION` (P-DONENAV's territory). The loader's "Restore this program first" and the button's "Active program updated". The Home empty-state and all-archived copy. `HALF_MANNY`, every grid, every fixture digest.

**Before / After (athlete reads when `activeProg` is null).**
```
state                            BEFORE (:1554)                   AFTER (all six)
no programs                      Open or build a program first    No active program. Tap Set Active or build a new one.
all archived                     Open or build a program first    No active program. Tap Set Active or build a new one.
ia_active missing, cards present Open or build a program first    No active program. Tap Set Active or build a new one.
five screenWeek guards           Open a program first             No active program. Tap Set Active or build a new one.
```

**Blast radius for gatekeeper.** Diff class "D178 copy: stale Open verb", six hunks, each a single string literal inside an existing `showToast(...)`. Any hunk in those six functions beyond the literal is unruled. Token scan after the slice, comments stripped: `Open a program` = 0, `Open or build` = 0, `OPEN SESSION` = 1 (must survive; P-DONENAV's hero status line does not add a second `OPEN SESSION` literal unless its slice says so). `progDigest` byte-identical on all fixtures.

**Flag, out of scope (queued for §12).** In the all-archived state Home says "View them under Progress", but `tabGo`'s guard blocks Progress with this very toast, so Restore is unreachable from Home although `renderProgressScreen` (:17182) already falls back to `_allProgs[0]` when `activeProg` is null. Pre-existing V156 latch, not D178's; fixing it changes the bottom-nav path this ruling froze. Recommended follow-up: `tabGo`'s Progress arm passes whenever any program exists, archived included; This Week keeps the guard.

**Recommendation:** replace all six literals inside the D178 build as a consequence hunk of the ruled OPEN deletion, `tabGo`'s predicate and routing untouched.
**Counter:** the five `screenWeek` guards cannot print, so touching them widens the diff for no visible gain; rebuttal: a string naming a deleted control is a defect whether or not the path to it is open today.

## RE-RULING ON V220 (parked S4: blockOpen, boot)

Coach (fresh spawn), 2026-09-24, on the V220 working tree with S1, S2, S3, S5a, S5b landed. Evidence: measure `tests/measure/v221_blockopen.out.txt`. `HALF_MANNY` built by `buildProgram` reads `startDate null`, digest `0ac7da6b1691a8e1`; the pin is built without the wizard, never carried `blockOpen`; nothing below can move it.

**Verdict on the parked slice: S4 RESUMES WITH NAMED CHANGES. The wizard hunk R2 resumes as written ONLY IF P-BLOCKOPEN ships in the same build.** P-BLOCKOPEN is a separate ruling (session assigns the number), Mario's call, slotted after S4. If Mario holds P-BLOCKOPEN, R2 is dropped from S4 and R1 and R3 resume alone; the wizard keeps `setActiveProgId(prog.id);activeProgId=prog.id;activeProg=prog;` (its invariant already holds on base) and §12 records the wizard commit as the one switch outside the loader, pending P-BLOCKOPEN.

### What the refutation was
Not "every grid unchanged" (weeks JSON identical 46/46 holds). The failed premise: `refreshProgram(stored)` returns the picture the wizard just committed. It does not: the copy-back (:15700) carries `name, created, startDate, seed, overlays` and drops `blockOpen`, which `_applyWizardStart` (:2006) persisted. A latch in `refreshProgram` since V188, not a loader defect. The loader did what D178 said: it made the wizard's landing equal to every later boot.

### 1. The wizard hunk: option (a), as its own ruling. R2 stays.
`blockOpen` is the day the athlete walked in (D14a §2, V188). Days between the counted-back start and it are behind them: not missed, not pending, not in the DONE denominator, never the hero, no reminder (D24). The wizard says so (:1964): "Weeks 1 to N are behind you: shown, not counted, not missed." On base that is true for one session; after the first reboot the program shows `0/5 DONE` on pre-signup weeks, offers those days, makes their rest days rest-move targets, and greets the athlete with "More than a week off…" (reminder differs 209/209). A later race/start-date tap then destroys the stored flag for good.
- (b) second writer: rejected (restores the flag for one session only; breaks the one-loader invariant).
- (c) accept R2 alone: rejected on its own (moves the contradiction to 600 ms after the :1964 sentence).
- (a) recommended: `rebuilt.blockOpen = prog.blockOpen;` next to `startDate` in the copy-back.

### 2. P-BLOCKOPEN: separate ruling, not inside D178. Mario's call.
New athlete-visible surface (week view strip, hero, DONE tile, day tap, rest-move eligibility, boot reminder on 209/365 aligned programs after any reboot), fixes a V188 ruling, changes what Mario's phone shows on his own half.
- **Changes:** the `refreshProgram` copy-back gains `rebuilt.blockOpen = prog.blockOpen;`. Nothing else.
- **Does NOT change:** the writer (`_applyWizardStart` only), the reader (`dayBeforeStart`) and its nine call sites, `setProgRace`/`setProgStart` (zero edits; they stop destroying the flag because the in-memory copy now carries it; the ":14570 blockOpen stays" comment becomes true), the engine, every grid, test goals (0/17), non-aligned NRC, `HALF_MANNY`'s pinned digest.
- **No repair from `created`** in this version (a second writer of a flag D14a §2 reserves to alignment; population unmeasured). Queue in §12, gated on Mario's device read.
- **Completions on now-outside days** keep their records (`ia_comp_`, `ia_hist_`, Progress); the cell dims, DONE tile and streak stop counting them. No record deleted (D24).
- **Mario's device read (measure):** does his half carry `blockOpen` in `ia_programs`, its value, and any `ia_comp_` keys before it. Decides whether P-BLOCKOPEN moves anything on his live program and whether the `created` repair becomes his question.
- **Before / After, HALF_MANNY on measure's clock (blockOpen 2026-09-24):**
```
                     BEFORE (any reboot V188–V220, and S4 landing)   AFTER (P-BLOCKOPEN)
W1 strip             7/7 cells in-block, tappable                   7/7 cells .pre (dim, dated)
W1 hero              W1's first training day                        none (browse)
W1 DONE tile         0 /5 DONE                                      0 /0 DONE
W1 day tap           opens the day                                  toast: Before your start date
W4 strip             7/7 in-block                                   mon tue wed .pre; thu on in-block
W4 hero              thu (today)                                    thu (today) [same]
W4 DONE tile         0 /5 DONE                                      0 /3 DONE
boot reminder        "More than a week off. Mark what happened…"    none
scheduledDays(today) 18                                             1
restDayEligible      7 pre-signup rest days are rest-move targets   0
streak               0                                              0 [same]
wizard landing       S4 alone: BEFORE column, 600 ms after :1964    equals the reboot picture
```
- **Blast radius:** aligned race programs after any reboot: 5K 25/91, 10K 25/91, half 67/91, marathon 91/91; 1,164 weeks strip + DONE tile, 955 hero, 209/209 reminder, 7,312 day taps, 2,119 rest days leave the rest-move pool. Zero prescription moves. Test goals zero.
- **Gates:** (i) `refreshProgram` output carries `blockOpen` equal to input on aligned rows, no key on non-aligned rows; (ii) after boot then `setProgRace(same)`, stored `blockOpen` unchanged; (iii) wizard landing week-1 render equals post-reboot render 46/46; (iv) boot reminder target null on the fixture; (v) `progDigest(buildProgram(HALF_MANNY))` unmoved. Sabotage: drop the copy-back line; (i)–(iv) trip.

### 3. Boot with a stale pointer and nothing loadable: inside D178, named change to S4's boot hunk (R3)
"Or all null, after every path": boot is a path. Case (a) (all archived, `ia_active=A1`) lands on Home with the pointer set on base and S4. The fallthrough before `showScreen('screenHome')` calls `loadActiveProgram(null)` when `aid` resolved to nothing. Athlete-visible: restoring A1 makes the card show the active label while `activeProg` is null and `tabGo` refuses; clearing at boot puts Set Active back on the restored card. Gate: case (a) boot → `ia_active` absent, Home; unarchive A1 → card offers Set Active, This Week guarded until tapped. Sabotage: drop the fallthrough clear. Correction to measure: cases b/b2 are the all-null arm (the BROKEN label compared the script's `'GONE'` string); only case (a) is a live gap. Session's call.

### 4. Legacy-delete storage loss: named change, one line moved (session's call)
`deleteProg` hands off first and saves the stale array after, overwriting the loader's persisted `cfg.seed` backfill. Move `programs=programs.filter(p=>p.id!==id);savePrograms(programs);` above `_handoffActiveFrom(id,programs);` (the order `archiveProg` already has). Which program becomes active, the purge and the confirm tiers do not move. Gate: measure section 5's `s4 deleteProg` row reads stored `cfg.seed=4242` and `_testWeek=7`; sabotage swaps the lines back.

### 5. `overlays` absent → `[]`: nothing
In-memory normalisation every boot already applies. Gatekeeper classifies it as loader normalisation; the S4 identity check compares with `overlays` normalised.

### Resume instructions for S4
R1 and R2 byte-identical to the parked script (R2 only with P-BLOCKOPEN). R3 adds the fallthrough `loadActiveProgram(null)`. `deleteProg` saves the filtered list before the handoff. Post-flight counts update (`loadActiveProgram(` +1; `removeItem('ia_active')` still 1). P-BLOCKOPEN, if concurred, is its own slice after S4 with its own script, gate and diff class, and its own §11f entry under D14a's lineage.

**Recommendation:** resume S4 with the boot clear and the delete reorder, keep the wizard hunk, and ship P-BLOCKOPEN in the same build, put to Mario; read his stored flag before the build.
**Counter:** P-BLOCKOPEN moves 209 programs' post-reboot picture for a flag nobody has seen survive past day one; but the alternative ships a first landing that contradicts the sentence above it, and the doctrine was settled at V188.

## MARIO DECISION ON P-BLOCKOPEN
- 2026-09-24, build-2 chat: SHIP P-BLOCKOPEN in V221 (coach recommendation accepted). S4 resumes with R2 (wizard hunk), R3 plus the boot fallthrough clear, and the `deleteProg` save-before-handoff. P-BLOCKOPEN is its own slice after S4.
- Device read: SKIPPED for this build (recommendation accepted). The read of `ia_programs[…].blockOpen` and pre-flag `ia_comp_` keys goes to §12 with the queued `created` repair.
