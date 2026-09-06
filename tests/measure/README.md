Measure-pass scripts live here, one per question, named `v<N>_<question>.js`. They are kept, not deleted:
the before-picture is part of the record. Pattern:

```js
const { load, fixtures, weekGrid } = require('../harness');
const IA = load(process.argv[2] || 'index.html');
const prog = IA.buildProgram(fixtures.HALF_MANNY);
console.log(weekGrid(prog));
```
