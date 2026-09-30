#!/usr/bin/env python3
"""
make-itch-zip.py — build a portal upload bundle for Neon Drop.

Produces a zip containing index.html, game.js and monetize.js FLAT at the zip
root. index.html loads the other two by relative path, so they must sit side by
side — no enclosing folder.

Used for: itch.io, CrazyGames, Poki, Playgama and most of the long tail.

Run from the repo root:
    python tools/make-itch-zip.py                  -> dist/neon-drop-itch.zip
    python tools/make-itch-zip.py --gd-id <ID>     -> also dist/neon-drop-gd.zip

WHY THE GAME ID IS INJECTED AT BUILD TIME, NOT COMMITTED
--------------------------------------------------------
game/monetize.js detects the network from globals, and its GameDistribution
branch loads the GD SDK **only when AD_CONFIG.gdGameId is non-empty**. That
single condition is what keeps the platforms isolated:

    gdGameId empty  -> the GD SDK is never fetched, so `window.gdsdk` never
                       exists, so detect() cannot return 'gamedistribution'.
                       Our own site and the itch.io build stay clean and
                       ad-free, with Adsterra as the only ad system.

    gdGameId set    -> the SDK loads and GD's ads work.

If the ID were committed into the shared source, every build would load GD's
SDK — including our own pages, where it would both slow the page down and
collide with the Adsterra setup. So the ID lives only in the GD artefact, and
the source stays empty. That also keeps the placeholder gate happy.
"""

import argparse
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
DIST = ROOT / "dist"

# Order matters for readability only; all three must be at the zip root.
FILES = ["index.html", "game.js", "monetize.js"]

# The exact source form. Asserted against on build so that a future edit to
# monetize.js cannot silently break the injection (the build fails loudly
# instead of shipping a bundle with no game ID).
GD_EMPTY = "gdGameId: '',"


def _read_sources() -> dict:
    missing = [f for f in FILES if not (GAME / f).exists()]
    if missing:
        raise SystemExit(f"missing game file(s): {', '.join(missing)}")
    return {f: (GAME / f).read_text(encoding="utf-8") for f in FILES}


def _write_zip(out: Path, contents: dict) -> list:
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in FILES:
            # arcname is just the basename -> flat at the zip root
            z.writestr(name, contents[name])

    with zipfile.ZipFile(out) as z:
        bad = z.testzip()
        if bad is not None:
            raise SystemExit(f"zip integrity check failed on {bad}")
        names = z.namelist()

    if set(names) != set(FILES):
        raise SystemExit("unexpected zip contents")

    print(f"written : {out.relative_to(ROOT)}  {out.stat().st_size / 1024:.1f} KB")
    for info in zipfile.ZipFile(out).infolist():
        print(f"  {info.filename:<16} {info.file_size / 1024:>8.1f} KB uncompressed")
    return names


def build_itch(sources: dict) -> None:
    out = DIST / "neon-drop-itch.zip"
    _write_zip(out, sources)

    # The itch build must NOT carry a game ID: itch.io has no GD SDK, and a
    # non-empty ID would make the game fetch and use one there.
    if "gdGameId: ''" not in sources["monetize.js"]:
        raise SystemExit(
            "refusing to ship the itch bundle: monetize.js has a non-empty "
            "gdGameId. The itch build must stay on the neutral fallback."
        )
    print("  gdGameId: empty -> itch build stays network-neutral. OK")


def build_gd(sources: dict, game_id: str) -> None:
    game_id = game_id.strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{8,64}", game_id):
        raise SystemExit(
            f"that does not look like a GameDistribution game id: {game_id!r}\n"
            "expected 8-64 chars of [A-Za-z0-9_-], e.g. 49258a0e497c42b5b5d87887f24d27a6"
        )

    js = sources["monetize.js"]
    if GD_EMPTY not in js:
        raise SystemExit(
            f"could not find the injection point in monetize.js.\n"
            f"expected exactly: {GD_EMPTY!r}\n"
            "If monetize.js changed, update GD_EMPTY in this script — do not "
            "guess, or the bundle ships with no game id and GD denies it."
        )

    gd = dict(sources)
    gd["monetize.js"] = js.replace(GD_EMPTY, f"gdGameId: '{game_id}',", 1)

    out = DIST / "neon-drop-gd.zip"
    _write_zip(out, gd)

    # Read the ID back OUT of the written artefact. Checking the string we just
    # built is not the same as checking what actually landed in the zip.
    with zipfile.ZipFile(out) as z:
        landed = z.read("monetize.js").decode("utf-8")
    if f"gdGameId: '{game_id}'," not in landed:
        raise SystemExit("the game id did not survive into the zip — aborting")
    if "gdGameId: ''," in landed:
        raise SystemExit("the empty placeholder is still present — aborting")
    print(f"  gdGameId: '{game_id}' verified INSIDE the zip. OK")
    print("  the GD SDK will load on this build only.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--gd-id",
        metavar="GAME_ID",
        help="also build dist/neon-drop-gd.zip with this GameDistribution game id",
    )
    args = ap.parse_args()

    sources = _read_sources()
    build_itch(sources)
    if args.gd_id:
        build_gd(sources, args.gd_id)
    else:
        print("\n(no --gd-id given: GameDistribution bundle not built)")
    print("\nindex.html is at the zip root. OK")


if __name__ == "__main__":
    main()
