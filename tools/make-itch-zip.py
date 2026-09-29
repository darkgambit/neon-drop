#!/usr/bin/env python3
"""
make-itch-zip.py — build the portal upload bundle for Neon Drop.

Produces dist/neon-drop-itch.zip containing index.html, game.js and monetize.js
FLAT at the zip root. index.html loads the other two by relative path, so they
must sit side by side — no enclosing folder.

Used for: itch.io, GameDistribution, CrazyGames, Poki, Playgama and most of the
long tail. Re-run it after any change to game/ (for example once a real
GameDistribution Game ID is pasted into monetize.js).

Run from the repo root:
    python tools/make-itch-zip.py
"""

import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
OUT = ROOT / "dist" / "neon-drop-itch.zip"

# Order matters for readability only; all three must be at the zip root.
FILES = ["index.html", "game.js", "monetize.js"]


def main() -> None:
    missing = [f for f in FILES if not (GAME / f).exists()]
    if missing:
        raise SystemExit(f"missing game file(s): {', '.join(missing)}")

    OUT.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in FILES:
            # arcname is just the basename -> flat at the zip root
            z.write(GAME / name, name)

    with zipfile.ZipFile(OUT) as z:
        bad = z.testzip()
        if bad is not None:
            raise SystemExit(f"zip integrity check failed on {bad}")
        names = z.namelist()
        print(f"written : {OUT.relative_to(ROOT)}  {OUT.stat().st_size / 1024:.1f} KB")
        print(f"entries : {len(names)}")
        for info in z.infolist():
            print(f"  {info.filename:<16} {info.file_size / 1024:>8.1f} KB uncompressed")

    if set(names) != set(FILES):
        raise SystemExit("unexpected zip contents")
    print("\nindex.html is at the zip root. OK")


if __name__ == "__main__":
    main()
