/**
 * Frame This! browser companion. DOM wiring only: all measurement and guidance
 * logic comes from src/vision via pipeline.ts. Frames never leave the page.
 */
import { PhotoAnalysisEngine, THIRDS_INTERSECTIONS, type PhotoAnalysis, type Point } from '../vision/index.ts';
import { cameraErrorMessage, INSECURE_CONTEXT_MESSAGE } from './cameraErrors.ts';
import {
  DEMO_SCENES, INITIAL_OFFSET, frameToWorld, panOffset, renderDemoScene, worldToFrame,
  type DemoSceneId, type PanDirection,
} from './demoScene.ts';
import { clientToFrame, fitContain } from './geometry.ts';
import { compositionObservations, lightingObservations, type Observation } from './observations.ts';
import { analysisHeight, analyzeRgba, ANALYSIS_WIDTH } from './pipeline.ts';
import './style.css';

type Source = 'none' | 'camera' | 'demo';
const DEMO_W = 640;
const DEMO_H = 360;
const TICK_MS = 500;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<div class="shell">
  <header class="top">
    <div class="brand">
      <span class="mark" aria-hidden="true"></span>
      <div><strong>Ghost Hands AR</strong><small>Frame This! · browser companion</small></div>
    </div>
    <span class="pill" title="This page is a web demo. The native SPECS Lens lives in the Ghost-Hands-AR Lens Studio project.">Web demo · not the SPECS Lens</span>
  </header>

  <section class="intro">
    <h1>See what you've been<br><em>missing.</em></h1>
    <p>A quiet framing assistant. Scout shows a rule-of-thirds guide and one suggestion at a time, based on brightness measured from your camera and a subject point you tap.</p>
  </section>

  <main class="layout">
    <section class="viewer" aria-label="Viewfinder">
      <div class="stage" id="stage">
        <div class="frame" id="frame">
          <video id="video" playsinline muted aria-label="Camera preview"></video>
          <canvas id="demo" width="${DEMO_W}" height="${DEMO_H}" aria-label="Simulated demo scene" hidden></canvas>
          <div class="overlay" id="overlay" hidden>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1="33.333" y1="0" x2="33.333" y2="100"/><line x1="66.667" y1="0" x2="66.667" y2="100"/>
              <line x1="0" y1="33.333" x2="100" y2="33.333"/><line x1="0" y1="66.667" x2="100" y2="66.667"/>
              <line id="link" class="link-line" x1="0" y1="0" x2="0" y2="0" hidden/>
            </svg>
            ${THIRDS_INTERSECTIONS.map((p) => `<span class="node" data-id="${p.id}" style="left:${p.x * 100}%;top:${p.y * 100}%"></span>`).join('')}
            <span class="subject" id="subject" hidden></span>
          </div>
          <div class="corners" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <span class="badge source" id="sourceBadge" hidden></span>
          <span class="badge ready" id="readyBadge" hidden>Capture This!</span>
        </div>
        <div class="empty" id="empty">
          <span class="empty-mark" aria-hidden="true"></span>
          <strong>Start the camera, or try the demo</strong>
          <p>The demo uses a built-in synthetic scene, so it works without camera permission.</p>
          <div class="row">
            <button class="primary" id="emptyCamera" type="button">Start camera</button>
            <button id="emptyDemo" type="button">Try Demo</button>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="row main-row">
          <button class="primary wide" id="scout" type="button" disabled>Scout</button>
          <button id="reset" type="button" disabled>Reset</button>
          <button id="capture" type="button" disabled>Save photo</button>
        </div>
        <div class="row">
          <button id="camera" type="button">Start camera</button>
          <button id="flip" type="button" disabled title="Switch between front and rear cameras">Switch camera</button>
          <button id="demoBtn" type="button">Try Demo</button>
        </div>
        <div class="demo-controls" id="demoControls" hidden>
          <div class="scenes" role="radiogroup" aria-label="Demo lighting">
            ${DEMO_SCENES.map((s) => `<button type="button" role="radio" class="chip" data-scene="${s.id}">${s.label}</button>`).join('')}
          </div>
          <div class="pad" aria-label="Pan the simulated camera">
            <span class="pad-label">Pan</span>
            <button type="button" data-pan="left" aria-label="Pan left">←</button>
            <button type="button" data-pan="up" aria-label="Tilt up">↑</button>
            <button type="button" data-pan="down" aria-label="Tilt down">↓</button>
            <button type="button" data-pan="right" aria-label="Pan right">→</button>
          </div>
        </div>
        <p class="message" id="message" role="status" aria-live="polite"></p>
      </div>
    </section>

    <aside class="side">
      <section class="panel guidance" id="guidancePanel">
        <span class="label">Guidance</span>
        <p class="cue" id="cue">Start the camera or Try Demo.</p>
        <p class="basis" id="basis"></p>
      </section>
      <section class="panel">
        <span class="label">Light <small id="lightNote"></small></span>
        <dl id="light"><div><dt>Status</dt><dd>Not measured</dd></div></dl>
      </section>
      <section class="panel">
        <span class="label">Composition</span>
        <dl id="comp"><div><dt>Subject</dt><dd>Unknown</dd></div></dl>
        <p class="fine" id="compNote">No automatic subject detection. Tap your subject to mark it.</p>
      </section>
      <section class="panel privacy">
        <span class="label">Privacy</span>
        <p class="fine">Frames are analysed in this browser at ${ANALYSIS_WIDTH}px wide and never uploaded. A photo is saved to your device only when you press Save photo.</p>
      </section>
    </aside>
  </main>

  <footer>Ghost Hands AR: Frame This! · Learn AR with SPECS · This browser demo does not show native Spectacles camera access, hand tracking or on-device AI.</footer>
