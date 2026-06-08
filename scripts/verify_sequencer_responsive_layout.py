#!/usr/bin/env python3
"""Verify Sequencer responsive layout behavior in a real browser.

This regression test launches headless Chromium via the Chrome DevTools Protocol,
sets mobile/tablet/desktop viewports, loads a static Sequencer DOM fixture with
the production CSS inlined, and checks computed layout metrics.
"""

import asyncio
import json
import os
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

import websockets

REPO = Path(__file__).resolve().parents[1]
STYLE_CSS = REPO / "app/static/css/style.css"
CHROME = os.environ.get(
    "CHROME_BIN",
    "/home/lior/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome",
)
PORT = int(os.environ.get("CDP_PORT", "9231"))
TEST_URL = None

VIEWPORTS = [
    {"name": "desktop", "width": 1280, "height": 1000, "expect_single_column": False},
    {"name": "tablet", "width": 768, "height": 1000, "expect_single_column": True},
    {"name": "mobile", "width": 390, "height": 900, "expect_single_column": True},
]


def build_fixture() -> str:
    css = STYLE_CSS.read_text()
    bars = "".join(f'<div class="bar-marker" style="width:150px">Bar {i}</div>' for i in range(1, 9))
    timeline_bars = "".join('<div class="timeline-bar" style="width:150px"></div>' for _ in range(8))
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sequencer responsive layout fixture</title>
<style>{css}</style>
<style>
  body {{ padding: 20px; }}
  .responsive-test-shell {{ max-width: 1280px; margin: 0 auto; }}
  .tab-content {{ display: block; }}
</style>
</head>
<body>
<div class="responsive-test-shell">
  <section class="sequencer-container" id="sequencerContainer">
    <div class="sequencer-header">
      <h2>🎼 Sequencer</h2>
      <div class="sequencer-controls">
        <button class="sequencer-btn">▶️ Play</button>
        <button class="sequencer-btn">⏸️ Pause</button>
        <button class="sequencer-btn">⏹️ Stop</button>
        <button class="sequencer-btn">🔁 Loop</button>
        <button class="sequencer-btn">⏺️ Record</button>
        <button class="sequencer-btn">➕ Add Bar</button>
        <button class="sequencer-btn">➖ Remove Bar</button>
        <label class="bpm-control">BPM: <input type="number" value="120"></label>
        <button class="sequencer-btn">🎵 Auto-Stretch</button>
        <label class="cache-status">Cache: <span>0 MB</span> / 200 MB</label>
        <button class="sequencer-btn">🗑️ Clear Cache</button>
        <button class="sequencer-btn">💾 Save</button>
        <button class="sequencer-btn">📂 Load</button>
        <button class="sequencer-btn">📥 Export</button>
        <button class="sequencer-btn">📤 Import</button>
        <label class="zoom-control">Zoom:<input type="range" value="100"><span>100%</span></label>
        <button class="sequencer-btn">🎛️ Effects Panel</button>
        <button class="sequencer-btn">⛶ Fullscreen</button>
      </div>
    </div>
    <div class="sequencer-workspace">
      <aside class="clips-panel">
        <h3>Available Clips</h3>
        <div class="clips-list">
          <div class="clip-item"><span class="clip-name">QA Drums Loop</span><span class="clip-duration">0:03</span></div>
          <div class="clip-item"><span class="clip-name">QA Lead Hook</span><span class="clip-duration">0:02</span></div>
        </div>
      </aside>
      <main class="sequencer-timeline-container">
        <div class="timeline-header"><div class="timeline-ruler">{bars}</div></div>
        <div class="sequencer-tracks">
          <div class="sequencer-track">
            <div class="track-header">
              <span class="track-name">Restored Track A — drums</span>
              <div class="track-controls">
                <div class="track-volume-control"><label>Vol</label><input class="track-volume-slider" type="range" value="80"><span class="track-volume-value">80%</span></div>
                <button class="track-control-btn">🔇 Mute</button>
                <button class="track-control-btn">🎯 Solo</button>
                <button class="track-control-btn">🗑️ Delete</button>
              </div>
            </div>
            <div class="track-timeline" style="width:1200px">{timeline_bars}<div class="timeline-clip" style="left:0;width:430px"><div class="timeline-clip-content">QA Drums Loop</div></div><div class="timeline-clip" style="left:450px;width:360px"><div class="timeline-clip-content">QA Drums Loop</div></div></div>
          </div>
          <div class="sequencer-track">
            <div class="track-header">
              <span class="track-name">Restored Track B — lead</span>
              <div class="track-controls">
                <div class="track-volume-control"><label>Vol</label><input class="track-volume-slider" type="range" value="80"><span class="track-volume-value">80%</span></div>
                <button class="track-control-btn">🔇 Mute</button>
                <button class="track-control-btn">🎯 Solo</button>
                <button class="track-control-btn">🗑️ Delete</button>
              </div>
            </div>
            <div class="track-timeline" style="width:1200px">{timeline_bars}<div class="timeline-clip" style="left:225px;width:300px"><div class="timeline-clip-content">QA Lead Hook</div></div></div>
          </div>
        </div>
      </main>
    </div>
  </section>
