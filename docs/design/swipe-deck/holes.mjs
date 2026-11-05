// Every {{hole}} in a built board resolves to a defined value on every card, drawer open, the run picker open.
import { readFileSync } from 'node:fs';
const file = process.argv[2];
const html = readFileSync(file, 'utf8');
const markup = html.split('<x-dc>')[1].split('</x-dc>')[0];
const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
const WIN = { matchMedia: () => ({ matches: true }), addEventListener() {}, removeEventListener() {} };
const Cls = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', js + '\nreturn Component;')(
  class { constructor(p) { this.props = p; } setState(s) { this.state = Object.assign({}, this.state, s); } }, WIN, (f) => { f(); return 0; }, () => {});
const c = new Cls({ look: 'auto', vertical: false });
const n = c.data().cards.length;
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
const toks = markup.match(/<sc-for\b[^>]*>|<\/sc-for>|\{\{[^}]+\}\}/g);
const bad = new Set(); let checked = 0;
const RESTS = [{}, { view: 'move', pick: 'fri', log: { run: { mins: 30, dist: 3.1, rpe: 5 } } }, { view: 'cardio', rpe: 9, log: { run: { mins: 30 } } }, { moved: { k: 'thu', label: 'Thursday', title: 'Legs' } }];
for (let i = 0; i < n; i++) for (const peek of [false, true]) for (const rest of RESTS) {
  c.setState({ i, open: true, spick: { [i]: true }, drag: peek, dx: peek ? -80 : 0, dy: 0, rest: { [i]: rest } });
  const v = c.renderVals();
  const stack = [];
  for (const t of toks) {
    if (t.startsWith('<sc-for')) {
      const list = (t.match(/list="\{\{([^}]+)\}\}"/) || [])[1], as = (t.match(/as="([^"]+)"/) || [])[1];
      const scope = Object.assign({}, v, ...stack.map((s) => s.bind));
      const arr = get(scope, list);
      stack.push({ bind: { [as]: Array.isArray(arr) && arr.length ? arr[arr.length - 1] : undefined }, empty: !Array.isArray(arr) || !arr.length });
      continue;
    }
    if (t === '</sc-for>') { stack.pop(); continue; }
    if (stack.some((s) => s.empty)) continue;
    const p = t.slice(2, -2).trim();
    const scope = Object.assign({}, v, ...stack.map((s) => s.bind));
    const root = p.split('.')[0];
    if (p === 'true' || p === 'false') continue;
    if (!(root in scope)) { bad.add(p + ' (root)'); continue; }
    // A hole behind a false sc-if may be absent; only a value that is undefined while its parent exists is flagged.
    const parent = p.includes('.') ? get(scope, p.split('.').slice(0, -1).join('.')) : scope;
    if (parent != null && get(scope, p) === undefined) bad.add(p + ' card ' + i + (peek ? ' peek' : ''));
    checked++;
  }
}
console.log(file.split('/').pop(), checked, 'holes checked,', bad.size ? 'UNRESOLVED: ' + [...bad].slice(0, 12).join(', ') : 'all resolve');
if (bad.size) process.exitCode = 1;
