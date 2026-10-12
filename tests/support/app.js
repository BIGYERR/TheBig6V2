'use strict';
// Shared helpers for tests/unit and tests/integration. They reuse tests/harness.js (load, extractInlineJS, fixtures,
// weekGrid, progDigest) and never copy it.
//
//   IA_APP=<file>   run the same tests against another body of the app, for example the previous release:
//                   git show <previous tag>:index.html > <scratch>/prev.html
//                   IA_APP=<scratch>/prev.html node --test tests/unit tests/integration
//                   A test written for a changed behaviour must fail there.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('../harness.js');

const REPO = path.join(__dirname, '..', '..');
/** The app under test: the repo's index.html, or the file IA_APP names. */
const APP = path.resolve(process.env.IA_APP || path.join(REPO, 'index.html'));

let script;
/** The app's inline script, read once. */
function appScript() {
  if (script === undefined) script = H.extractInlineJS(fs.readFileSync(APP, 'utf8'));
  return script;
}

/**
 * One top-level function declaration from the app's inline script, compiled on its own in a fresh context that holds
 * only `globals`. For unit tests of pure logic: nothing else in the app runs.
 * The declaration must start a line (`function name(`) and appear exactly once. It ends at the first closing brace
 * after which the text compiles by itself; a prefix that stops at an inner brace never does.
 */
function appFunction(name, globals = {}) {
  const js = appScript();
  const starts = [...js.matchAll(new RegExp('(^|\\n)function ' + name + '\\s*\\(', 'g'))];
  if (starts.length !== 1) {
    throw new Error(`appFunction: "function ${name}(" starts a line ${starts.length} times in ${APP} (want 1)`);
  }
  const from = starts[0].index + starts[0][1].length;
  for (let end = js.indexOf('}', from); end !== -1; end = js.indexOf('}', end + 1)) {
    const src = '(' + js.slice(from, end + 1) + ')';
    try {
      new vm.Script(src);
    } catch {
      continue;
    }
    return vm.runInContext(src, vm.createContext({ ...globals }));
  }
  throw new Error(`appFunction: the declaration of ${name} in ${APP} never compiles on its own`);
}

/**
 * Boots the app in the VM harness (tests/harness.js load). With `{ dom: true }` the document keeps what the script
 * puts in it: getElementById returns one stub per id, kept in IA.els (a test can place its own stub there first), and
 * document.addEventListener keeps every listener in IA.docListeners. The hook is installed for exactly the one
 * vm.runInContext call that runs the app's script, before any of it runs, so boot-time code writes where a test can
 * read it. harness.js is not changed.
 */
function loadApp(opts = {}) {
  const file = opts.file ? path.resolve(opts.file) : APP;
  if (!opts.dom) return H.load(file);
  const els = {};
  const docListeners = {};
  const orig = vm.runInContext;
  vm.runInContext = function (code, ctx, o) {
    if (typeof code === 'string' && code.includes('globalThis.__IA')) {
      vm.runInContext = orig;
      const doc = ctx.document;
      const mkDiv = doc.getElementById;
      doc.getElementById = (id) => els[id] || (els[id] = Object.assign(mkDiv.call(doc, id), { id }));
      doc.addEventListener = (type, fn) => {
        if (typeof fn === 'function') (docListeners[type] = docListeners[type] || []).push(fn);
      };
    }
    return orig.call(vm, code, ctx, o);
  };
  try {
    const IA = H.load(file);
    IA.els = els;
    IA.docListeners = docListeners;
    return IA;
  } finally {
    vm.runInContext = orig;
  }
}

/**
 * Pins the app's clock: `new Date()` and `Date.now()` inside the VM return `at` (a local date and time, so a test
 * reads the same day in every time zone CI might use). A Date built from arguments is unchanged.
 */
function pinClock(IA, at) {
  const Real = Date;
  const t = (at instanceof Real ? at : new Real(at)).getTime();
  if (!Number.isFinite(t)) throw new Error(`pinClock: ${at} is not a date`);
  class PinnedDate extends Real {
    constructor(...args) {
      if (args.length === 0) super(t);
      else super(...args);
    }
    static now() {
      return t;
    }
  }
  IA.window.Date = PinnedDate;
  return t;
}

module.exports = {
  APP,
  REPO,
  appScript,
  appFunction,
  loadApp,
  pinClock,
  fixtures: H.fixtures,
  weekGrid: H.weekGrid,
  progDigest: H.progDigest,
};
