"""Today's Run recorder as WebKit draws it, for the look's reference (tests/measure/native-run-recorder_look.md):
today's template (frontends/app/src/app/screens/run-recorder/run-recorder.ts) typed out for four states, inside
today's built page (dist-github-pages/index.html) and under week-view.css, by day and by night. A run's start is
printed by the page itself (toLocaleString in WebKit), as today's screen prints it.

usage: python3 tests/measure/native-run-recorder_reference.py <an empty folder>
then:  python3 -m http.server 8791   in that folder, and
       xcrun simctl openurl booted http://localhost:8791/finished-night.html
Read only on this checkout: it writes eight html files into the folder it is given and nothing else."""
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = sys.argv[1]
page = open(os.path.join(ROOT, 'dist-github-pages', 'index.html')).read()
week_css = open(os.path.join(ROOT, 'frontends', 'app', 'src', 'app', 'screens', 'week-view', 'week-view.css')).read()

NUM = 'font-family:var(--font-display);font-size:%dpx;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums'


def figure(label, value, size):
    return ('<div class="look-row" style="flex:1;border-top:none;padding-top:0;margin-top:0"><div class="look-lbl">%s</div>'
            '<div style="%s">%s</div></div>') % (label, NUM % size, value)


def screen(over, title, gps, time, big, small, buttons, nophone, message, splits, past):
    h = ['<div class="overlay open" role="dialog" style="z-index:320">',
         '<div class="detail-header"><button class="back-btn">‹ Back</button><div>',
         '<div class="detail-day-name">%s</div><div class="detail-day-title">%s</div></div></div>' % (over, title),
         '<div class="detail-body">',
         '<div class="look-note" aria-live="polite">%s</div>' % gps,
         '<div style="font-family:var(--font-display);font-size:56px;font-weight:700;letter-spacing:0;line-height:1;color:var(--text);font-variant-numeric:tabular-nums">%s</div>' % time,
         '<div style="display:flex;gap:8px">' + ''.join(figure(l, v, 24) for l, v in zip(['Miles', 'Avg pace', 'This mile'], big)) + '</div>',
         '<div style="display:flex;gap:8px">' + ''.join(figure(l, v, 18) for l, v in zip(['Climb', 'Cadence', 'Steps'], small)) + '</div>',
         '<div class="look-seg">' + ''.join('<button class="look-opt" style="padding:14px;font-size:15px">%s</button>' % b for b in buttons) + '</div>']
    if nophone:
        h.append('<button type="button" class="rec-nophone">Ran without the phone?</button>')
    if message:
        h.append('<div class="look-note" aria-live="polite">%s</div>' % message)
    if splits:
        h.append('<div class="look-row"><div class="look-lbl">Splits</div>' + ''.join(
            '<div style="display:flex;justify-content:space-between;font-size:14px;color:var(--text);font-variant-numeric:tabular-nums"><span>Mile %d</span><span>%s</span></div>' % (n + 1, s)
            for n, s in enumerate(splits)) + '</div>')
    if past:
        h.append('<div class="look-row"><div class="look-lbl">Past runs</div>' + ''.join(
            '<button class="look-opt" style="text-align:left">%s</button>' % r for r in past) + '</div>')
    h.append('</div></div>')
    return ''.join(h)


BENCH = ('Test GPS against your watch. Runs stay on this phone.', 'Run recorder')
LABEL = "<script>document.write(new Date(%d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))</script>"
PAST = [LABEL % 1795887354066 + ' · 0.25 mi · 1:52', LABEL % 1795801065000 + ' · 2.24 mi · 15:00']
STATES = {
    'empty': screen(*BENCH, 'GPS ±5 m', '0:00', ['0.00', '—', '—'], ['—', '—', '—'], ['Start'], False, '', [], PAST),
    'recording': screen(*BENCH, 'GPS ±5 m', '12:34', ['1.49', '8:26', '8:10'], ['33 ft', '150 spm', '1,500'], ['Pause', 'Finish'], False, '', ['8:31'], PAST),
    'finished': screen(LABEL % 1795801065000, 'Run recorder', 'GPS ±10 m', '15:00', ['2.24', '6:42', '6:42'], ['10 ft', '150 spm', '2,250'], ['Share', 'Delete'], False,
                       'That run could not be shared.', ['6:42&nbsp;&nbsp;+10 ft', '6:42&nbsp;&nbsp;−7 ft'], PAST),
    'card': screen('Today · Saturday', 'Long Run', 'Waiting for GPS.', '0:00', ['0.00', '—', '—'], ['—', '—', '—'], ['Start'], True, '', [], []),
}
for name, html in STATES.items():
    for theme in ['day', 'night']:
        out = page.replace('</head>', '<style>' + week_css + '</style></head>', 1)
        assert '</body>' in out
        out = out.replace('</body>', html + '<script>document.documentElement.setAttribute("data-theme","%s")</script></body>' % theme, 1)
        open(os.path.join(OUT, '%s-%s.html' % (name, theme)), 'w').write(out)
print(sorted(os.listdir(OUT)))
