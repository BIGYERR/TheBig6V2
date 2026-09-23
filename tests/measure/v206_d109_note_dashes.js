// V206 measure (Mode B) — D109: mid-sentence dashes in athlete-facing cardio NOTE strings.
//   node tests/measure/v206_d109_note_dashes.js <index.html>
// Instrument: static source scan (no engine call). Scope = the four cardio session builders,
// bounded by `function X(` to the next top-level `\nfunction `. Comments stripped first (// to EOL
// outside string literals). A "note" is any string literal on a statement that assigns `note`
// (note =, note +=, note:). Detail literals are counted separately as spread.
// Classification of each dash-like char (independent hand rules, from the copy rule):
//   EM   '—' or spaced '–'/' - ' between words      -> mid-sentence dash (copy-rule hit)
//   LBL  '—' directly after an ALL-CAPS label token (e.g. "CHI — Continuous")  -> reported apart
//   RNG  '-' or '–' between digits (85-95%, 60–70%)  -> numeric range, not a dash
//   CMP  '-' between letters, no spaces (long-run)   -> compound word, not a dash
'use strict';
const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
const lines=src.split('\n');
const P=(...a)=>console.log(...a);
const BUILDERS=['buildRunSession','buildNRCSession','buildBikeSession','buildSwimSession'];
function range(fn){ const s=lines.findIndex(l=>l.startsWith('function '+fn+'(')); let e=s+1; while(e<lines.length&&!/^function /.test(lines[e])) e++; return [s,e]; }
function stripComment(l){ let q=null; for(let i=0;i<l.length;i++){ const c=l[i]; if(q){ if(c==='\\'){i++;continue;} if(c===q) q=null; } else { if(c==="'"||c==='"'||c==='`') q=c; else if(c==='/'&&l[i+1]==='/') return l.slice(0,i);} } return l; }
function literals(l){ const out=[]; let q=null,b=''; for(let i=0;i<l.length;i++){ const c=l[i]; if(q){ if(c==='\\'){b+=c+l[i+1];i++;continue;} if(c===q){out.push(b);q=null;b='';} else b+=c; } else if(c==="'"||c==='"'||c==='`'){q=c;b='';} } return out; }
function classify(s){
  const hits=[];
  for(let i=0;i<s.length;i++){
    const c=s[i]; if(c!=='—'&&c!=='–'&&c!=='-') continue;
    const L=s[i-1]||'', R=s[i+1]||'';
    if(c==='-'&&/\d/.test(L)&&/\d/.test(R)) {hits.push('RNG');continue;}
    if(c==='–'&&/\d/.test(L)&&/\d/.test(R)) {hits.push('RNG');continue;}
    if(c==='-'&&/[A-Za-z]/.test(L)&&/[A-Za-z0-9]/.test(R)) {hits.push('CMP');continue;}
    if(c==='-'&&L!==' ') {hits.push('CMP');continue;}
    if(c==='-'&&R!==' ') {hits.push('OTHER-');continue;}
    const before=s.slice(0,i).trimEnd(); const tok=(before.match(/(\S+)$/)||['',''])[1];
    if(c==='—'&&/^[A-Z0-9()]{2,}$/.test(tok)&&before.split(/\s+/).length<=2) {hits.push('LBL');continue;}
    hits.push('EM');
  }
  return hits;
}
const tot={note:{lits:0,em:0,lbl:0},detail:{lits:0,em:0}};
for(const fn of BUILDERS){
  const [s,e]=range(fn); let nNote=0,nEm=0,nLbl=0,nDet=0,nDetEm=0; const rows=[];
  for(let i=s;i<e;i++){
    const l=stripComment(lines[i]);
    const isNote=/\bnote\s*(\+?=|:)/.test(l)&&!/\bnote\s*===/.test(l);
    const isDet=/\bdetail\s*(\+?=|:)/.test(l);
    if(!isNote&&!isDet) continue;
    const lits=literals(l).filter(x=>/[A-Za-z]{3,}/.test(x));
    for(const x of lits){
      const h=classify(x); const em=h.filter(k=>k==='EM').length, lb=h.filter(k=>k==='LBL').length;
      if(isNote){ nNote++; if(em) nEm++; if(lb) nLbl++; rows.push({ln:i+1,em,lb,oth:h.filter(k=>k==='OTHER-').length,x}); }
      else { nDet++; if(em) nDetEm++; }
    }
  }
  P(`\n=== ${fn}  lines ${s+1}-${e}  note literals=${nNote}  with mid-sentence dash (EM)=${nEm}  with label-dash (LBL)=${nLbl}  | detail literals=${nDet} with EM=${nDetEm}`);
  rows.forEach(r=>P(`  :${r.ln}  EM=${r.em} LBL=${r.lb}${r.oth?' OTHER-='+r.oth:''}  ${JSON.stringify(r.x)}`));
  tot.note.lits+=nNote; tot.note.em+=nEm; tot.note.lbl+=nLbl; tot.detail.lits+=nDet; tot.detail.em+=nDetEm;
}
P('\nTOTAL '+JSON.stringify(tot));