</div>
</body>
</html>"""


def wait_for_cdp(timeout=10):
    deadline = time.time() + timeout
    last_error = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/version", timeout=0.5) as response:
                return json.load(response)
        except Exception as exc:
            last_error = exc
            time.sleep(0.1)
    raise RuntimeError(f"Chrome DevTools endpoint did not become ready: {last_error}")


async def run_case(ws_url, case):
    next_id = 0
    async with websockets.connect(ws_url, max_size=8 * 1024 * 1024) as ws:
        async def send(method, params=None):
            nonlocal next_id
            next_id += 1
            msg_id = next_id
            await ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
            while True:
                message = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))
                if message.get("id") == msg_id:
                    if "error" in message:
                        raise RuntimeError(f"CDP {method} failed: {message['error']}")
                    return message.get("result", {})

        await send("Page.enable")
        await send("Runtime.enable")
        await send("Emulation.setDeviceMetricsOverride", {
            "width": case["width"],
            "height": case["height"],
            "deviceScaleFactor": 1,
            "mobile": case["width"] <= 480,
        })
        await send("Page.navigate", {"url": TEST_URL})
        await asyncio.sleep(0.5)

        result = await send("Runtime.evaluate", {
            "returnByValue": True,
            "expression": r"""
(() => {
  const workspace = document.querySelector('.sequencer-workspace');
  const clipsPanel = document.querySelector('.clips-panel');
  const timeline = document.querySelector('.sequencer-timeline-container');
  const header = document.querySelector('.sequencer-header');
  const controls = document.querySelector('.sequencer-controls');
  const trackHeader = document.querySelector('.sequencer-track .track-header');
  const trackControls = document.querySelector('.sequencer-track .track-controls');
  const clips = document.querySelectorAll('.timeline-clip');
  const style = getComputedStyle(workspace);
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  return {
    clipCount: clips.length,
    workspaceColumns: style.gridTemplateColumns,
    workspace: rect(workspace),
    clipsPanel: rect(clipsPanel),
    timeline: rect(timeline),
    header: rect(header),
    controls: rect(controls),
    trackHeader: rect(trackHeader),
    trackControls: rect(trackControls),
    bodyScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.documentElement.clientWidth
  };
})()
""",
        })
        state = result["result"].get("value")

        failures = []
        if state["clipCount"] < 3:
            failures.append(f"expected demo clips in timeline, got {state['clipCount']}")

        single_column = " " not in state["workspaceColumns"].strip()
        if case["expect_single_column"] and not single_column:
            failures.append(f"expected single-column Sequencer workspace, got gridTemplateColumns={state['workspaceColumns']!r}")
        if not case["expect_single_column"] and single_column:
            failures.append(f"expected multi-column desktop workspace, got {state['workspaceColumns']!r}")

        if case["expect_single_column"] and not (state["timeline"]["top"] >= state["clipsPanel"]["bottom"] - 2):
            failures.append("expected timeline to stack below clips panel")

        for key in ["header", "controls", "trackHeader", "trackControls"]:
            if state[key]["right"] > state["bodyClientWidth"] + 1:
                failures.append(f"{key} overflows viewport: right={state[key]['right']:.1f}, viewport={state['bodyClientWidth']}")

        if state["bodyScrollWidth"] > state["bodyClientWidth"] + 1:
            failures.append(f"page has horizontal overflow: scrollWidth={state['bodyScrollWidth']}, clientWidth={state['bodyClientWidth']}")

        if failures:
            raise AssertionError(f"{case['name']} ({case['width']}px): " + "; ".join(failures))

        return {"name": case["name"], "width": case["width"], "columns": state["workspaceColumns"], "clipCount": state["clipCount"]}


async def main():
    global TEST_URL
    if not os.path.exists(CHROME):
        raise SystemExit(f"Chrome binary not found: {CHROME}")

    profile_dir = tempfile.mkdtemp(prefix="bj-responsive-chrome-")
    fixture = Path(profile_dir) / "sequencer-responsive-fixture.html"
    fixture.write_text(build_fixture())
    TEST_URL = "file://" + urllib.parse.quote(str(fixture))

    proc = subprocess.Popen([
        CHROME,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={profile_dir}",
        "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        version = wait_for_cdp()
        request = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new", method="PUT")
        with urllib.request.urlopen(request, timeout=5) as response:
            target = json.load(response)
        ws_url = target.get("webSocketDebuggerUrl") or version["webSocketDebuggerUrl"]

        results = []
        for case in VIEWPORTS:
            results.append(await run_case(ws_url, case))

        for result in results:
            print(f"PASS {result['name']} {result['width']}px columns={result['columns']} clips={result['clipCount']}")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    asyncio.run(main())
