// ── BACKEND LINK ────────────────────────────────────────────────────────────────
// The app's side of the backend connection: a heartbeat with a device UID, and the small dot that says
// whether the last beat reached the server. Written to be pasted into index.html's one inline script in a
// version build (see backend/README.md, "The app side"); until then it runs on /client/demo.html.
//
// - One POST /api/heartbeat when the app opens and every nextBeatMs (15 s) while it is visible. Nothing while hidden.
// - The body is JSON sent as text/plain, so the browser skips the CORS preflight and the timing is one round trip.
// - Each beat reports the round trip the previous beat measured; the server keeps the samples per device.
// - The server issues the UID on the first beat; it is kept in localStorage under ia_device_uid.
// - Hidden or closed: navigator.sendBeacon says goodbye, so the admin shows the device as gone at once.
// - IA_BACKEND_URL empty: nothing runs and the dot stays hidden.

var IA_BACKEND_URL = window.IA_BACKEND_URL || ''; // set to the Heroku URL in the build that ships this
var IA_LINK_UID_KEY = 'ia_device_uid';
var _iaLink = { timer: null, rtt: null, every: 15000, busy: false };

function iaLinkUid() {
  try { return localStorage.getItem(IA_LINK_UID_KEY); } catch (e) { return null; }
}

// A short, human label for the admin table. Safari never exposes the phone's own name, so this is the best
// a web page can say: kind of device, and how the app is running.
function iaLinkLabel() {
  var ua = navigator.userAgent || '';
  var kind = /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Macintosh/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : 'Browser';
  var os = (ua.match(/OS (\d+)[_.](\d+)/) || []).slice(1, 3).join('.');
  return kind + (os && (kind === 'iPhone' || kind === 'iPad') ? ' · iOS ' + os : '');
}

function iaLinkPlatform() {
  if (window.cordova) return 'ios-app';
  if (navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)) return 'home-screen';
  return 'browser';
}

function iaLinkShow(ok) {
  var el = document.getElementById('iaLinkDot');
  if (!el) return;
  el.hidden = !IA_BACKEND_URL;
  el.classList.toggle('on', ok === true);
  el.classList.toggle('off', ok === false);
  var says = ok === true ? 'Connected' : ok === false ? 'Not connected' : 'Connecting';
  el.title = says;
  el.setAttribute('aria-label', says);
}

function iaLinkSchedule() {
  clearTimeout(_iaLink.timer);
  if (document.visibilityState === 'visible') _iaLink.timer = setTimeout(iaLinkBeat, _iaLink.every);
}

async function iaLinkBeat() {
  if (!IA_BACKEND_URL || _iaLink.busy || document.visibilityState === 'hidden') return;
  _iaLink.busy = true;
  var uid = iaLinkUid();
  var body = JSON.stringify({
    uid: uid,
    label: iaLinkLabel(),
    platform: iaLinkPlatform(),
    appVersion: typeof IA_VERSION !== 'undefined' ? String(IA_VERSION) : '',
    screen: screen.width + 'x' + screen.height + '@' + (window.devicePixelRatio || 1),
    rttMs: _iaLink.rtt,
  });
  var ctrl = new AbortController();
  var kill = setTimeout(function () { ctrl.abort(); }, 8000);
  var t0 = performance.now();
  try {
    var r = await fetch(IA_BACKEND_URL + '/api/heartbeat', {
      method: 'POST', body: body, cache: 'no-store', signal: ctrl.signal,
      headers: { 'Content-Type': 'text/plain' },
    });
    // Timed when the response arrives, not after the body is read: a backgrounded or throttled page can take
    // seconds to read a few bytes, and that is not network latency.
    var rtt = Math.round(performance.now() - t0);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var j = await r.json();
    _iaLink.rtt = rtt;
    if (j.uid && j.uid !== uid) { try { localStorage.setItem(IA_LINK_UID_KEY, j.uid); } catch (e) { /* private mode */ } }
    if (j.nextBeatMs) _iaLink.every = Math.min(300000, Math.max(5000, j.nextBeatMs));
    iaLinkShow(true);
  } catch (e) {
    _iaLink.rtt = null;
    iaLinkShow(false); // offline, server down, or asleep. The next beat tries again.
  } finally {
    clearTimeout(kill);
    _iaLink.busy = false;
    iaLinkSchedule();
  }
}

function iaLinkBye() {
  clearTimeout(_iaLink.timer);
  var uid = iaLinkUid();
  if (IA_BACKEND_URL && uid && navigator.sendBeacon) {
    try { navigator.sendBeacon(IA_BACKEND_URL + '/api/bye', JSON.stringify({ uid: uid })); } catch (e) { /* best effort */ }
  }
}

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') iaLinkBeat(); else iaLinkBye();
});
window.addEventListener('pagehide', iaLinkBye);
window.addEventListener('online', iaLinkBeat);
window.addEventListener('offline', function () { iaLinkShow(false); });
iaLinkShow(null);
setTimeout(iaLinkBeat, 1500);