</div>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const video = $<HTMLVideoElement>('video');
const demoCanvas = $<HTMLCanvasElement>('demo');
const demoCtx = demoCanvas.getContext('2d')!;
const stage = $('stage');
const frame = $('frame');
const overlay = $('overlay');
const subjectEl = $('subject');
const link = document.getElementById('link') as unknown as SVGLineElement;
const buttons = {
  scout: $<HTMLButtonElement>('scout'),
  reset: $<HTMLButtonElement>('reset'),
  capture: $<HTMLButtonElement>('capture'),
  camera: $<HTMLButtonElement>('camera'),
  flip: $<HTMLButtonElement>('flip'),
  demo: $<HTMLButtonElement>('demoBtn'),
};
const sampler = document.createElement('canvas');
const samplerCtx = sampler.getContext('2d', { willReadFrequently: true })!;

const engine = new PhotoAnalysisEngine({ memory: { sampleIntervalMs: TICK_MS } });
let source: Source = 'none';
let scouting = false;
let stream: MediaStream | null = null;
let cameraRequest = 0;
let facing: 'environment' | 'user' = 'environment';
let multipleCameras = false;
let timer: number | undefined;
let analysis: PhotoAnalysis | null = null;
/** Camera: fixed frame point (not tracked). Demo: world point that pans with the scene. */
let subjectFrame: Point | null = null;
let subjectWorld: Point | null = null;
let scene: DemoSceneId = 'golden';
let offset: Point = INITIAL_OFFSET;

const say = (text: string) => { $('message').textContent = text; };

// ---------- layout ----------

