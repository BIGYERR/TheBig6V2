#!/usr/bin/env python3
# V195 gate fix: capture the DST child's stderr instead of letting it leak to the parent's.
# On an artifact where wildcardDayFor does not exist (V194) every child dies, and seven raw
# node stack traces were printing over the gate's own output. The trace is evidence, so it is
# folded into the named FAIL detail rather than discarded.
import io, os, sys
SRC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'gates', 'g195_wildcard.js'))
s = io.open(SRC, encoding='utf-8').read(); orig = s
edits = [
 ('stdio',
r"""      out = cp.execFileSync(process.execPath, [__filename, FILE], {
        env: Object.assign({}, process.env, { TZ: tz, G195_TZ_CHILD: tz }),
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000
      });
    } catch (e) { died = (e && e.message) || 'child died'; out = (e && (e.stdout || '')) || ''; }""",
r"""      out = cp.execFileSync(process.execPath, [__filename, FILE], {
        env: Object.assign({}, process.env, { TZ: tz, G195_TZ_CHILD: tz }),
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000,
        stdio: ['ignore', 'pipe', 'pipe']          // capture stderr; do not leak a trace over the gate's output
      });
    } catch (e) { died = String((e && e.stderr) || (e && e.message) || 'child died').trim().split('\n')[0]; out = (e && (e.stdout || '')) || ''; }"""),
]
fail = False
for tag, old, new in edits:
    n = s.count(old)
    print('anchor %-8s count=%d' % (tag, n))
    if n != 1:
        print('ABORT'); fail = True; break
    s = s.replace(old, new, 1)
if fail or s == orig:
    print('NO WRITE'); sys.exit(1)
io.open(SRC, 'w', encoding='utf-8').write(s)
print('WROTE %s' % SRC)
