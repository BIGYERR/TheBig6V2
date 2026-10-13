import { _curScreen, activeProg } from './rest-day-shell.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── Floating count-up rest stopwatch (PiP-style edge tab). Persists app-wide; runs through screen-lock. ──
let _ruId=null,_ruRunning=false,_ruElapsed=0,_ruStart=0;
let _rtSide='right',_rtExpanded=false,_rtIntroTO=null,_rtInited=false,_rtDragging=false,_rtIntroPending=false;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setRtIntroPending(v){ _rtIntroPending=v; }
// V239 (D233, R1 as amended): inside the native app (window.iaIsland present) the rest clock is the wall clock
// and the island mirrors every seam; on the PWA it stays performance.now() and the island is never called.
function _ruClock(){return window.iaIsland?Date.now():performance.now();}
function _ruIsland(){var I=window.iaIsland;if(!I)return;try{if(_ruRunning)I.run(_ruStart);else if(_ruElapsed>0)I.stop(_ruElapsed);else I.end();}catch(e){}}
function _ruNow(){return _ruRunning?(_ruClock()-_ruStart):_ruElapsed;}
function _rtPad(n){return(n<10?'0':'')+n;}
function _rtStack(str){var h='';for(var i=0;i<str.length;i++){var c=str[i];h+='<span>'+(c===':'?'<span style="opacity:.7">:</span>':c)+'</span>';}return h;}
function _ruRender(){
  var ms=_ruNow();if(ms<0)ms=0;
  var cs=Math.floor(ms/10)%100,ts=Math.floor(ms/1000),m=Math.floor(ts/60),s=ts%60;
  var main=m+':'+_rtPad(s);
  var mini=document.getElementById('rtMini');if(mini){mini.innerHTML=_rtStack(main);mini.classList.toggle('run',_ruRunning);}
  var bt=document.getElementById('rtBig');if(bt)bt.textContent=main;
  var bc=document.getElementById('rtCs');if(bc)bc.textContent='.'+_rtPad(cs);
  var b=document.getElementById('rtToggle');if(b){b.textContent=_ruRunning?'Stop':'Start';b.classList.toggle('running',_ruRunning);}
}
function ruStart(){if(_ruRunning)return;_ruRunning=true;_ruStart=_ruClock()-_ruElapsed;if(_ruId)clearInterval(_ruId);_ruId=setInterval(_ruRender,33);_ruRender();_ruIsland();}
function ruPause(){if(_ruRunning){_ruElapsed=_ruClock()-_ruStart;}_ruRunning=false;if(_ruId){clearInterval(_ruId);_ruId=null;}_ruRender();_ruIsland();}
function ruToggle(){if(_ruRunning)ruPause();else ruStart();}
function ruReset(){ruPause();_ruElapsed=0;_ruRender();_ruIsland();}
// Idle-only reset for day-open: a running rest survives navigation; a cold open starts fresh.
function ruResetIfIdle(){if(!_ruRunning){_ruElapsed=0;_ruRender();_ruIsland();}}

function _rtDismissIntro(){if(_rtIntroTO){clearTimeout(_rtIntroTO);_rtIntroTO=null;}var c=document.getElementById('rtCard'),t=document.getElementById('rtTab');if(c)c.style.animation='';if(t)t.style.animation='';}
// First-run discovery sequence: expand the card, pop+wiggle it out from the edge, hold, then fold to the pill.
function _rtPlayIntro(){
  var card=document.getElementById('rtCard'),tab=document.getElementById('rtTab');
  if(!card||!tab){_rtSetExpanded(false);return;}
  _rtSetExpanded(true);
  card.style.animation='none';void card.offsetWidth;
  card.style.animation='rtCardIntro 1.9s cubic-bezier(.34,1.25,.5,1) .3s 1 both';
  if(_rtIntroTO)clearTimeout(_rtIntroTO);
  _rtIntroTO=setTimeout(function(){
    _rtIntroTO=null;
    card.style.animation='';
    _rtSetExpanded(false);
    tab.style.transformOrigin='right center';
    tab.style.animation='none';void tab.offsetWidth;
    tab.style.animation='rtPillSettle .34s cubic-bezier(.34,1.4,.5,1) 1 both';
    setTimeout(function(){tab.style.animation='';tab.style.transformOrigin='';},420);
  },2200);
}
function _rtApplySide(){
  var anchor=document.getElementById('rtAnchor'),tab=document.getElementById('rtTab'),card=document.getElementById('rtCard'),chev=document.getElementById('rtChev'),nub=document.getElementById('rtNub');
  if(!anchor)return;
  if(_rtSide==='right'){
    anchor.style.right='0';anchor.style.left='auto';
    tab.style.borderRadius='14px 0 0 14px';tab.style.borderRight='none';tab.style.borderLeft='1.5px solid var(--signal)';
    card.style.borderRadius='12px 0 0 12px';card.style.borderRight='none';card.style.borderLeft='2px solid var(--signal)';
    if(chev)chev.innerHTML='&#8249;';if(nub){nub.style.left='18px';nub.style.right='auto';}
  }else{
    anchor.style.left='0';anchor.style.right='auto';
    tab.style.borderRadius='0 14px 14px 0';tab.style.borderLeft='none';tab.style.borderRight='1.5px solid var(--signal)';
    card.style.borderRadius='0 12px 12px 0';card.style.borderLeft='none';card.style.borderRight='2px solid var(--signal)';
    if(chev)chev.innerHTML='&#8250;';if(nub){nub.style.right='18px';nub.style.left='auto';}
  }
}
function _rtSetExpanded(v){
  _rtExpanded=v;
  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard');
  if(tab)tab.style.display=v?'none':'flex';
  if(card)card.style.display=v?'block':'none';
  _ruRender();
}
function rtExpand(){_rtSetExpanded(true);}
function rtCollapse(){_rtDismissIntro();_rtSetExpanded(false);}
function rtToggleBtn(){var wasIntro=!!_rtIntroTO;_rtDismissIntro();ruToggle();if(wasIntro)rtCollapse();}
function rtResetBtn(){var wasIntro=!!_rtIntroTO;_rtDismissIntro();ruReset();if(wasIntro)rtCollapse();}

