from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parents[1] / "docs" / "assets"
OUT.mkdir(parents=True, exist_ok=True)
svg_path = OUT / "browser-jockey-true-signal-flow.svg"
html_path = OUT / "browser-jockey-true-signal-flow.html"

W, H = 1600, 1100

colors = {
    "bg": "#020617", "grid": "#1e293b", "text": "#e2e8f0", "muted": "#94a3b8",
    "input": ("rgba(8, 51, 68, 0.72)", "#22d3ee"),
    "track": ("rgba(6, 78, 59, 0.72)", "#34d399"),
    "effect": ("rgba(76, 29, 149, 0.70)", "#a78bfa"),
    "bus": ("rgba(251, 146, 60, 0.35)", "#fb923c"),
    "master": ("rgba(120, 53, 15, 0.52)", "#fbbf24"),
    "record": ("rgba(136, 19, 55, 0.55)", "#fb7185"),
    "external": ("rgba(30, 41, 59, 0.75)", "#94a3b8"),
}

parts = []
def add(s): parts.append(s)

def rect(x,y,w,h,kind,title,sub="",rx=14):
    fill, stroke = colors[kind]
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="#0f172a"/>')
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
    add(f'<text x="{x+w/2}" y="{y+28}" text-anchor="middle" class="box-title">{escape(title)}</text>')
    if sub:
        for i,line in enumerate(sub.split('\n')):
            add(f'<text x="{x+w/2}" y="{y+49+i*15}" text-anchor="middle" class="box-sub">{escape(line)}</text>')

def pill(x,y,w,h,kind,title,sub=""):
    rect(x,y,w,h,kind,title,sub,rx=28)

def line(x1,y1,x2,y2,color="#64748b",dash="",width=2.3,label="",labeldx=0,labeldy=-8,marker="arrow"):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    marker_attr = f' marker-end="url(#{marker})"' if marker else ""
    add(f'<path d="M {x1} {y1} L {x2} {y2}" fill="none" stroke="{color}" stroke-width="{width}"{dash_attr}{marker_attr}/>' )
    if label:
        add(f'<text x="{(x1+x2)/2+labeldx}" y="{(y1+y2)/2+labeldy}" text-anchor="middle" class="edge-label" fill="{color}">{escape(label)}</text>')

