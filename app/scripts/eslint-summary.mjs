// ESLint formatter for npm run lint:legacy: counts per rule, then the first few findings of each,
// so a 1.2 MB script reads as a short report instead of thousands of lines.
const EXAMPLES_PER_RULE = 3;

export default function summary(results) {
  const byRule = new Map();
  let total = 0;
  for (const file of results) {
    for (const m of file.messages) {
      total++;
      const rule = m.ruleId ?? (m.fatal ? 'parse-error' : 'other');
      if (!byRule.has(rule)) byRule.set(rule, []);
      byRule.get(rule).push(m);
    }
  }
  if (!total) return 'lint:legacy: no findings\n';
  const lines = [`lint:legacy: ${total} finding(s) in public/legacy/app.js (warnings; nothing fails)`, ''];
  for (const [rule, list] of [...byRule].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`  ${String(list.length).padStart(5)}  ${rule}`);
    for (const m of list.slice(0, EXAMPLES_PER_RULE)) lines.push(`         line ${m.line}: ${m.message}`);
  }
  return lines.join('\n') + '\n';
}
