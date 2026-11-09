/**
 * Frame This! browser companion: a viewfinder with one large, stable cue.
 * DOM wiring only. Measurement and guidance come from src/vision through
 * pipeline.ts; wording and stabilisation come from director.ts. Frames never
 * leave the page.
 */
import { PhotoAnalysisEngine, THIRDS_INTERSECTIONS, type PhotoAnalysis, type Point } from '../vision/index.ts';
import { cameraErrorMessage, INSECURE_CONTEXT_MESSAGE } from './cameraErrors.ts';
import {
  DEMO_SCENES, INITIAL_OFFSET, frameToWorld, panOffset, renderDemoScene, worldToFrame,
  type DemoSceneId, type PanDirection,
} from './demoScene.ts';
import { CueStabilizer, cuePlacement, directorCue, displayHeadline, type StableCue } from './director.ts';
import { clientToFrame, fitContain } from './geometry.ts';
import { compositionObservations, lightingObservations, type Observation } from './observations.ts';
import { analysisHeight, analyzeRgba, ANALYSIS_WIDTH } from './pipeline.ts';
import './style.css';

type Source = 'none' | 'camera' | 'demo';
const DEMO_W = 640;
const DEMO_H = 360;
/** Analysis cadence. The stabiliser needs 2 agreeing updates, so cues change at most ~1/s. */
const TICK_MS = 400;

const SHUTTER_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4h6l1.5 2H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<div class="shell">
  <header class="top">
    <div class="brand">
      <span class="mark" aria-hidden="true"></span>
      <div><strong>Frame This!</strong><small>Ghost Hands AR</small></div>
    </div>
    <span class="pill" title="The native SPECS Lens lives in the Ghost-Hands-AR Lens Studio project.">Web demo · not the SPECS Lens</span>
  </header>

  <main>
    <section class="viewer" aria-label="Viewfinder">
      <div class="stage" id="stage">
        <div class="frame" id="frame" hidden>
          <video id="video" playsinline muted aria-label="Camera preview"></video>
          <canvas id="demo" width="${DEMO_W}" height="${DEMO_H}" aria-label="Simulated demo scene" hidden></canvas>
          <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <g id="grid" hidden>
              <line x1="33.333" y1="0" x2="33.333" y2="100"/><line x1="66.667" y1="0" x2="66.667" y2="100"/>
              <line x1="0" y1="33.333" x2="100" y2="33.333"/><line x1="0" y1="66.667" x2="100" y2="66.667"/>
            </g>
            <line id="link" class="link-line" x1="0" y1="0" x2="0" y2="0" hidden/>
          </svg>
          <div id="nodes" hidden>
            ${THIRDS_INTERSECTIONS.map((p) => `<span class="node" style="left:${p.x * 100}%;top:${p.y * 100}%"></span>`).join('')}
          </div>
          <span class="target" id="target" hidden></span>
          <span class="subject" id="subject" hidden></span>
          <div class="cue" id="cue" data-pos="middle" data-kind="waiting">
            <span class="cue-eyebrow" id="cueEyebrow"></span>
            <strong class="cue-head" id="cueHead" aria-hidden="true"></strong>
            <span class="cue-detail" id="cueDetail"></span>
          </div>
          <span class="sr-only" id="cueSpoken" role="status" aria-live="polite"></span>
          <span class="badge" id="sourceBadge"></span>
          <div class="flash" id="flash"></div>
        </div>

        <div class="welcome" id="welcome">
          <h1>See what you've been <em>missing.</em></h1>
          <p>Point your camera at a scene. Frame This! tells you where to look, one cue at a time, until the shot lines up.</p>
          <div class="row center">
            <button class="primary" id="enableCamera" type="button">Enable camera</button>
            <button id="welcomeDemo" type="button">Try demo · no camera</button>
          </div>
          <p class="fine" id="welcomeNote">Your browser will ask for camera permission first. Video is analysed on this device and never uploaded.</p>
        </div>
      </div>

      <div class="capture-bar" id="captureBar" hidden>
        <button class="side-btn" id="scout" type="button" aria-pressed="false">
          <span class="ico grid-ico" aria-hidden="true"></span><span>Scout grid</span>
        </button>
        <button class="shutter" id="shutter" type="button" aria-label="Capture photo">
          <span class="shutter-core">${SHUTTER_SVG}</span>
          <span class="shutter-text" id="shutterText">Capture</span>
        </button>
        <button class="side-btn" id="flip" type="button" disabled>
          <span class="ico flip-ico" aria-hidden="true">⇄</span><span>Switch</span>
        </button>
      </div>

      <div class="demo-controls" id="demoControls" hidden>
        <span class="demo-tag">Simulated camera</span>
        <div class="scenes" role="radiogroup" aria-label="Demo lighting">
          ${DEMO_SCENES.map((s) => `<button type="button" role="radio" class="chip" data-scene="${s.id}">${s.label}</button>`).join('')}
        </div>
        <div class="pad" aria-label="Look around the simulated scene">
          <button type="button" data-pan="left" aria-label="Look left">←</button>
          <button type="button" data-pan="up" aria-label="Look up">↑</button>
          <button type="button" data-pan="down" aria-label="Look down">↓</button>
          <button type="button" data-pan="right" aria-label="Look right">→</button>
        </div>
      </div>

      <div class="toast" id="toast" role="status" aria-live="polite" hidden>
        <img id="toastImg" alt="Captured photo thumbnail" hidden>
        <div><strong id="toastTitle"></strong><span id="toastBody"></span></div>
      </div>

      <div class="secondary" id="secondary" hidden>
        <button class="link-btn" id="reset" type="button">Reset</button>
        <button class="link-btn" id="camera" type="button">Stop camera</button>
        <button class="link-btn" id="demoBtn" type="button">Try demo</button>
      </div>
      <p class="message" id="message" role="status" aria-live="polite"></p>
    </section>

    <details class="readings">
      <summary>What Frame This! is measuring</summary>
      <div class="readings-grid">
        <section><span class="label">Light <small id="lightNote"></small></span><dl id="light"></dl></section>
        <section><span class="label">Composition</span><dl id="comp"></dl></section>
      </div>
      <p class="fine">Directions come from where you tapped your subject; there is no automatic subject detection yet. Light readings are brightness of the camera image, which your browser auto-exposes, not a light meter. Frames are analysed at ${ANALYSIS_WIDTH}px wide in this page and never uploaded.</p>
    </details>
  </main>

  <footer>Ghost Hands AR: Frame This! · Learn AR with SPECS · Browser companion demo. It does not show native Spectacles camera access, hand tracking or on-device AI.</footer>
