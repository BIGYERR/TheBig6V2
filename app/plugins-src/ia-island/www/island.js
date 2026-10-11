// window.iaIsland: the page's three calls into the rest stopwatch Live Activity (V239 D233 P-ISLAND).
//   run(startEpochMs)  running, counting up from that epoch (ms since 1970)
//   stop(elapsedMs)    stopped at that frozen value
//   end()              no activity
// Fire-and-forget: no callbacks, and any error is swallowed so the stopwatch never breaks on the bridge.
// Native applies the calls in arrival order, so the last one wins.

function send(action, args) {
    try {
        cordova.exec(null, null, 'IAIsland', action, args);
    } catch (e) {
        // ignored: the island is a mirror, never a dependency
    }
}

module.exports = {
    run: function (startEpochMs) {
        send('run', [startEpochMs]);
    },
    stop: function (elapsedMs) {
        send('stop', [elapsedMs]);
    },
    end: function () {
        send('end', []);
    }
};
