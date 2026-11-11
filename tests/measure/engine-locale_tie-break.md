# Engine: does the phone's language change a program? (measured 2026-11-11, v0.261.1)

**Question.** `core/src/engine/core-legs.ts:460` breaks a sort's tie between two exercise names with
`a.localeCompare(b)` and no locale, so their order is the device's collation. Does any program change with the
phone's language, and what would a language-free compare move?

**How.** `tests/measure/engine-locale_tie-break.js` builds the 864-config lattice (HALF_MANNY's own cell among them)
on the built page and prints each program's digest. Run once per locale by setting `LC_ALL` and `LANG` for the Node
process (V8 with ICU; the first line of each run prints the locale Node resolved and two probes, so a locale that did
not take is visible). Then once more on a copy of the page whose three `return a.localeCompare(b);` lines (this one
and two in `swaps-edits.ts`) are a plain code unit compare.

| Run | Locale Node resolved | `"ch".localeCompare("d")` | Programs that differ from en-US |
|---|---|---|---|
| today's page | en-US | -1 | baseline |
| today's page | cs-CZ | 1 (Czech sorts ch after h, so the locale took) | 0 of 864 |
| today's page | lt-LT | -1 | 0 of 864 |
| today's page | sv-SE | -1 | 0 of 864 |
| today's page | et-EE | -1 | 0 of 864 |
| today's page | tr-TR | -1 | 0 of 864 |
| today's page | de-DE | -1 | 0 of 864 |
| today's page | ja-JP | -1 | 0 of 864 |
| plain code unit compare | en-US | n/a | 0 of 864 |

**What it shows.**
- On the lattice the phone's language changes no program, in seven languages chosen for collations that differ from
  English. The dependence is in the code and was not seen in any output.
- Replacing the compare with a plain one moves no program on the lattice either, so that change would ship with no
  golden file moving.
- Not covered: configs outside the lattice (other goals than the half marathon), and JavaScriptCore or Hermes on a
  phone, whose collation is the platform's and not ICU's as Node carries it.