</div>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>('video');
const demoCanvas = $<HTMLCanvasElement>('demo');
const demoCtx = demoCanvas.getContext('2d')!;
const stage = $('stage');
const frame = $('frame');
const link = document.getElementById('link') as unknown as SVGLineElement;
const grid = document.getElementById('grid') as unknown as SVGGElement;
const btn = {
  scout: $<HTMLButtonElement>('scout'),
  shutter: $<HTMLButtonElement>('shutter'),
  flip: $<HTMLButtonElement>('flip'),
  reset: $<HTMLButtonElement>('reset'),
  camera: $<HTMLButtonElement>('camera'),
  demo: $<HTMLButtonElement>('demoBtn'),
  enable: $<HTMLButtonElement>('enableCamera'),
};
const sampler = document.createElement('canvas');
const samplerCtx = sampler.getContext('2d', { willReadFrequently: true })!;

const engine = new PhotoAnalysisEngine({ memory: { sampleIntervalMs: TICK_MS } });
const stabilizer = new CueStabilizer({ confirmUpdates: 2, minHoldMs: 1000 });
let source: Source = 'none';
let showGrid = false;
let stream: MediaStream | null = null;
let cameraRequest = 0;
let facing: 'environment' | 'user' = 'environment';
let multipleCameras = false;
let timer: number | undefined;
let analysis: PhotoAnalysis | null = null;
/** Cue shown on screen; only analysis ticks advance it (see CueStabilizer). */
let stable: StableCue | null = null;
/** Camera: fixed frame point (not tracked). Demo: world point that moves with the simulated pan. */
let subjectFrame: Point | null = null;
let subjectWorld: Point | null = null;
let scene: DemoSceneId = 'golden';
let offset: Point = INITIAL_OFFSET;
let capturing = false;
let lastPhotoUrl: string | null = null;

