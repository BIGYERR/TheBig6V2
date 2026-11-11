// Measure: what a swipe deck card would print, for D283 P-DECKFIT (docs/decisions/swipe-deck.md). Builds every program
// on the shared 864-config lattice (HALF_MANNY under each override) and prints every distinct prescription string
// (item.detail) and every section label, each with how often it appears, so the deck's prescription line and title rule
// can be checked against the whole set. Run on any body of the app: node tests/measure/swipe-deck_prescriptions.js [app.html]
'use strict';
const path = require('path');
const H = require('../harness.js');
const L = require('../lattice193.js');
const app = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(app);
const details = {}, labels = {};
let builds = 0, days = 0;
for (const c of L.FULL) {
  builds++;
  const p = IA.buildProgram({ ...IA.fixtures.HALF_MANNY, ...c.over });
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d];
    if (!day || day.rest) continue;
    days++;
    for (const s of day.sections || []) {
      const l = s.label || '(none)';
      labels[l] = (labels[l] || 0) + 1;
      for (const it of s.items || []) { const k = String(it.detail || ''); details[k] = (details[k] || 0) + 1; }
    }
  }
}
const dash = (s) => /[—–]/.test(s);
const out = [];
const dk = Object.keys(details).sort((a, b) => details[b] - details[a]);
const lk = Object.keys(labels).sort((a, b) => labels[b] - labels[a]);
out.push('METHOD tests/measure/swipe-deck_prescriptions.js on ' + path.basename(app) + ' | builds ' + builds + ' | training days ' + days);
out.push('PRESCRIPTIONS distinct ' + dk.length + ' | with an em or en dash ' + dk.filter(dash).length + ' | with an em dash ' + dk.filter((s) => s.includes('—')).length);
dk.forEach((k) => out.push(details[k] + '\t' + k));
out.push('LABELS distinct ' + lk.length + ' | with " — " ' + lk.filter((s) => s.includes(' — ')).length);
lk.forEach((k) => out.push(labels[k] + '\t' + k));
console.log(out.join('\n'));
