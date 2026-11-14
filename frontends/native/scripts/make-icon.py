#!/usr/bin/env python3
"""The beta app's icon: today's icon (the repo root's apple-touch-icon.png) with an orange band reading NEXT, so the
two apps are told apart on the home screen. Run once, and again when today's icon changes:

    python3 frontends/native/scripts/make-icon.py

It needs Pillow and macOS's Arial Black. It writes frontends/native/assets/icon.png, 1024 square with no alpha, which
app.config.js names and tests/unit/native-shell.test.ts holds. Nothing in a build runs this file.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

NATIVE = Path(__file__).resolve().parent.parent
SOURCE = NATIVE.parent.parent / 'apple-touch-icon.png'
OUT = NATIVE / 'assets' / 'icon.png'
ORANGE = (207, 78, 26)   # the design system's signal orange, #CF4E1A
PAPER = (243, 243, 241)  # its paper, #F3F3F1
BAND_TOP = 780           # of 1024: the band is the icon's bottom quarter
WORD = 'NEXT'

icon = Image.open(SOURCE).convert('RGB')
assert icon.size == (1024, 1024), icon.size
draw = ImageDraw.Draw(icon)
draw.rectangle([0, BAND_TOP, 1024, 1024], fill=ORANGE)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Black.ttf', 150)
# Letters set apart by hand, then the word centred in the band. The home screen's mask rounds the band's corners.
gap = 22
widths = [draw.textlength(ch, font=font) for ch in WORD]
x = (1024 - (sum(widths) + gap * (len(WORD) - 1))) / 2
top, bottom = font.getbbox(WORD)[1], font.getbbox(WORD)[3]
y = BAND_TOP + (1024 - BAND_TOP - (bottom - top)) / 2 - top - 8
for ch, w in zip(WORD, widths):
    draw.text((x, y), ch, font=font, fill=PAPER)
    x += w + gap
OUT.parent.mkdir(exist_ok=True)
icon.save(OUT, optimize=True)
print(OUT, icon.size, icon.mode, OUT.stat().st_size, 'bytes')
