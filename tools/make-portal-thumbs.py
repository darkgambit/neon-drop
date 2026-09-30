#!/usr/bin/env python3
"""
make-portal-thumbs.py — generate every portal thumbnail size from cover.png.

WHY THIS EXISTS
---------------
GameDistribution's developer guidelines require THREE thumbnail sizes:

    512x512, 512x384 and 200x120

The original recipe lived as a throwaway one-liner in PORTAL_SUBMISSION_KIT.md
and hardcoded x=0 for every crop. cover.png is centred artwork, so x=0 sliced
the frame from the left edge and cut the right-hand tile cluster off — the
thumbnails would have looked off-centre next to every other game on the portal.

This script crops from the CENTRE (and lets you bias vertically when a size is
much shorter than the art), so the title and board stay in frame at every
aspect ratio.

Run from the repo root (needs Pillow):
    python tools/make-portal-thumbs.py

dist/ is gitignored — these are build artefacts, not source.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "cover.png"
OUT = ROOT / "dist" / "art"

# (filename, width, height, vertical_focus)
# vertical_focus: 0.0 = top of the crop window, 0.5 = centred, 1.0 = bottom.
# It only matters when the target is TALLER-relative-to-wide than the source,
# i.e. when we have to crop height. The 1:1 icon leans slightly above centre so
# the "NEON DROP" wordmark survives; the wide banners are pure centre crops.
SIZES = [
    ("512x512-square.png",       512,  512, 0.40),
    ("512x384-gd.png",           512,  384, 0.50),
    ("200x120-gd.png",           200,  120, 0.50),
    ("800x450-crazygames.png",   800,  450, 0.50),
    ("1280x720-16x9.png",       1280,  720, 0.50),
    ("1920x1080-16x9.png",      1920, 1080, 0.50),
    ("630x500-itch-cover.png",   630,  500, 0.50),
]


def cover_crop(img: Image.Image, tw: int, th: int, fy: float) -> Image.Image:
    """Scale-and-centre-crop to exactly (tw, th) without distorting the art."""
    target_ar = tw / th
    src_ar = img.width / img.height

    if src_ar > target_ar:
        # Source is wider than the target: crop the sides, keep full height.
        nh = img.height
        nw = round(img.height * target_ar)
        x = (img.width - nw) // 2
        y = 0
    else:
        # Source is narrower/taller than the target: crop top/bottom.
        nw = img.width
        nh = round(img.width / target_ar)
        x = 0
        y = int((img.height - nh) * fy)

    return img.crop((x, y, x + nw, y + nh)).resize((tw, th), Image.LANCZOS)


def main() -> None:
    if not SRC.exists():
        sys.exit(f"missing source art: {SRC}")

    src = Image.open(SRC).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)

    print(f"source : {SRC.name}  {src.width}x{src.height}")
    print(f"output : {OUT.relative_to(ROOT)}\n")

    for name, tw, th, fy in SIZES:
        out = OUT / name
        cover_crop(src, tw, th, fy).save(out, "PNG", optimize=True)
        print(f"  {name:<26} {tw}x{th}  {out.stat().st_size / 1024:>8.1f} KB")

    print("\nall sizes written.")


if __name__ == "__main__":
    main()
