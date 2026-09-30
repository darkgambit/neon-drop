#!/usr/bin/env python3
"""
check-portal-assets.py — assert the portal image slots are actually satisfiable.

WHY THIS EXISTS
---------------
GameDistribution's upload form does not just want the right DIMENSIONS, it wants
the right FORMAT: every slot advertises ".jpg or .jpeg". The first pass at these
assets produced PNGs, which the file picker would have refused — a failure that
only shows up at the moment of upload, in front of a form, with no error message
worth reading.

So the slots are asserted here instead:

    512x384  required (main thumbnail)
    512x512  required (main thumbnail)
    200x120  required (main thumbnail)
    1280x720 helpful for marketing
    1280x550 helpful for marketing

The 1280x550 banner is the easy one to miss: it is 2.33:1 against a 1.79:1 source, so it needs a
HEIGHT crop, and a centred crop slices the "NEON DROP" wordmark in half. It is generated with an
upward bias (fy=0.17) for that reason.

Run from the repo root:
    python tools/check-portal-assets.py

Exits non-zero if any slot is missing, mis-sized or in the wrong container.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "dist" / "art"

# (basename, width, height, what the form calls it)
SLOTS = [
    ("512x384-gd",        512,  384, "required (main thumbnail)"),
    ("512x512-square",    512,  512, "required (main thumbnail)"),
    ("200x120-gd",        200,  120, "required (main thumbnail)"),
    ("1280x720-16x9",    1280,  720, "helpful for marketing"),
    ("1280x550-banner",  1280,  550, "helpful for marketing"),
]

# GameDistribution accepts .jpg/.jpeg. PNG is kept alongside for other portals.
FORMATS = [("jpg", "JPEG"), ("png", "PNG")]


def main() -> int:
    if not ART.exists():
        print(f"missing {ART.relative_to(ROOT)} — run tools/make-portal-thumbs.py first")
        return 1

    failures = []
    print(f"{'slot':<10} {'file':<26} {'actual':<12} {'format':<6} {'size':>9}  verdict")
    print("-" * 80)

    for base, w, h, label in SLOTS:
        for ext, expected_fmt in FORMATS:
            path = ART / f"{base}.{ext}"
            if not path.exists():
                print(f"{w}x{h:<6} {path.name:<26} {'MISSING':<12} {'-':<6} {'-':>9}  FAIL")
                failures.append(f"{path.name} is missing ({label})")
                continue

            with Image.open(path) as im:
                dims = (im.width, im.height)
                fmt = im.format

            dim_ok = dims == (w, h)
            fmt_ok = fmt == expected_fmt
            good = dim_ok and fmt_ok
            if not good:
                if not dim_ok:
                    failures.append(f"{path.name}: is {dims[0]}x{dims[1]}, needs {w}x{h}")
                if not fmt_ok:
                    failures.append(f"{path.name}: is {fmt}, needs {expected_fmt}")

            print(f"{w}x{h:<6} {path.name:<26} {dims[0]}x{dims[1]:<7} {fmt:<6} "
                  f"{path.stat().st_size / 1024:>7.1f}K  {'OK' if good else 'FAIL'}")

    print("-" * 80)
    if failures:
        print(f"FAIL — {len(failures)} problem(s):")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("PASS — every upload slot is satisfiable, in the format the form wants.")
    print("GameDistribution: upload the .jpg files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