function mediaSize(): [number, number] {
  if (source === 'camera' && video.videoWidth > 0) return [video.videoWidth, video.videoHeight];
  return [DEMO_W, DEMO_H];
}
function layout() {
  const [mw, mh] = mediaSize();
  // Hug the media's shape; CSS max-height still caps tall (portrait) streams.
  const ratio = source === 'none' ? '' : `${mw} / ${mh}`;
  if (stage.style.aspectRatio !== ratio) stage.style.aspectRatio = ratio;
  const box = fitContain(stage.clientWidth, stage.clientHeight, mw, mh);
  Object.assign(frame.style, {
    left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`,
  });
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

function setSource(next: Source) {
  if (next !== 'camera') { cameraRequest++; stopTracks(); }
  source = next;
  subjectFrame = null;
  subjectWorld = null;
  analysis = null;
  engine.reset();
  video.hidden = next !== 'camera';
  demoCanvas.hidden = next !== 'demo';
  $('demoControls').hidden = next !== 'demo';
  $('empty').hidden = next !== 'none';
  frame.hidden = next === 'none';
  if (next === 'none') exitScout();
  layout();
  render();
}

async function startCamera() {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { say(INSECURE_CONTEXT_MESSAGE); return; }
  const request = ++cameraRequest;
  stopTracks();
  buttons.camera.disabled = true;
  say('Requesting camera…');
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
      if (stream === acquired) { setSource('none'); say('The camera stopped (disconnected or revoked).'); }
    });
    const wasScouting = scouting;
    setSource('camera');
    if (wasScouting) enterScout();
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      multipleCameras = devices.filter((d) => d.kind === 'videoinput').length > 1;
    } catch { multipleCameras = false; }
    say(facing === 'user'
      ? 'Front camera on. Preview is not mirrored; directions assume you are aiming the camera.'
      : 'Camera on. Frames are analysed locally and never uploaded.');
  } catch (err) {
    if (request !== cameraRequest) return;
    stopTracks();
    if (source === 'camera') setSource('none');
    say(cameraErrorMessage(err));
  } finally {
    if (request === cameraRequest) buttons.camera.disabled = false;
    render();
  }
}

function startDemo() {
  setSource('demo');
  offset = INITIAL_OFFSET;
  drawDemo();
  enterScout();
  say('Demo: a synthetic scene, not your camera. Tap the tree, then use Pan to follow the guidance.');
}

function drawDemo() {
  demoCtx.putImageData(new ImageData(renderDemoScene(scene, DEMO_W, DEMO_H, offset), DEMO_W, DEMO_H), 0, 0);
}

// ---------- scout + analysis ----------

function enterScout() {
  if (source === 'none') return;
  scouting = true;
  engine.reset();
  if (timer === undefined) timer = window.setInterval(() => tick(false), TICK_MS);
  tick(true);
}
function exitScout() {
  scouting = false;
  if (timer !== undefined) { clearInterval(timer); timer = undefined; }
  analysis = null;
  subjectFrame = null;
  subjectWorld = null;
  engine.reset();
  render();
}

function currentSubject(): Point | null {
  if (source === 'demo') return subjectWorld && worldToFrame(subjectWorld, offset);
  return subjectFrame;
}

function tick(force: boolean) {
  if (!scouting || source === 'none') return;
  const media = source === 'camera' ? video : demoCanvas;
  if (source === 'camera' && (video.readyState < 2 || video.videoWidth === 0)) return;
  const [mw, mh] = mediaSize();
  const w = ANALYSIS_WIDTH;
  const h = analysisHeight(mw, mh);
  if (sampler.width !== w || sampler.height !== h) { sampler.width = w; sampler.height = h; }
  try {
    samplerCtx.drawImage(media, 0, 0, w, h);
    const { data } = samplerCtx.getImageData(0, 0, w, h);
    analysis = analyzeRgba(engine, data, w, h, performance.now(), currentSubject(), force);
  } catch (err) {
    say(`Frame analysis failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  render();
}

frame.addEventListener('click', (e) => {
  if (!scouting) return;
  const p = clientToFrame(e.clientX, e.clientY, frame.getBoundingClientRect());
  if (!p) return;
  if (source === 'demo') subjectWorld = frameToWorld(p, offset);
  else subjectFrame = p;
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
  const ready = scouting && analysis?.guidance.ready === true;
  buttons.scout.disabled = !active || scouting;
  buttons.scout.textContent = scouting ? 'Scouting' : 'Scout';
  buttons.reset.disabled = !scouting;
  buttons.capture.disabled = !active;
  buttons.capture.textContent = ready ? 'Capture This! · Save photo' : 'Save photo';
  buttons.capture.classList.toggle('primary', ready);
  buttons.camera.textContent = source === 'camera' ? 'Stop camera' : 'Start camera';
  buttons.flip.disabled = source !== 'camera' || !multipleCameras;
  buttons.flip.title = source === 'camera' && !multipleCameras ? 'Only one camera found' : 'Switch between front and rear cameras';
  buttons.demo.textContent = source === 'demo' ? 'Exit demo' : 'Try Demo';
  document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.scene === scene));
  });

  overlay.hidden = !scouting;
  frame.classList.toggle('is-ready', ready);
  $('readyBadge').hidden = !ready;
  const badge = $('sourceBadge');
  badge.hidden = !active;
  badge.textContent = source === 'demo' ? 'Demo · simulated scene' : 'Live camera · local';
  badge.classList.toggle('demo', source === 'demo');

  const comp = scouting ? analysis?.composition : undefined;
  const known = comp && comp.status !== 'unknown' ? comp : null;
  document.querySelectorAll<HTMLElement>('.node').forEach((n) => {
    n.classList.toggle('target', known?.target.id === n.dataset.id);
  });
  subjectEl.hidden = !known;
  link.toggleAttribute('hidden', !known || known.status === 'aligned');
  if (known) {
    subjectEl.style.left = `${known.subject.x * 100}%`;
    subjectEl.style.top = `${known.subject.y * 100}%`;
    link.setAttribute('x1', String(known.subject.x * 100));
    link.setAttribute('y1', String(known.subject.y * 100));
    link.setAttribute('x2', String(known.target.x * 100));
    link.setAttribute('y2', String(known.target.y * 100));
  }

  const cue = $('cue');
  const basis = $('basis');
  $('guidancePanel').classList.toggle('is-ready', ready);
  if (!active) {
    cue.textContent = 'Start the camera or Try Demo.';
    basis.textContent = '';
  } else if (!scouting) {
    cue.textContent = 'Press Scout to show the thirds grid.';
    basis.textContent = '';
  } else if (!analysis) {
    cue.textContent = 'Waiting for the first frame…';
    basis.textContent = '';
  } else {
    cue.textContent = analysis.guidance.message;
    const parts = analysis.guidance.basis.map((b) => (b === 'lighting' ? 'measured brightness' : 'your marked subject'));
    basis.textContent = `${parts.length ? `Based on ${parts.join(' and ')}` : ''}${source === 'demo' ? ' · simulated scene' : ''}`;
  }

  if (scouting && analysis?.lighting) {
    fillList('light', lightingObservations(analysis.lighting));
    $('lightNote').textContent = source === 'demo' ? 'synthetic pixels' : 'camera pixels, auto-exposed';
  } else {
    fillList('light', [{ label: 'Status', value: active ? 'Press Scout to measure' : 'Not measured' }]);
    $('lightNote').textContent = '';
  }
  if (scouting && analysis) {
    fillList('comp', compositionObservations(analysis.composition));
  } else {
    fillList('comp', [{ label: 'Subject', value: 'Unknown' }]);
  }
  $('compNote').textContent = source === 'camera'
    ? 'No automatic subject detection. The marker stays where you tapped; tap again after moving.'
    : source === 'demo'
      ? 'No automatic subject detection. In the demo, your marked point moves with the simulated pan.'
      : 'No automatic subject detection. Tap your subject to mark it.';
}

