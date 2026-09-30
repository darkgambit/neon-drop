#!/usr/bin/env python3
"""
make-portal-thumbs.py — generate every portal thumbnail size from cover.png.

WHY THIS EXISTS
---------------
GameDistribution's upload form has four image slots:

    512x384  required (main thumbnail)      -> .jpg / .jpeg
    512x512  required (main thumbnail)      -> .jpg / .jpeg
    200x120  required (main thumbnail)      -> .jpg / .jpeg
    1280x720 "helpful for marketing"        -> .jpg / .jpeg

The original recipe lived as a throwaway one-liner in PORTAL_SUBMISSION_KIT.md
and hardcoded x=0 for every crop. cover.png is centred artwork, so x=0 sliced
the frame from the left edge and cut the right-hand tile cluster off — the
thumbnails would have looked off-centre next to every other game on the portal.

This script crops from the CENTRE (and lets you bias vertically when a size is
much shorter than the art), so the title and board stay in frame at every
aspect ratio.

WHY BOTH PNG AND JPEG
---------------------
GameDistribution's upload form advertises ".jpg or .jpeg" on every thumbnail slot
(512x384, 512x512, 200x120, plus a 1280x720 marketing image). PNG would have been
refused at the file picker. Other portals ask for PNG. So this emits BOTH formats
for every size and nobody can complain about the container.

JPEG has no alpha channel; cover.png is already opaque RGB, so nothing is lost.

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

# (basename, width, height, vertical_focus)
# vertical_focus: 0.0 = top of the crop window, 0.5 = centred, 1.0 = bottom.
# It only matters when the target is TALLER-relative-to-wide than the source,
# i.e. when we have to crop height. The 1:1 icon leans slightly above centre so
# the "NEON DROP" wordmark survives; the wide banners are pure centre crops.
SIZES = [
    # GameDistribution requires all three of these, in JPG.
    ("512x384-gd",              512,  384, 0.50),
    ("512x512-square",          512,  512, 0.40),
    ("200x120-gd",              200,  120, 0.50),
    # "Helpful for marketing" slots on the same form.
    ("1280x720-16x9",          1280,  720, 0.50),
    ("1280x550-banner",        1280,  550, 0.17),
    # Other portals.
    ("800x450-crazygames",      800,  450, 0.50),
    ("1920x1080-16x9",         1920, 1080, 0.50),
    ("630x500-itch-cover",      630,  500, 0.50),
]

# JPEG quality. 92 keeps the neon gradients clean without ballooning the file;
# these are storefront thumbnails, not print assets.
JPEG_QUALITY = 92


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

    for base, tw, th, fy in SIZES:
        crop = cover_crop(src, tw, th, fy)

        png = OUT / f"{base}.png"
        crop.save(png, "PNG", optimize=True)

        jpg = OUT / f"{base}.jpg"
        crop.save(jpg, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)

        print(f"  {base:<20} {tw}x{th}   "
              f"png {png.stat().st_size / 1024:>7.1f} KB   "
              f"jpg {jpg.stat().st_size / 1024:>7.1f} KB")

    print(f"\n{len(SIZES)} sizes, PNG + JPEG (quality {JPEG_QUALITY}).")
    print("GameDistribution wants the .jpg files.")


if __name__ == "__main__":
    main()
