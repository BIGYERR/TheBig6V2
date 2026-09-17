Measure-pass scripts live here, one per question, named `v<N>_<question>.js`. They are kept, not deleted:
the before-picture is part of the record. Pattern:

```js
const { load, fixtures, weekGrid } = require('../harness');
const IA = load(process.argv[2] || 'index.html');
const prog = IA.buildProgram(fixtures.HALF_MANNY);
console.log(weekGrid(prog));
```

## Layout (V197)

Two kinds of thing live here and they age differently.

**Top level — reusable instruments.** Tools that answer a recurring question and get
re-run on later versions: the identity fuzz, the engine-confinement dumps, the
digest-neutrality harnesses, the probe-mutation technique, the DST lattice, the timing
pass. Reach for these first; most new questions are a variation on one of them.

**`answered/` — one-shot answers.** Scripts that proved a number for one build and are
done. Kept because a ruling cites them and because the next person to doubt a number
should be able to re-run the thing that produced it, not re-derive it. Filenames carry
their version, so the prefix does the dating.

Moving a script out of `answered/` is fine when it turns out to be reusable. Moving one
in is how this directory stays findable.