// ---------- capture ----------

function savePhoto() {
  const media = source === 'camera' ? video : source === 'demo' ? demoCanvas : null;
  if (!media) return;
  const [w, h] = mediaSize();
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d')!.drawImage(media, 0, 0, w, h);
  out.toBlob((blob) => {
    if (!blob) { say('Could not create the photo.'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `frame-this-${source === 'demo' ? 'demo-' : ''}${stamp}.jpg`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('Photo saved by your browser to this device. Nothing was uploaded.');
  }, 'image/jpeg', 0.92);
}

// ---------- events ----------

buttons.scout.addEventListener('click', enterScout);
buttons.reset.addEventListener('click', () => { exitScout(); say('Scout reset.'); });
buttons.capture.addEventListener('click', savePhoto);
buttons.camera.addEventListener('click', () => {
  if (source === 'camera') { setSource('none'); say('Camera stopped.'); } else void startCamera();
});
$('emptyCamera').addEventListener('click', () => void startCamera());
buttons.flip.addEventListener('click', () => {
  facing = facing === 'environment' ? 'user' : 'environment';
  void startCamera();
});
const toggleDemo = () => {
  if (source === 'demo') { setSource('none'); say('Demo closed.'); } else startDemo();
};
buttons.demo.addEventListener('click', toggleDemo);
$('emptyDemo').addEventListener('click', startDemo);
document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach((b) => b.addEventListener('click', () => {
  scene = b.dataset.scene as DemoSceneId;
  drawDemo();
  tick(true);
  render();
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
window.addEventListener('pagehide', () => { cameraRequest++; stopTracks(); engine.reset(); });

setSource('none');
say('Camera frames stay on this device. Try Demo works without camera permission.');