def elbow(points,color="#64748b",dash="",width=2.3,label="",marker="arrow"):
    d = "M " + " L ".join(f"{x} {y}" for x,y in points)
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    marker_attr = f' marker-end="url(#{marker})"' if marker else ""
    add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}"{dash_attr}{marker_attr}/>' )
    if label:
        x,y=points[len(points)//2]
        add(f'<text x="{x}" y="{y-8}" text-anchor="middle" class="edge-label" fill="{color}">{escape(label)}</text>')

add(f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="{colors['grid']}" stroke-width="0.6"/></pattern>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/></marker>
  <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#fb923c"/></marker>
  <marker id="arrowRose" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#fb7185"/></marker>
  <style>
    .title {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 31px; font-weight: 800; fill: #f8fafc; }}
    .subtitle {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 13px; fill: #94a3b8; }}
    .section {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 15px; font-weight: 700; fill: #cbd5e1; letter-spacing: .08em; }}
    .box-title {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 13px; font-weight: 800; fill: #f8fafc; }}
    .box-sub {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 10px; fill: #cbd5e1; }}
    .edge-label {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 9px; font-weight: 700; }}
    .note {{ font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 10px; fill: #94a3b8; }}
  </style>
</defs>
<rect width="100%" height="100%" fill="{colors['bg']}"/>
<rect width="100%" height="100%" fill="url(#grid)" opacity="0.7"/>
<text x="54" y="54" class="title">Browser Jockey — True Client-Side Signal Flow</text>
<text x="54" y="79" class="subtitle">Grounded in Graphify AST graph: 5,411 nodes / 5,816 extracted links + Web Audio source review</text>
''')

# Section boundaries
add('<rect x="34" y="110" width="1532" height="195" rx="18" fill="none" stroke="#22d3ee" stroke-width="1.2" stroke-dasharray="8 6" opacity="0.55"/>')
add('<text x="54" y="135" class="section">INPUTS / FEATURE SOURCES</text>')
add('<rect x="34" y="330" width="1532" height="250" rx="18" fill="none" stroke="#34d399" stroke-width="1.2" stroke-dasharray="8 6" opacity="0.55"/>')
add('<text x="54" y="355" class="section">TRACK + OPTIONAL INSERT PROCESSING</text>')
add('<rect x="34" y="612" width="1532" height="272" rx="18" fill="none" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="8 6" opacity="0.55"/>')
add('<text x="54" y="637" class="section">SUMMING BUS / MASTER EFFECTS / OUTPUT TAPS</text>')

# Inputs
rect(70,160,155,75,"input","File / <audio>","Track 1 + Track 2\nMediaElementSource")
rect(250,160,155,75,"input","Tab Capture","getDisplayMedia audio\nas track or mic")
rect(430,160,155,75,"input","Microphone","getUserMedia → micSource\necho/noise opts")
rect(610,160,155,75,"input","Sampler","AudioBufferSource\nper active key")
rect(790,160,155,75,"input","Sequencer","clip track gains\noutputGain → routingGain")
rect(970,160,155,75,"input","Pattern Deck","initialized with\n(audioContext, merger)")
rect(1150,160,155,75,"input","Lo-fi Station","initialized with\n(audioContext, merger)")

# Track chain condensed
rect(70,395,135,82,"track","Track Entry","source1/2 or\ntabCaptureSource")
rect(230,395,118,82,"track","Gain","volume")
rect(373,395,118,82,"track","StereoPanner","pan")
rect(516,395,132,82,"effect","TimeStretch","AudioWorklet\noptional")
rect(673,395,132,82,"effect","PitchShift","Tone.js\noptional/fallback")
rect(830,395,132,82,"effect","3-Band EQ","low → mid → high")
rect(987,395,118,82,"effect","Filter","low-pass")
rect(1130,375,135,62,"effect","Reverb wet","Convolver → wet")
rect(1130,455,135,62,"effect","Reverb dry","dry GainNode")
rect(1290,395,118,82,"effect","Delay","wet / dry split")
rect(1430,395,100,82,"bus","FinalMix","to merger\nor insert")

for a,b in [((205,436),(230,436)),((348,436),(373,436)),((491,436),(516,436)),((648,436),(673,436)),((805,436),(830,436)),((962,436),(987,436)),((1105,436),(1130,406)),((1105,436),(1130,486)),((1265,406),(1290,430)),((1265,486),(1290,446)),((1408,436),(1430,436))]:
    line(*a,*b)
line(70,235,137,395,label="Track files")
elbow([(250,235),(250,330),(137,330),(137,395)],label="Tab as track")

# Insert processors. Keep these below the reverb/delay split so they read as optional sidecars,
# not inline boxes inside the normal track wet/dry path.
rect(760,525,175,44,"record","Auto-Tune insert","finalMix or micGain → analyser + dry/wet")
rect(985,525,175,44,"record","Vocoder insert","modulator+carrier → bands")
elbow([(1480,477),(1480,545),(935,545)],color="#fb7185",dash="7 5",label="optional intercept",marker="arrowRose")
line(935,545,985,545,color="#fb7185",dash="7 5",marker="arrowRose")

# Other source routes to merger
rect(710,690,170,72,"bus","merger","GainNode summing bus\nnot ChannelMergerNode")
elbow([(430,235),(430,690),(710,690)],color="#22d3ee",label="micGain direct unless insert")
elbow([(610,235),(610,726),(710,726)],color="#22d3ee",label="noteGain + ADSR")
elbow([(790,235),(790,330),(795,330),(795,690)],color="#22d3ee",label="route checkbox")
elbow([(970,235),(970,705),(880,705)],color="#22d3ee",label="direct features")
elbow([(1150,235),(1150,740),(880,740)],color="#22d3ee")
elbow([(1530,436),(1530,650),(880,650),(880,690)],color="#fb923c",marker="arrowOrange",label="normal finalMix")
elbow([(935,545),(935,610),(880,610),(880,705)],color="#fb7185",dash="7 5",marker="arrowRose",label="auto-tune output")
elbow([(1160,545),(1325,545),(1325,630),(880,630),(880,720)],color="#fb7185",dash="7 5",marker="arrowRose",label="vocoder output")

# Master chain
rect(930,690,125,72,"master","Master Filter","BiquadFilter")
rect(1090,690,125,72,"master","Master Pan","StereoPanner")
rect(1250,650,125,54,"master","Master Reverb","wet/dry mix")
rect(1250,728,125,54,"master","Master Delay","wet/dry mix")
rect(1415,690,115,72,"master","gainMaster","master volume")
line(880,726,930,726,color="#fb923c",marker="arrowOrange")
line(1055,726,1090,726,color="#fb923c",marker="arrowOrange")
elbow([(1215,726),(1233,726),(1233,677),(1250,677)],color="#fb923c",marker="arrowOrange")
elbow([(1215,726),(1233,726),(1233,755),(1250,755)],color="#fb923c",marker="arrowOrange")
elbow([(1375,677),(1395,677),(1395,716),(1415,716)],color="#fb923c",marker="arrowOrange")
elbow([(1375,755),(1395,755),(1395,736),(1415,736)],color="#fb923c",marker="arrowOrange")

# Outputs
rect(118,780,150,62,"external","Oscilloscope","tap from merger")
rect(930,805,130,58,"external","Analyser","fftSize 512")
rect(1090,805,140,58,"external","Speakers","audioContext.destination")
rect(1258,805,150,58,"record","Recording Dest","MediaStreamDestination")
rect(1435,805,98,58,"record","MediaRecorder","WebM/OGG")
line(710,738,268,811,color="#94a3b8",dash="4 4",label="visual tap")
elbow([(1472,762),(1472,790),(995,790),(995,805)],color="#94a3b8",label="spectrum tap")
line(1060,834,1090,834,color="#94a3b8")
elbow([(1472,762),(1472,790),(1333,790),(1333,805)],color="#fb7185",marker="arrowRose",label="post-master mix")
line(1408,834,1435,834,color="#fb7185",marker="arrowRose")

# Call graph provenance cards
rect(70,930,330,105,"external","AST-confirmed orchestration","initAudioContext() calls initAudioEffects(),\nconnectEffectsChain(), limiter, oscilloscope;\ncreates shared AudioContext + merger")
rect(430,930,330,105,"external","Module entry points","audio-effects.connectEffectsChain()\nmicrophone.enableMicrophone()\nautotune.enableAutotune()")
rect(790,930,330,105,"external","Feature processors","vocoder.enableVocoder() creates band bank;\nsampler.playSamplerNote() creates note source;\nSequencer.initializeAudioRouting() creates routingGain")
rect(1150,930,380,105,"external","Truth notes","Recording is post-master from gainMaster;\noscilloscope is pre-master from merger;\nsampler can also tap recordingDestination")

# Legend
legend_x, legend_y = 1230, 38
for i,(kind,label) in enumerate([("input","source"),("track","track chain"),("effect","effect"),("bus","bus"),("master","master"),("record","record/insert")]):
    fill,stroke=colors[kind]
    x=legend_x+(i%3)*112; y=legend_y+(i//3)*28
    add(f'<rect x="{x}" y="{y}" width="18" height="12" rx="3" fill="{fill}" stroke="{stroke}"/>')
    add(f'<text x="{x+25}" y="{y+10}" class="note">{label}</text>')

add('<text x="54" y="1070" class="note">Sources reviewed: graphify-out/graph.json; app/static/js/app.js; modules/audio-effects.js, microphone.js, autotune.js, vocoder.js, sampler.js, sequencer.js.</text>')
add('</svg>')

svg = "\n".join(parts)
svg_path.write_text(svg)
html_path.write_text(f"""<!doctype html><html><head><meta charset='utf-8'><title>Browser Jockey Signal Flow</title><style>body{{margin:0;background:#020617}}svg{{display:block}}</style></head><body>{svg}</body></html>""")
print(svg_path)
print(html_path)