const say = (text: string) => { $('message').textContent = text; };

// ---------- layout ----------

function mediaSize(): [number, number] {
  if (source === 'camera' && video.videoWidth > 0) return [video.videoWidth, video.videoHeight];
  return [DEMO_W, DEMO_H];
}
function layout() {
  const [mw, mh] = mediaSize();
  const ratio = source === 'none' ? '' : `${mw} / ${mh}`;
  if (stage.style.aspectRatio !== ratio) stage.style.aspectRatio = ratio;
  const box = fitContain(stage.clientWidth, stage.clientHeight, mw, mh);
  Object.assign(frame.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
}
new ResizeObserver(layout).observe(stage);
video.addEventListener('loadedmetadata', layout);
video.addEventListener('resize', layout);

// ---------- sources ----------

function stopTracks() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  video.pause();
  video.srcObject = null;
}

function clearSubject() {
  subjectFrame = null;
  subjectWorld = null;
}

function setSource(next: Source) {
  if (next !== 'camera') { cameraRequest++; stopTracks(); }
  source = next;
  clearSubject();
  analysis = null;
  engine.reset();
  stabilizer.reset();
  stable = null;
  video.hidden = next !== 'camera';
  demoCanvas.hidden = next !== 'demo';
  $('demoControls').hidden = next !== 'demo';
  $('welcome').hidden = next !== 'none';
  frame.hidden = next === 'none';
  $('captureBar').hidden = next === 'none';
  $('secondary').hidden = next === 'none';
  if (next === 'none') {
    if (timer !== undefined) { clearInterval(timer); timer = undefined; }
  } else if (timer === undefined) {
    timer = window.setInterval(() => tick(false), TICK_MS);
  }
  layout();
  render();
}

async function startCamera() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { say(INSECURE_CONTEXT_MESSAGE); return; }
  const request = ++cameraRequest;
  stopTracks();
  btn.enable.disabled = true;
  $('welcomeNote').textContent = 'Waiting for camera permission…';
  try {
    const acquired = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (request !== cameraRequest) { acquired.getTracks().forEach((t) => t.stop()); return; }
    stream = acquired;
    video.srcObject = acquired;
    await video.play();
    const track = acquired.getVideoTracks()[0];
    const actual = track?.getSettings().facingMode;
    if (actual === 'user' || actual === 'environment') facing = actual;
    track?.addEventListener('ended', () => {
      if (stream === acquired) { setSource('none'); say('The camera stopped (disconnected or permission revoked).'); }
    });
    setSource('camera');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      multipleCameras = devices.filter((d) => d.kind === 'videoinput').length > 1;
    } catch { multipleCameras = false; }
    say(facing === 'user'
      ? 'Front camera. The preview is not mirrored, so directions are from the camera’s point of view.'
      : '');
    tick(true);
  } catch (err) {
    if (request !== cameraRequest) return;
    stopTracks();
    if (source === 'camera') setSource('none');
    const msg = cameraErrorMessage(err);
    $('welcomeNote').textContent = msg;
    say(source === 'none' ? '' : msg);
  } finally {
    if (request === cameraRequest) btn.enable.disabled = false;
    render();
  }
}

function startDemo() {
  setSource('demo');
  offset = INITIAL_OFFSET;
  drawDemo();
  say('Simulated scene with a lone tree. Tap the tree, then use the arrows to look around.');
  tick(true);
}

function drawDemo() {
  demoCtx.putImageData(new ImageData(renderDemoScene(scene, DEMO_W, DEMO_H, offset), DEMO_W, DEMO_H), 0, 0);
}

// ---------- analysis ----------

function currentSubject(): Point | null {
  if (source === 'demo') return subjectWorld && worldToFrame(subjectWorld, offset);
  return subjectFrame;
}

