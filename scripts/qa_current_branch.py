import asyncio, math, struct, wave, os, json, time
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

ROOT = Path('/home/lior/projects/browser_jockey')
OUT = ROOT / 'dogfood-output' / 'current-branch-qa'
SS = OUT / 'screenshots'
SS.mkdir(parents=True, exist_ok=True)
A1 = OUT / 'qa-tone-a.wav'
A2 = OUT / 'qa-tone-b.wav'


def make_wav(path, freq=440, seconds=2.0, rate=44100):
    n = int(seconds * rate)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        frames = bytearray()
        for i in range(n):
            v = int(0.35 * 32767 * math.sin(2 * math.pi * freq * i / rate))
            frames.extend(struct.pack('<h', v))
        w.writeframes(frames)

make_wav(A1, 440); make_wav(A2, 660)

class QA:
    def __init__(self):
        self.events=[]; self.failures=[]; self.console=[]; self.dialogs=[]; self.screens={}
    def log(self, msg):
        print(msg); self.events.append(msg)
    async def shot(self, page, name, full=True):
        p = SS / f'{name}.png'
        await page.screenshot(path=str(p), full_page=full)
        self.screens[name] = str(p)
        self.log(f'screenshot:{name}:{p}')
        return str(p)
    def add_failure(self, key, title, severity, category, url, description, steps, expected, actual, screenshot=None, console=None):
        self.failures.append(dict(key=key,title=title,severity=severity,category=category,url=url,description=description,steps=steps,expected=expected,actual=actual,screenshot=screenshot,console=console or []))

async def visible_text(page, sel):
    try:
        return (await page.locator(sel).inner_text(timeout=1500)).strip()
    except Exception:
        return None

