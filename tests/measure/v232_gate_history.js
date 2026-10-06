// v232_gate_history.js — measure pass (Mode B, record not engine): which gates have gone RED, on which build, why.
// Reads the handoff, the rulings dirs and git history of tests/gates. Prints red-keyword sentences tagged by version.
// Usage: node tests/measure/v232_gate_history.js <outdir>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2] || '.';
const H = fs.readFileSync(path.join(ROOT, 'IRON_ASYLUM_HANDOFF_1_1.md'), 'utf8');
const KW = /\b(RED|REFUSED|REFUSES|crash(ed|es)?|no summary|FAIL [1-9]\d*|went red|tripped on|false (red|alarm)|regression|caught|would have shipped|re-?key(ed)?|era row|no row|scoped to|licen[cs]e[ds]?)\b/i;
const lines = H.split('\n');
let out = [];
lines.forEach((ln, i) => {
  const m = ln.match(/^- \*\*(V\d{3}|Post-V\d{3}|tooling|tests)/);
  const tag = m ? m[1] : null;
  const sents = ln.split(/(?<=[.;])\s+/);
  const hits = sents.filter(s => KW.test(s));
  if (hits.length) out.push(`L${i + 1}${tag ? ' [' + tag + ']' : ''}: ` + hits.map(s => s.slice(0, 400)).join(' || '));
});
fs.writeFileSync(path.join(OUT, 'v232_hist_handoff.out'), out.join('\n') + '\n');
// git history: commits touching tests/gates with message, and per-commit gate files modified (not added)
const log = cp.execSync('git log "--format=@@%h %s" --name-status 77e7765^..HEAD -- tests/gates tests/harness.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const commits = log.split('@@').filter(Boolean).map(b => { const [hd, ...rest] = b.trim().split('\n'); return { hd, mods: rest.filter(r => /^M\t/.test(r)).map(r => r.slice(2)), adds: rest.filter(r => /^A\t/.test(r)).length }; });
fs.writeFileSync(path.join(OUT, 'v232_hist_git.out'), commits.map(c => `${c.hd}\n  added ${c.adds}; modified ${c.mods.length}: ${c.mods.map(f => path.basename(f, '.js')).join(' ')}`).join('\n') + '\n');
console.log('handoff hit lines', out.length, 'of', lines.length, '; gate commits', commits.length);
// Pass 2: full sentences around proof outcomes in the Current-state work entries (handoff L12..L116).
{
  const KW2 = /\b(RED|red|REFUSE[DS]?|crash\w*|dark|SURVIV\w*|tripwire|era row|went|first proof|first pass|first chain|proof|GREEN)\b/;
  const o2 = [];
  for (let i = 11; i < 116; i++) {
    const ln = lines[i]; if (!/^- \*\*(Prior|Most recent|Post)/.test(ln)) continue;
    const ver = (ln.match(/\((V\d{3})\)|(Post-V\d{3})/) || [])[0] || '?';
    const s = ln.split(/(?<=[.;])\s+(?=[A-Z*(`])/).filter(x => KW2.test(x));
    o2.push(`### L${i + 1} ${ver}\n` + s.map(x => '  - ' + x.slice(0, 900)).join('\n'));
  }
  fs.writeFileSync(path.join(OUT, 'v232_hist_proofs.out'), o2.join('\n') + '\n');
  console.log('proof entries', o2.length);
}
