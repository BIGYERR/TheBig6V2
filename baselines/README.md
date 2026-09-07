# Baselines

Previous builds, kept so blast-radius and gate work always has a real `N-1` to diff against.

**Why this directory exists.** V188 and V189 were never committed. All three tags `V188`, `V189` and
`V190` pointed at the same V190 commit, so `git show V189:index.html` returned V190 and the
blast-radius step in CLAUDE.md was unrunnable — a diff of V190 against V190 either fails as
"byte-identical, nothing was built" or, worse, reads as clean. The two artifacts were recovered from
Mario's Downloads in the V190 gate session. Losing a baseline costs a whole verification standard:
without V189 the 28-hunk D39 diff could not be classified and three §5r figures could not be resolved.

**Rule going forward.** Every release drops its artifact here as `V<N>.html` in the same commit that
ships it, and the commit gets tagged `V<N>`. The tag and the file are two records of one thing; if
they ever disagree, the file wins — grep the artifact, never trust a label.

**Use.**

```bash
node tests/gates/g190_rounds.js baselines/V189.html     # a D39 gate MUST fail here
bash -c 'set -eo pipefail; tests/gate.sh index.html baselines/V189.html'
node tests/measure/v190_rounds.js index.html baselines/V189.html
```

**Verified at commit time.** Both boot in `tests/harness.js`, both self-stable at seed 76308
(V188 digest `4fb9b6728caaf798`, V189 `91096052a12e5fe1`), both carry zero D39 symbols, and
`g190_rounds.js` fails identically on each (`PASS 9 FAIL 38`), as it does on V187 — which is the
isolation proof that the gate reads D39 and not the rulings around it.

These are served by GitHub Pages along with the rest of the repo. They are older working copies of a
public app, which is why committing them was Mario's call and not an agent's.
