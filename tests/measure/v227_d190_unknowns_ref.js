// v227_d190_unknowns_ref.js — MEASURE (read-only). U2 reference for v227_d190_unknowns.js: for every exSwapPrefs card that
// moves V226 -> D190, what the UNINJURED build (same cfg minus injury, V226) prints in that same slot (R1, no pref) and with
// the same pref (R2), and what the injured build prints in that slot with no pref (R0). Oracle: the engine's uninjured path,
// which never meets a cue, so it cannot have been shaped by the suspect strip.
'use strict';
const path = require('path'), fs = require('fs');
const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const SCR = process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F = n => path.join(SCR, n);
const CUE = ' — hold RPE 7, two in the tank', CLOCK = '2026-09-24';
const MARIO = { name:'M', primaryPath:'lift', cardioTypes:[], cardioGoals:{}, eventTargeted:false, raceDate:null, liftingFocus:'support_strength', experience:'beginner', ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:135, squat:155, deadlift:185, seed:76308 };
const INJ = { mario:{ region:'knee', tier:'workaround' }, lowback_wa:{ region:'lowback', tier:'workaround' }, hip_wa:{ region:'hip', tier:'workaround' }, elbow_wa:{ region:'elbow', tier:'workaround' }, shoulder_wa:{ region:'shoulder', tier:'workaround' } };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
function pin(IA){ const T = new Date(CLOCK + 'T12:00:00').getTime(); const RD = Date; class FD extends RD { constructor(...a){ if(a.length) super(...a); else super(T); } static now(){ return T; } } IA.ctx.Date = FD; }
const cache = {}; function bld(f, cfg){ const k = f + JSON.stringify(cfg); if(cache[k]) return cache[k]; const X = load(F(f)); pin(X); const p = X.buildProgram(JSON.parse(JSON.stringify(cfg))); const m = new Map();
  Object.keys(p.weeks).forEach(w => Object.keys(p.weeks[w]).forEach(d => { const dy = p.weeks[w][d]; ((dy && dy.sections) || []).forEach(s => (s.items || []).forEach(it => { const key = w + '|' + d + '|' + clean(s.label).replace(/ — .*/, '') + '|' + clean(it.name); m.set(key, it.detail || ''); })); })); return cache[k] = m; }
const lines = fs.readFileSync(F('u2_moved_cards.txt'), 'utf8').trim().split('\n');
const re = /^(\S+) \{(.+?): (.+?)\} W(\d+) (\w+) (.+?) :: "(.*?)" => "(.*?)" \[(.+?)\]/;
const tal = {}; const ex = [];
for(const L of lines){ const m = re.exec(L); if(!m){ tal['unparsed'] = (tal['unparsed'] || 0) + 1; continue; }
  const [, ck, src, tgt, w, d, label, v226, d190, kind] = m; const lab = label.replace(/ — .*/, '');
  const inj = Object.assign({}, MARIO, { injury:INJ[ck] }), noinj = Object.assign({}, MARIO);
  const R2 = bld('base_v226.html', Object.assign({}, noinj, { exSwapPrefs:{ [src]:tgt } })).get(w + '|' + d + '|' + lab + '|' + tgt);
  const R1 = bld('base_v226.html', noinj).get(w + '|' + d + '|' + lab + '|' + src), R0 = bld('base_v226.html', inj).get(w + '|' + d + '|' + lab + '|' + src);
  const k = ck + '|' + (kind.startsWith('(ii+g)') ? 'ii+g' : 'iii') + '|' + (R2 === undefined ? 'R2 n/a (slot not on the uninjured card)' : R2 === d190 ? 'D190 == uninjured+pref' : R2 === v226 ? 'V226 == uninjured+pref' : 'neither == uninjured+pref');
  tal[k] = (tal[k] || 0) + 1; if(ex.length < 10 && (ex.length < 3 || !ex.some(x => x.startsWith(ck)))) ex.push(ck + ' {' + src + ': ' + tgt + '} W' + w + ' ' + d + ' ' + lab + ' | V226 ' + JSON.stringify(v226) + ' | D190 ' + JSON.stringify(d190) + ' | R0 injured no-pref src ' + JSON.stringify(R0) + ' | R1 uninjured no-pref src ' + JSON.stringify(R1) + ' | R2 uninjured same pref ' + JSON.stringify(R2)); }
console.log('\n=== U2 reference (' + lines.length + ' moved cards): D190 vs the uninjured build carrying the same pref, same slot (V226 tree)');
Object.keys(tal).sort().forEach(k => console.log('  ' + String(tal[k]).padStart(4) + ' ' + k)); ex.forEach(x => console.log('  e.g. ' + x));
