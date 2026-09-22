#!/usr/bin/env python3
# V202 handoff part 4c — second and last correction to part 4, documentation only.
# The 259/555 clause also carried the literal phrase "never persisted". Same reason
# as 4b: the record describes the refuted invariant, it does not restate it.
# grep -c 'never persisted' returns to its pre-part-4 count of 5.
import sys, io

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"

with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

OLD = "`:259` and `:555` assert that `refreshProgram`'s output is never persisted, and they do it"
NEW = "`:259` and `:555` assert the non-persistence of `refreshProgram`'s output, and they do it"

n = src.count(OLD)
if n != 1:
    sys.stderr.write("ABORT: anchor count == %d, expected 1\n" % n)
    sys.exit(1)

out = src.replace(OLD, NEW, 1)
if out == src:
    sys.stderr.write("ABORT: replacement was a no-op\n")
    sys.exit(1)

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(out)

print("OK: anchor count 1, 259/555 clause de-literalised")
