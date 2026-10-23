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
// - iaLinkStatus() and iaLinkSummary() say which backend the app is talking to and how that is going, for the
//   app's debug section and the bug report: the URL, the kind the server declared (heroku, docker, mac-local,
//   local), its name, version and commit, the last good beat, the last error, and the round trip.

var IA_BACKEND_URL = window.IA_BACKEND_URL || ''; // set to the Heroku URL in the build that ships this
var IA_LINK_UID_KEY = 'ia_device_uid';
var _iaLink = {
  timer: null, rtt: null, every: 15000, busy: false,
  ok: null, beats: 0, fails: 0, lastTryAt: 0, lastOkAt: 0, lastError: '', backend: null,
};

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

// What the URL alone suggests, until the server says what it is.
function iaLinkGuessKind(url) {
  var host;
  try { host = new URL(url).hostname; } catch (e) { return ''; }
  if (/\.herokuapp\.com$/.test(host)) return 'heroku';
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || /\.local$/.test(host)
    || /^(10|192\.168)\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return 'local';
  return '';
}

// Everything known about the link, as plain data.
function iaLinkStatus() {
  var b = _iaLink.backend;
  return {
    enabled: !!IA_BACKEND_URL,
    url: IA_BACKEND_URL,
    connected: _iaLink.ok, // true, false, or null before the first beat
    kind: (b && b.kind) || iaLinkGuessKind(IA_BACKEND_URL),
    kindFrom: b && b.kind ? 'server' : 'url',
    name: (b && b.name) || '',
    serverVersion: (b && b.version) || '',
    serverCommit: (b && b.commit) || '',
    rttMs: _iaLink.rtt,
    beats: _iaLink.beats,
    fails: _iaLink.fails,
    lastTryAt: _iaLink.lastTryAt,
    lastOkAt: _iaLink.lastOkAt,
    lastError: _iaLink.lastError,
    uid: iaLinkUid() || '',
    platform: iaLinkPlatform(),
    appVersion: typeof IA_VERSION !== 'undefined' ? String(IA_VERSION) : '',
  };
}

// One line a person can read, for the debug section and the bug report.
function iaLinkSummary() {
  var s = iaLinkStatus();
  if (!s.enabled) return 'Backend link off (no backend URL in this build)';
  var what = (s.kind ? s.kind + ' backend' : 'backend') + (s.name ? ' "' + s.name + '"' : '')
    + (s.serverVersion ? ' v' + s.serverVersion + (s.serverCommit ? ' (' + s.serverCommit.slice(0, 7) + ')' : '') : '')
    + ' at ' + s.url;
  if (s.connected === true) return 'Connected to ' + what + (s.rttMs != null ? ', ' + s.rttMs + ' ms' : '');
  if (s.connected === false) {
    var ago = s.lastOkAt ? Math.round((Date.now() - s.lastOkAt) / 1000) + ' s ago' : 'never';
    return 'Not connected to ' + what + ' (last good beat ' + ago + (s.lastError ? ', ' + s.lastError : '') + ')';
  }
  return 'Connecting to ' + what;
}

function iaLinkShow(ok) {
  var el = document.getElementById('iaLinkDot');
  if (!el) return;
  el.hidden = !IA_BACKEND_URL;
  el.classList.toggle('on', ok === true);
  el.classList.toggle('off', ok === false);
  var says = ok === true ? 'Connected' : ok === false ? 'Not connected' : 'Connecting';
  el.title = says + (_iaLink.backend && _iaLink.backend.kind ? ' (' + _iaLink.backend.kind + ')' : '');
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
  _iaLink.lastTryAt = Date.now();
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
    if (j.backend && typeof j.backend === 'object') _iaLink.backend = j.backend;
    _iaLink.ok = true;
    _iaLink.beats += 1;
    _iaLink.lastOkAt = Date.now();
    _iaLink.lastError = '';
    iaLinkShow(true);
  } catch (e) {
    _iaLink.rtt = null;
    _iaLink.ok = false;
    _iaLink.fails += 1;
    _iaLink.lastError = e && e.name === 'AbortError' ? 'timed out after 8 s' : String((e && e.message) || e);
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
window.addEventListener('offline', function () { _iaLink.ok = false; _iaLink.lastError = 'device offline'; iaLinkShow(false); });
iaLinkShow(null);
setTimeout(iaLinkBeat, 1500);
