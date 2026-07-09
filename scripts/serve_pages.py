#!/usr/bin/env python3
"""Serve the built site under /browser_jockey/ to match GitHub Pages."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE_ROOT = ROOT / ".ci-site"
PROJECT_ROOT = SITE_ROOT / "browser_jockey"

subprocess.run([sys.executable, str(ROOT / "scripts" / "build_static.py")], check=True)
if SITE_ROOT.exists():
    shutil.rmtree(SITE_ROOT)
PROJECT_ROOT.parent.mkdir(parents=True)
shutil.copytree(ROOT / "dist", PROJECT_ROOT)

handler = partial(SimpleHTTPRequestHandler, directory=SITE_ROOT)
server = ThreadingHTTPServer(("127.0.0.1", 4173), handler)
print("Serving http://127.0.0.1:4173/browser_jockey/", flush=True)
server.serve_forever()