async def main():
    qa=QA()
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'])
        context = await browser.new_context(viewport={'width': 1280, 'height': 900}, permissions=['microphone','camera'], accept_downloads=True)
        page = await context.new_page()
        page.on('console', lambda m: qa.console.append({'type':m.type,'text':m.text,'location':m.location}))
        page.on('pageerror', lambda e: qa.console.append({'type':'pageerror','text':str(e),'location':{}}))
        page.on('dialog', lambda d: asyncio.create_task(handle_dialog(d, qa)))
        await page.goto('http://127.0.0.1:5017/', wait_until='networkidle')
        await qa.shot(page, '01-initial-mixer')
        # Baseline visible component counts
        counts = await page.evaluate("""() => ({buttons:document.querySelectorAll('button').length, inputs:document.querySelectorAll('input').length, selects:document.querySelectorAll('select').length, canvases:document.querySelectorAll('canvas').length, visibleButtons:Array.from(document.querySelectorAll('button')).filter(e=>e.offsetParent!==null).length})""")
        qa.log('counts '+json.dumps(counts))
        if qa.console:
            qa.add_failure('initial-console','Console output appears during initial load','Low','Console',page.url,'Initial page load emits console output/messages. Production QA should load cleanly unless messages are intentional diagnostics.',['Open app root','Observe browser console'], 'No console errors or debug noise on initial load.', f'{len(qa.console)} console messages on load', qa.screens['01-initial-mixer'], qa.console.copy())
        qa.console.clear()

        # Upload files to both decks
        await page.set_input_files('#audioFile1', str(A1))
        await page.wait_for_timeout(2500)
        await page.set_input_files('#audioFile2', str(A2))
        await page.wait_for_timeout(3500)
        await qa.shot(page, '02-after-two-track-upload')
        enabled = await page.evaluate("""() => ['playBtn1','playBtn2','playBothBtn','syncTrack1to2Btn','sidechainToggle','exportStem1','exportStem2','hotCue1_0','beatGridToggle1'].reduce((a,id)=>{const e=document.getElementById(id); a[id]=e?{disabled:e.disabled,text:e.innerText||e.value,display:getComputedStyle(e).display}:null; return a;}, {})""")
        qa.log('enabled after upload '+json.dumps(enabled))
        for id_ in ['playBtn1','playBtn2','playBothBtn','exportStem1','exportStem2','hotCue1_0','beatGridToggle1']:
            if not enabled.get(id_) or enabled[id_]['disabled']:
                qa.add_failure(f'{id_}-disabled-after-upload', f'{id_} remains disabled after loading valid WAV audio', 'High', 'Functional', page.url, f'After loading valid short WAV files, {id_} did not become available.', ['Open app','Load valid WAV into Track 1 and Track 2','Inspect enabled controls'], 'Controls tied to loaded audio should become enabled.', f'{id_} state: {enabled.get(id_)}', qa.screens['02-after-two-track-upload'], qa.console.copy())
        if qa.console:
            qa.add_failure('upload-console-errors','Console output/errors occur while loading valid WAV tracks','Medium','Console',page.url,'Loading valid WAV files produced console output/errors.',['Open app','Upload generated WAV files to both decks','Observe console'], 'Valid audio upload should not emit errors.', f'Console messages after upload: {qa.console}', qa.screens['02-after-two-track-upload'], qa.console.copy())
        qa.console.clear()

        # Mixer controls and buttons
        async def set_range(sel, value):
            await page.eval_on_selector(sel, "(el, v)=>{el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));}", str(value))
        await set_range('#volumeSlider1', 55); await set_range('#tempoSlider1', 1.5); await set_range('#stretchSlider1', 1.25)
        await set_range('#lowSlider1', -6); await set_range('#midSlider1', 3); await set_range('#highSlider1', 6); await set_range('#pitchSlider1', 4)
        await set_range('#panSlider1', -75); await set_range('#crossfader', 20)
        await page.select_option('#crossfaderMode', 'track1-mic')
        vals = await page.evaluate("""() => ({vol:volumeValue1.textContent, tempo:tempoValue1.textContent, stretch:stretchValue1.textContent, low:lowValue1.textContent, mid:midValue1.textContent, high:highValue1.textContent, pitch:pitchValue1.textContent, pan:panValue1.textContent, cross:crossfaderValue.textContent, left:crossfaderLabelLeft.textContent, right:crossfaderLabelRight.textContent})""")
        qa.log('mixer vals '+json.dumps(vals))
        expected_fragments={'vol':'55%','tempo':'1.5x','stretch':'1.25x','low':'-6dB','mid':'3dB','high':'6dB','pitch':'4','pan':'Left','cross':'80% / 20%','left':'Track 1','right':'Microphone'}
        mism=[f'{k} expected {v}, saw {vals.get(k)}' for k,v in expected_fragments.items() if v not in str(vals.get(k))]
        if mism:
            qa.add_failure('mixer-value-feedback','Mixer control labels do not all update after user input','Medium','Functional',page.url,'One or more mixer controls accepted input but did not update its visible value label correctly.', ['Load audio','Move volume/tempo/stretch/EQ/pitch/pan/crossfader controls','Read visible value labels'], 'Every changed control should display the new value immediately.', '; '.join(mism), qa.screens['02-after-two-track-upload'], qa.console.copy())
        if qa.console:
            qa.add_failure('mixer-control-console','Console output/errors occur when changing mixer controls','Medium','Console',page.url,'Moving standard mixer sliders/selects produced console output/errors.',['Load tracks','Change mixer sliders and crossfader mode','Observe console'], 'No JS errors during routine mixer control changes.', str(qa.console), qa.screens['02-after-two-track-upload'], qa.console.copy())
        qa.console.clear()

        # Audio control button smoke tests
        for sel in ['#playBtn1','#pauseBtn1','#stopBtn1','#loopBtn1','#reverseLoopBtn1','#clearLoopBtn1','#slipBtn1','#hotCue1_0','#beatGridToggle1','#snapToggle1','#tapTempo1','#nudgeLeft1','#nudgeRight1','#playBtn2','#stopBtn2','#sidechainToggle','#sidechainDirection','#syncTrack1to2Btn','#syncTrack2to1Btn','#autoSyncToggle','#playBothBtn']:
            try:
                if not await page.locator(sel).is_disabled():
                    await page.click(sel, timeout=1500)
                    await page.wait_for_timeout(150)
            except Exception as e:
                qa.add_failure(f'click-failed-{sel}', f'Clicking {sel} failed during smoke test', 'Medium', 'Functional', page.url, f'Control {sel} could not be clicked successfully by the browser.', ['Load tracks','Click the control'], 'Control accepts click or gives graceful feedback.', repr(e), qa.screens['02-after-two-track-upload'], qa.console.copy())
        await qa.shot(page, '03-after-mixer-control-smoke')
        if qa.console:
            qa.add_failure('mixer-button-console','Console output/errors occur during mixer button smoke test','Medium','Console',page.url,'Clicking enabled mixer controls produced console output/errors.',['Load tracks','Click play/pause/stop/loop/hot cue/beat grid/sync/sidechain controls','Observe console'], 'No unhandled JS errors during normal control clicks.', str(qa.console), qa.screens['03-after-mixer-control-smoke'], qa.console.copy())
        qa.console.clear()

        # Microphone / camera / tab-capture buttons should fail gracefully in automation if unsupported
        for sel, name in [('#captureTabAudio1','Track 1 tab capture'),('#captureTabAudio2','Track 2 tab capture'),('#captureTabAudioMic','Mic tab capture'),('#enableMicBtn','Microphone enable'),('#enableThereminBtn','Theremin enable')]:
            try:
                await page.click(sel, timeout=2000)
                await page.wait_for_timeout(1000)
            except Exception as e:
                qa.add_failure(f'{name}-click-exception', f'{name} button click throws/blocks', 'Medium', 'Functional', page.url, f'Clicking {name} raised an automation-level exception.', ['Open app','Click '+name], 'Permission-dependent features should show a prompt, permission request, or graceful error.', repr(e), qa.screens['03-after-mixer-control-smoke'], qa.console.copy())
        await qa.shot(page, '04-after-permission-feature-clicks')
        if qa.console:
            # Filter benign browser permission denials? Keep as issue if includes TypeError/pageerror
            qa.add_failure('permission-feature-console','Permission-dependent feature buttons emit console errors/no graceful UI in headless QA','Medium','Console',page.url,'Tab capture, microphone, and camera feature entry points produced console messages/errors when clicked in a browser environment. User-facing handling should be clear and not leave uncaught errors.', ['Click Capture Tab Audio for tracks/mic','Click Enable Microphone','Click Enable Theremin','Observe UI and console'], 'Unsupported/denied permissions should produce clear in-app feedback without uncaught errors.', str(qa.console), qa.screens['04-after-permission-feature-clicks'], qa.console.copy())
        qa.console.clear()

        # Pattern deck / lofi station smoke
        for sel in ['#patternDeckPlay','#patternDeckStop','#patternDeckSyncT1','#patternDeckSyncT2','#lofiPlay','#lofiStop','#lofiRegenerate','#lofiSyncT1','#lofiSyncT2','#lofiMuteDrums','#lofiMuteChords','#lofiMuteMelody','#lofiMuteAmbient']:
            try:
                await page.click(sel, timeout=2000)
                await page.wait_for_timeout(500)
            except Exception as e:
                qa.add_failure(f'click-failed-{sel}', f'Clicking {sel} failed during instrument smoke test', 'Medium', 'Functional', page.url, f'Control {sel} could not be clicked successfully.', ['Open app','Click instrument/lo-fi control'], 'Control should accept click or provide graceful disabled/error state.', repr(e), qa.screens['04-after-permission-feature-clicks'], qa.console.copy())
        await qa.shot(page, '05-after-pattern-lofi-smoke')
        if qa.console:
            qa.add_failure('pattern-lofi-console','Pattern Deck / Lo-fi Station controls emit console errors during smoke test','Medium','Console',page.url,'Pattern deck and lo-fi station controls produced console output/errors during basic play/stop/regenerate/sync interactions.', ['Open app','Click Pattern Deck play/stop/presets/sync','Click Lo-fi Station play/stop/regenerate/mutes/sync','Observe console'], 'No JS errors during instrument control interactions.', str(qa.console), qa.screens['05-after-pattern-lofi-smoke'], qa.console.copy())
        qa.console.clear()

        # Sequencer tab and controls
        await page.click('button[data-tab="sequencer"]')
        await page.wait_for_timeout(1000)
        await qa.shot(page, '06-sequencer-empty-state')
        # Check visual/layout issue: footer overlay in main content, overlap title with controls, track controls cramped
        layout = await page.evaluate("""() => {
          const overlaps=[]; const vis=el=>!!(el&&el.offsetParent!==null);
          const els=Array.from(document.querySelectorAll('body *')).filter(vis);
          function r(el){const b=el.getBoundingClientRect(); return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom,text:(el.innerText||el.id||el.className||el.tagName).toString().slice(0,50), id:el.id, cls:el.className.toString()}}
          const footer=document.querySelector('footer.credits');
          const seqHeader=document.querySelector('.sequencer-header, #sequencer h2, .sequencer-title');
          const routePanel=document.querySelector('.routing-section');
          return {footer: footer? r(footer): null, seqHeader: seqHeader? r(seqHeader): null, routePanel: routePanel? r(routePanel): null,
            sequencerVisible: getComputedStyle(document.getElementById('sequencer-tab')).display,
            masterOutputTop: document.querySelector('.master-output-section')?.getBoundingClientRect().top,
            seqTop: document.getElementById('sequencer-tab')?.getBoundingClientRect().top,
            bodyText: document.body.innerText.slice(0,1000)};
        }""")
        qa.log('layout '+json.dumps(layout))
        if layout.get('footer') and layout['footer']['y'] < 900:
            qa.add_failure('footer-overlap','Footer credit text overlays active application controls/content','Low','Visual',page.url,'The “Made by Lior…” footer/credit is rendered inside the working application area on the sequencer view, overlapping the Master Effects/Sequencer region instead of staying below the app chrome.', ['Open app','Switch to Sequencer tab','Inspect Master Output / Sequencer top area'], 'Footer/credit text should not overlap or float on top of active controls.', f"Footer bounding box: {layout['footer']}", qa.screens['06-sequencer-empty-state'], [])
        if qa.console:
            qa.add_failure('sequencer-tab-console','Console output/errors occur when opening Sequencer tab','Medium','Console',page.url,'Switching to the Sequencer tab emitted console output/errors.',['Open app','Click Sequencer tab','Observe console'], 'Tab switch should not produce JS errors.', str(qa.console), qa.screens['06-sequencer-empty-state'], qa.console.copy())
        qa.console.clear()

        # Sequencer upload and controls
        await page.set_input_files('#sequencerAudioUpload', str(A1))
        await page.wait_for_timeout(2500)
        await qa.shot(page, '07-sequencer-after-clip-upload')
        seq_state = await page.evaluate("""() => ({clips:document.querySelectorAll('.clip-library-item,.sequencer-clip').length, tracks:document.querySelectorAll('.sequencer-track').length, available:document.getElementById('clipLibrary')?.innerText || document.querySelector('.available-clips')?.innerText || '', cache:document.getElementById('cacheStatus')?.innerText || ''})""")
        qa.log('seq_state '+json.dumps(seq_state))
        if seq_state['clips'] == 0:
            qa.add_failure('sequencer-upload-no-clip','Sequencer upload does not create an available clip','High','Functional',page.url,'Uploading a valid WAV file through the Sequencer “Choose Audio File” input did not add any visible clip/library item.', ['Switch to Sequencer','Choose a valid WAV file','Inspect Available Clips'], 'Uploaded audio should appear as an available clip that can be placed on tracks.', f'Sequencer state: {seq_state}', qa.screens['07-sequencer-after-clip-upload'], qa.console.copy())
        for sel in ['#sequencerPlayBtn','#sequencerPauseBtn','#sequencerStopBtn','#sequencerLoopToggleBtn','#sequencerRecordBtn','#addBarBtn','#removeBarBtn','#saveProjectBtn','#loadProjectBtn','#exportProjectBtn','#importProjectBtn','#toggleEffectsPanelBtn','#sequencerFullscreenBtn']:
            try:
                if await page.locator(sel).count() and not await page.locator(sel).is_disabled():
                    await page.click(sel, timeout=2000)
                    await page.wait_for_timeout(250)
                    if sel == '#sequencerFullscreenBtn':
                        await page.keyboard.press('Escape')
                        await page.wait_for_timeout(250)
            except Exception as e:
                qa.add_failure(f'sequencer-click-failed-{sel}', f'Sequencer control {sel} fails on click', 'Medium','Functional',page.url, f'Clicking sequencer control {sel} raised an exception.', ['Switch to Sequencer','Click '+sel], 'Sequencer controls should respond or gracefully communicate unavailable state.', repr(e), qa.screens['07-sequencer-after-clip-upload'], qa.console.copy())
        await qa.shot(page, '08-after-sequencer-control-smoke')
        if qa.console:
            qa.add_failure('sequencer-control-console','Sequencer controls emit console output/errors during smoke test','Medium','Console',page.url,'Basic sequencer controls emitted console output/errors during upload/control smoke testing.', ['Switch to Sequencer','Upload valid WAV','Click playback, bars, save/load, export/import, effects panel, fullscreen controls','Observe console'], 'No unhandled JS errors during sequencer controls.', str(qa.console), qa.screens['08-after-sequencer-control-smoke'], qa.console.copy())
        qa.console.clear()

        # Responsive screenshots and layout checks
        for name, vp in [('desktop',{'width':1366,'height':768}),('tablet',{'width':768,'height':1024}),('mobile',{'width':390,'height':844})]:
            await page.set_viewport_size(vp)
            await page.wait_for_timeout(700)
            await qa.shot(page, f'09-responsive-{name}')
            metrics = await page.evaluate("""() => ({scrollW:document.documentElement.scrollWidth, innerW:window.innerWidth, bodyW:document.body.getBoundingClientRect().width, offscreen:Array.from(document.querySelectorAll('button,input,select')).filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect(); return {id:e.id,text:(e.innerText||e.value||e.ariaLabel||'').slice(0,30),x:r.x,right:r.right,w:r.width}}).filter(x=>x.x< -1 || x.right > window.innerWidth+1).slice(0,20)})""")
            qa.log(f'responsive {name} '+json.dumps(metrics))
            if metrics['scrollW'] > metrics['innerW'] + 5 or metrics['offscreen']:
                qa.add_failure(f'responsive-overflow-{name}', f'{name.capitalize()} viewport has horizontal overflow/off-screen controls', 'Medium','Visual',page.url, f'At {vp["width"]}x{vp["height"]}, the page width exceeds the viewport or controls extend off-screen.', ['Open app','Switch to Sequencer','Resize viewport to '+str(vp),'Inspect horizontal overflow/off-screen controls'], 'Layout should fit viewport or provide intentional contained scrolling without cutting controls off.', f'Metrics: {metrics}', qa.screens[f'09-responsive-{name}'], [])

        await browser.close()
    print('\nQA_JSON_START')
    print(json.dumps({'failures':qa.failures,'screens':qa.screens,'events':qa.events}, indent=2))

async def handle_dialog(d, qa):
    qa.dialogs.append({'type':d.type,'message':d.message})
    qa.console.append({'type':'dialog','text':f'{d.type}: {d.message}','location':{}})
    await d.dismiss()

if __name__ == '__main__':
    asyncio.run(main())