function _rtWireDrag(handle,isTab){
  var sx=0,sy=0,sTop=0,moved=false,dragging=false;
  handle.addEventListener('pointerdown',function(e){
    if(e.target.closest('.rt-btn,.rt-reset,.rt-collapse'))return;
    var anchor=document.getElementById('rtAnchor');
    dragging=true;_rtDragging=true;moved=false;sx=e.clientX;sy=e.clientY;sTop=anchor.offsetTop;
    if(e.cancelable)e.preventDefault();
    anchor.style.transition='none';try{handle.setPointerCapture(e.pointerId);}catch(_){}
  });
  handle.addEventListener('pointermove',function(e){
    if(!dragging)return;
    if(e.cancelable)e.preventDefault();
    var anchor=document.getElementById('rtAnchor'),frame=document.getElementById('restFloat');
    var dx=e.clientX-sx,dy=e.clientY-sy;
    if(Math.abs(dx)>5||Math.abs(dy)>5)moved=true;
    // v0.239.1 (D235.1): below the 5 px threshold nothing is written, so a jittery tap leaves the timer docked.
    if(!moved)return;
    var fb=frame.getBoundingClientRect();
    var maxT=window.innerHeight-anchor.offsetHeight-8;
    anchor.style.top=Math.max(8,Math.min(maxT,sTop+dy))+'px';
    var w=anchor.offsetWidth;
    var x=Math.max(0,Math.min(fb.width-w,e.clientX-fb.left-w/2));
    anchor.style.left=x+'px';anchor.style.right='auto';
  });
  // v0.239.1 (D235.2): one end-of-drag path for pointerup and pointercancel. It ends the drag, restores the
  // snap transition and, when the drag moved, docks the timer to the nearer edge. It returns moved.
  function snap(){
    dragging=false;_rtDragging=false;
    var anchor=document.getElementById('rtAnchor'),frame=document.getElementById('restFloat');
    anchor.style.transition='left .18s cubic-bezier(.34,1.3,.5,1),right .18s cubic-bezier(.34,1.3,.5,1)';
    if(moved){
      var center=anchor.offsetLeft+anchor.offsetWidth/2,fb=frame.getBoundingClientRect();
      _rtSide=(center<fb.width/2)?'left':'right';
      anchor.style.left='';_rtApplySide();
    }
    return moved;
  }
  handle.addEventListener('pointerup',function(e){
    if(!dragging)return;
    if(snap())return;
    if(isTab){_rtDismissIntro();rtExpand();}
    else if(_rtIntroTO){rtCollapse();}
  });
  // A cancel ends the drag through snap() and never runs a tap action; outside a drag it only clears the flags.
  handle.addEventListener('pointercancel',function(){
    if(dragging){snap();}
    else{_rtDragging=false;}
  });
}
function _rtInit(){
  if(_rtInited)return;
  var tab=document.getElementById('rtTab'),card=document.getElementById('rtCard'),anchor=document.getElementById('rtAnchor');
  if(!tab||!card||!anchor)return;
  _rtInited=true;
  _rtWireDrag(tab,true);_rtWireDrag(card,false);
  // iOS drives page scroll from touch events, so a non-passive touchmove guard is the only reliable
  // way to stop the page moving while the tab is being dragged. Only active mid-drag.
  document.addEventListener('touchmove',function(e){if(_rtDragging&&e.cancelable)e.preventDefault();},{passive:false});
  _rtApplySide();_rtSetExpanded(false);_ruRender();
}
// Visible whenever a program is active and we're on an in-program screen (week / progress / bugs,
// including the day + random overlays that sit on top of them). Hidden on home + the build wizard.
function updateRestFloat(){
  var el=document.getElementById('restFloat');if(!el)return;
  var show=!!activeProg&&(_curScreen==='screenWeek'||_curScreen==='screenProgress'||_curScreen==='screenBugs');
  el.style.display=show?'block':'none';
  if(!show)return;
  _rtInit();
  if(_rtIntroPending){
    _rtIntroPending=false;
    _rtSide='right';_rtApplySide();
    _rtPlayIntro();
  }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _ruIsland, _setRtIntroPending, ruReset, ruResetIfIdle, updateRestFloat };
