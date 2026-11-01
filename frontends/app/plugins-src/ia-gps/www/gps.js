// window.iaGps: the Run recorder's calls into the GPS recorder (D267 P-GPSTEST, docs/decisions/gps-recording.md).
//   listen(onEvent)          the one event channel: {type:'auth', status}, {type:'fix', fix, recorded},
//                            {type:'mark', line}, {type:'error', message}
//   warm() / cool()          location on before Start, off again
//   start() pause() resume() the run's marks; Start waits for permission when it is not yet given
//   finish(done)             done(id) once the file is closed
//   status(done)             done({recording, paused, id})
//   list(done)               done([{id, bytes}]), newest first
//   read(id, done, fail)     done(text), the run's raw lines
//   remove(id, done, fail)   deletes a run that is not recording
// Native writes every fix to the run's file itself; the events only draw the screen, and the page reads the file back
// whenever it returns from the background.

function call(action, args, done, fail) {
    try {
        cordova.exec(done || null, fail || null, 'IAGps', action, args || []);
    } catch (e) {
        if (fail) fail(String(e));
    }
}

module.exports = {
    listen: function (onEvent) {
        call('listen', [], onEvent);
    },
    warm: function () {
        call('warm');
    },
    cool: function () {
        call('cool');
    },
    start: function () {
        call('start');
    },
    pause: function () {
        call('pause');
    },
    resume: function () {
        call('resume');
    },
    finish: function (done, fail) {
        call('finish', [], done, fail);
    },
    status: function (done, fail) {
        call('status', [], done, fail);
    },
    list: function (done, fail) {
        call('list', [], done, fail);
    },
    read: function (id, done, fail) {
        call('read', [id], done, fail);
    },
    remove: function (id, done, fail) {
        call('remove', [id], done, fail);
    }
};
