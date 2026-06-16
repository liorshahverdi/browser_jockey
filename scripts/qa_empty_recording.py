import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/home/lior/projects/browser_jockey/dogfood-output/current-branch-qa'); SS=OUT/'screenshots'; SS.mkdir(parents=True, exist_ok=True)
async def main():
  events=[]
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True)
    c=await b.new_context(viewport={'width':1280,'height':900}, accept_downloads=True)
    page=await c.new_page()
    page.on('dialog', lambda d: asyncio.create_task(d.dismiss()))
    cons=[]; page.on('console', lambda m: cons.append({'type':m.type,'text':m.text,'loc':m.location}))
    await page.goto('http://127.0.0.1:5017/', wait_until='networkidle')
    cons.clear()
    await page.click('button[data-tab="sequencer"]')
    await page.wait_for_timeout(500)
    await page.click('#sequencerRecordBtn')
    await page.wait_for_timeout(2500)
    state=await page.evaluate("""() => ({recordingSection:getComputedStyle(document.getElementById('sequencerRecordingSection')).display, time:document.getElementById('sequencerRecordingTime')?.textContent, recordBtnText:document.getElementById('sequencerRecordBtn')?.innerText, clips:window.sequencer?.tracks?.reduce((n,t)=>n+(t.clips?.length||0),0), isRecording:window.sequencer?.isRecording})""")
    path=str(SS/'10-empty-sequencer-recording.png'); await page.screenshot(path=path, full_page=True)
    await b.close()
    print(json.dumps({'state':state,'console':cons,'screenshot':path}, indent=2))
asyncio.run(main())
