---
name: handoff-update
description: Fold a finished Iron Asylum build into IRON_ASYLUM_HANDOFF_1_1.md using the seven-element session entry. Run after gatekeeper reports GREEN, before commit. Also used when Mario says "update the handoff".
---
The handoff is ONE document with a stable filename, overwritten in place. Never append a session narrative to the top; never create a second changelog. Work the seven elements in order and confirm each landed (grep it back).

1. **Current state header** — bump the working file / `ia-version` line to V<N>; rewrite the "Most recent work (V<N>)" bullet in the established voice: what was reported, what the measure pass found, what shipped (by D-code), what the gate proved (assertion count, sabotage x/x, fuzz configs/sessions/violations, hunks classified), what was flagged. Update the live-program line if Mario's config moved.
2. **Numbered sections** — fold durable behaviour next to the code it describes (§4 persistence, §5 engine, §5b/§6b overlays, §6 fatigue, §7 DS, §8 logging/progress, §8b swap, §9 workflow). Delete or rewrite sentences the build made false.
3. **§10b** — promote any lesson that outlives this version. Generic engineering doctrine only, one bullet, tagged with the version in parentheses.
4. **§11f** — record every ruling Mario made this session WITH the reasoning that produced it, and any recommendation he rejected.
5. **§12** — add what is carried forward; DELETE what this build closed (do not annotate as closed).
6. **Digest** — append ONE line at the tail: `- **V<N>** — …`. Check the tail order: the newest line is last.
7. **Session-start check** — `grep -oE 'content="[0-9]+"' index.html` and `grep -c '^- \*\*V<N>' IRON_ASYLUM_HANDOFF_1_1.md` must agree (1 line). If any earlier version has no digest line, say so in the entry and reconstruct it from the header, marked "(reconstructed)".

Also: if `tests/lint_allow.txt` has entries, each one is debt — if this build removed a duplicate, delete its line.
