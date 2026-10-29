// D261 (night mode): the look is Auto, Day or Night. Auto is no ia_theme key and no data-theme on <html>: the phone
// decides, through base.css's prefers-color-scheme block. Day and Night set data-theme, which outranks the phone. The
// home screen's Look row marks the chosen option from that attribute in CSS, so nothing here draws it.
const THEME_KEY='ia_theme';
function getTheme(): 'auto'|'day'|'night'{
  try{const v=localStorage.getItem(THEME_KEY);return v==='day'||v==='night'?v:'auto';}catch{return 'auto';}
}
// The browser's bar (theme-color) takes the paper the palette resolved to, so it follows Auto too.
function applyTheme(){
  const t=getTheme();const root=document.documentElement;
  if(t==='auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme',t);
  const meta=document.querySelector('meta[name="theme-color"]');
  let paper='';
  try{paper=getComputedStyle(root).getPropertyValue('--bg').trim();}catch{paper='';}
  if(meta&&paper) meta.setAttribute('content',paper);
}
function setTheme(t: string){
  try{if(t==='day'||t==='night') localStorage.setItem(THEME_KEY,t); else localStorage.removeItem(THEME_KEY);}catch{}
  applyTheme();
}
try{
  const mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');
  if(mq&&mq.addEventListener) mq.addEventListener('change',applyTheme);
}catch{}
applyTheme();
