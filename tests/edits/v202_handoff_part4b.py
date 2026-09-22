#!/usr/bin/env python3
# V202 handoff part 4b — correction to part 4, documentation only.
# Part 4's bullet quoted :1260's headline verbatim, which ADDED a sixth literal
# instance of "never persisted" to the file. The record must not read as a new
# instance of the refuted invariant, so the quote becomes a description.
# Count returns to 5 (the four cited lines plus one pre-existing prose use).
import sys, io

PATH = "/Users/CanasBangin/Desktop/TheBig6V2/IRON_ASYLUM_HANDOFF_1_1.md"

with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()

OLD = ("`:1260` is an open item whose headline claims `prog.weeks` is “still never "
       "persisted, so drift is unbounded” and whose recommended remedy")
NEW = ("`:1260` is an open item whose headline still asserts the non-persistence of "
       "`prog.weeks` and calls the resulting drift unbounded, and whose recommended remedy")

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

print("OK: anchor count 1, quote de-literalised")
