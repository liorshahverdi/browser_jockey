#!/usr/bin/env python3
"""Build the minimal GitHub Pages artifact into dist/."""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def main():
    if DIST.exists():
        shutil.rmtree(DIST)

    (DIST / "app" / "static").mkdir(parents=True)
    shutil.copy2(ROOT / "index.html", DIST / "index.html")
    shutil.copytree(ROOT / "app" / "static" / "css", DIST / "app" / "static" / "css")
    shutil.copytree(ROOT / "app" / "static" / "js", DIST / "app" / "static" / "js")

    print(f"Built GitHub Pages artifact: {DIST}")


if __name__ == "__main__":
    main()
