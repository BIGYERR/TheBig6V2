import { init } from './bug-report-init.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

/* ═══════════════════════════════════════════
   UPDATE CHECK — detects a newer index.html on GitHub Pages
   Single source of truth: <meta name="ia-version">. The running app knows its
   own version from its own DOM; the check re-fetches index.html with no-store
   and reads the same meta from the fresh bytes. No service worker involved.
═══════════════════════════════════════════ */
// @ts-expect-error TS2339 Property 'content' does not exist on type 'Element | {}'.
const IA_VERSION = (document.querySelector('meta[name="ia-version"]')||{}).content || '0';
// v0.239.1 (D236.1): the version as people read it, 'v' plus MAJOR.MINOR.PATCH. One leading v or V is dropped
// first, so the label never reads vv. A pre-semver integer N reads 0.N.0 (239 prints v0.239.0); anything else
// prints as given after one v, so the label never throws. IA_VERSION stays the raw meta for the update check.
function iaVersionLabel(ver: any){
  var s=String(ver),t=/^[vV]/.test(s)?s.slice(1):s;
  return /^(0|[1-9][0-9]*)$/.test(t)?'v0.'+t+'.0':'v'+t;
}
let _iaUpdateDismissed = false;   // session-only; re-arms on next full load
let _iaUpdateShown = false;

function iaShowUpdateBanner(){
  if(_iaUpdateDismissed || _iaUpdateShown) return;
  const b=document.getElementById('iaUpdateBanner'); if(!b) return;
  b.classList.add('show'); _iaUpdateShown=true;
}
function iaDismissUpdate(){
  _iaUpdateDismissed=true;
  const b=document.getElementById('iaUpdateBanner'); if(b) b.classList.remove('show');
}
function iaDoUpdate(){
  // Cache-busted navigation forces a fresh fetch of the real file, not just the probe.
  location.replace(location.pathname + '?_ib=' + Date.now());
}
async function iaCheckForUpdate(){
  if(_iaUpdateShown || _iaUpdateDismissed) return;   // already surfaced or dismissed this session
  try{
    const url = location.pathname + '?_ivc=' + Date.now();
    const r = await fetch(url, {cache:'no-store'});
    if(!r.ok) return;
    const txt = await r.text();
    const m = txt.match(/name=["']ia-version["']\s+content=["']([^"']+)["']/i);
    if(!m) return;
    const remote = m[1];
    if(remote && remote !== IA_VERSION) iaShowUpdateBanner();
  }catch(e){ /* offline / transient — stay silent */ }
}
// Delayed first check (let the app settle), on foreground, and a slow poll while open.
setTimeout(iaCheckForUpdate, 4000);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') iaCheckForUpdate(); });
setInterval(()=>{ if(document.visibilityState==='visible') iaCheckForUpdate(); }, 15*60*1000);

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}


// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { IA_VERSION, iaVersionLabel };