function tick(force: boolean) {
  if (source === 'none') return;
  if (source === 'camera' && (video.readyState < 2 || video.videoWidth === 0)) return;
  const [mw, mh] = mediaSize();
  const w = ANALYSIS_WIDTH;
  const h = analysisHeight(mw, mh);
  if (sampler.width !== w || sampler.height !== h) { sampler.width = w; sampler.height = h; }
  try {
    samplerCtx.drawImage(source === 'camera' ? video : demoCanvas, 0, 0, w, h);
    const { data } = samplerCtx.getImageData(0, 0, w, h);
    analysis = analyzeRgba(engine, data, w, h, performance.now(), currentSubject(), force);
    stable = stabilizer.update(directorCue(analysis), performance.now());
  } catch (err) {
    say(`Frame analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  render();
}

frame.addEventListener('click', (e) => {
  if (source === 'none') return;
  const p = clientToFrame(e.clientX, e.clientY, frame.getBoundingClientRect());
  if (!p) return;
  if (source === 'demo') subjectWorld = frameToWorld(p, offset);
  else subjectFrame = p;
  stabilizer.reset(); // a tap is a direct action: respond immediately
  tick(false);
});

function pan(dir: PanDirection) {
  if (source !== 'demo') return;
  offset = panOffset(offset, dir);
  drawDemo();
  tick(true);
}

// ---------- rendering ----------

function fillList(id: string, items: Observation[]) {
  $(id).replaceChildren(...items.map((o) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = o.label;
    dd.textContent = o.value;
    row.append(dt, dd);
    return row;
  }));
}

function render() {
  const active = source !== 'none';
  const cue = active && stable ? stable.cue : directorCue(null);
  const heldMs = stable?.heldMs ?? 0;
  const ready = active && cue.ready;
  const headline = displayHeadline(cue, heldMs);
  const celebrate = ready && headline !== cue.headline;

  // Cue card
  const cueEl = $('cue');
  cueEl.dataset.kind = cue.kind;
  const placement = cuePlacement(currentSubject());
  cueEl.dataset.pos = placement;
  cueEl.classList.toggle('celebrate', celebrate);
  $('cueHead').textContent = headline;
  $('cueDetail').textContent = cue.detail;
  $('cueEyebrow').textContent = source === 'demo' ? 'Simulated scene' : '';
  const spoken = celebrate ? headline : cue.spoken;
  if ($('cueSpoken').textContent !== spoken) $('cueSpoken').textContent = spoken;

  // Marks
  const comp = analysis?.composition;
  const known = active && comp && comp.status !== 'unknown' ? comp : null;
  grid.toggleAttribute('hidden', !showGrid);
  $('nodes').hidden = !showGrid;
  $('subject').hidden = !known;
  $('target').hidden = !known;
  link.toggleAttribute('hidden', !known || known.status === 'aligned');
  frame.classList.toggle('is-ready', ready);
  if (known) {
    Object.assign($('subject').style, { left: `${known.subject.x * 100}%`, top: `${known.subject.y * 100}%` });
    Object.assign($('target').style, { left: `${known.target.x * 100}%`, top: `${known.target.y * 100}%` });
    link.setAttribute('x1', String(known.subject.x * 100));
    link.setAttribute('y1', String(known.subject.y * 100));
    link.setAttribute('x2', String(known.target.x * 100));
    link.setAttribute('y2', String(known.target.y * 100));
  }
  const badge = $('sourceBadge');
  // Demo is labelled on the cue itself; the live badge yields to a cue that moved to the top.
  badge.textContent = 'Live · on this device';
  badge.hidden = source !== 'camera' || placement !== 'middle';

  // Controls
  btn.shutter.classList.toggle('ready', ready);
  btn.shutter.disabled = !active || capturing;
  btn.shutter.setAttribute('aria-label', ready ? 'Capture photo. Framing is ready' : 'Capture photo');
  $('shutterText').textContent = ready ? 'Capture' : '';
  btn.scout.setAttribute('aria-pressed', String(showGrid));
  btn.flip.disabled = source !== 'camera' || !multipleCameras;
  btn.flip.title = source === 'camera' && !multipleCameras ? 'Only one camera found' : 'Switch between front and rear cameras';
  btn.camera.textContent = source === 'camera' ? 'Stop camera' : 'Use camera';
  btn.demo.textContent = source === 'demo' ? 'Exit demo' : 'Try demo';
  document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.scene === scene));
  });

  // Readings
  if (active && analysis?.lighting) {
    fillList('light', lightingObservations(analysis.lighting));
    $('lightNote').textContent = source === 'demo' ? 'synthetic pixels' : 'camera pixels';
  } else {
    fillList('light', [{ label: 'Status', value: 'Not measured yet' }]);
    $('lightNote').textContent = '';
  }
  fillList('comp', active && analysis
    ? compositionObservations(analysis.composition)
    : [{ label: 'Subject', value: 'Unknown' }]);
}

// ---------- capture ----------

function toast(title: string, body: string, imageUrl: string | null) {
  $('toast').hidden = false;
  $('toastTitle').textContent = title;
  $('toastBody').textContent = body;
  const img = $<HTMLImageElement>('toastImg');
  img.hidden = imageUrl === null;
  if (imageUrl) img.src = imageUrl;
}

async function capture() {
  const media = source === 'camera' ? video : source === 'demo' ? demoCanvas : null;
  if (!media || capturing) return;
  capturing = true;
  render();
  try {
    const [w, h] = mediaSize();
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d')!.drawImage(media, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) throw new Error('The browser could not encode the image.');
    const flash = $('flash');
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');
    if (lastPhotoUrl) URL.revokeObjectURL(lastPhotoUrl);
    lastPhotoUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = lastPhotoUrl;
    a.download = `frame-this-${source === 'demo' ? 'demo-' : ''}${stamp}.jpg`;
    document.body.append(a);
    a.click();
    a.remove();
    // We can confirm the photo was captured and the download was handed to the
    // browser; we cannot confirm where (or whether) the browser wrote the file.
    toast('Photo captured', `${source === 'demo' ? 'Simulated scene. ' : ''}Your browser is downloading it to this device. Nothing was uploaded.`, lastPhotoUrl);
  } catch (err) {
    toast('Capture failed', `Nothing was saved. ${err instanceof Error ? err.message : ''}`.trim(), null);
  } finally {
    capturing = false;
    render();
  }
}

// ---------- events ----------

btn.enable.addEventListener('click', () => void startCamera());
$('welcomeDemo').addEventListener('click', startDemo);
btn.shutter.addEventListener('click', () => void capture());
btn.scout.addEventListener('click', () => { showGrid = !showGrid; render(); });
btn.reset.addEventListener('click', () => {
  clearSubject();
  showGrid = false;
  engine.reset();
  stabilizer.reset();
  tick(true);
  say('Reset. Tap your subject to start again.');
});
btn.camera.addEventListener('click', () => {
  if (source === 'camera') { setSource('none'); say('Camera stopped.'); } else void startCamera();
});
btn.flip.addEventListener('click', () => {
  facing = facing === 'environment' ? 'user' : 'environment';
  void startCamera();
});
btn.demo.addEventListener('click', () => {
  if (source === 'demo') { setSource('none'); say(''); } else startDemo();
});
document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => {
  scene = b.dataset.scene as DemoSceneId;
  drawDemo();
  stabilizer.reset();
  tick(true);
}));
document.querySelectorAll<HTMLButtonElement>('[data-pan]').forEach((b) => b.addEventListener('click', () => {
  pan(b.dataset.pan as PanDirection);
}));
window.addEventListener('keydown', (e) => {
  if (source !== 'demo' || e.altKey || e.ctrlKey || e.metaKey) return;
  const keys: Record<string, PanDirection | undefined> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  const dir = keys[e.key];
  if (dir) { e.preventDefault(); pan(dir); }
});
window.addEventListener('pagehide', () => {
  cameraRequest++;
  stopTracks();
  engine.reset();
  if (lastPhotoUrl) { URL.revokeObjectURL(lastPhotoUrl); lastPhotoUrl = null; }
});

setSource('none');
