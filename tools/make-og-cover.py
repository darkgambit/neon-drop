#!/usr/bin/env python3
"""
make-og-cover.py — build the social preview image (og:image) for Neon Drop.

Takes cover.png (the 1376x768 source art), centre-crops it to the 1200x630
aspect that Facebook / X / LinkedIn / Discord all expect, and writes a lean
progressive JPEG. cover.png is ~1.7 MB; this lands around 100 KB, which is what
you actually want on the critical path of a social unfurl.

Run from the repo root:
    python tools/make-og-cover.py

Requires: Pillow  (pip install Pillow)
"""

from pathlib import Path

from PIL import Image

TARGET_W, TARGET_H = 1200, 630
QUALITY = 86

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "cover.png"
DST = ROOT / "og-cover.jpg"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing source art: {SRC}")

    src = Image.open(SRC).convert("RGB")
    w, h = src.size

    want = TARGET_W / TARGET_H
    if w / h > want:  # too wide -> trim the sides
        new_w = int(round(h * want))
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:  # too tall -> trim top and bottom
        new_h = int(round(w / want))
        top = (h - new_h) // 2
        box = (0, top, w, top + new_h)

    out = src.crop(box).resize((TARGET_W, TARGET_H), Image.LANCZOS)
    out.save(DST, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    print(f"source      : {SRC.name} {src.size}")
    print(f"crop box    : {box}")
    print(f"written     : {DST.name} {out.size}  {DST.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
