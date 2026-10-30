import { LessonController } from '../core/LessonController.ts';
import { FrameMemory } from '../vision/FrameMemory.ts';
import './style.css';
import { mountLearningModules } from './LearningModulesUI.ts';

const lesson = new LessonController();
const memory = new FrameMemory();
let stream: MediaStream | null = null;
let interval: number | undefined;
let facing: 'environment' | 'user' = 'environment';
let fps = 1;
let sampled = 0, kept = 0, discarded = 0;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<div class="shell">
<header><div class="brand"><span class="logo">✦</span><div><strong>GHOST HANDS</strong><small>VISUAL LEARNING LAB / v0.1</small></div></div><span class="status" id="status">● Camera offline</span></header>
<main><section class="hero"><span class="eyebrow">EXPLORE / OBSERVE / LEARN</span><h1>See the next <em>step.</em></h1><p>A privacy-first preview of our AR learning assistant. Watch how Ghost Hands samples a camera, remembers meaningful changes and guides a lesson.</p></section>
<div class="layout">
<section class="panel"><div class="panel-title"><div><span class="eyebrow">01 / LIVE INPUT</span><h2>Visual workspace</h2></div><span class="chip">LOCAL ONLY</span></div>
<div class="viewfinder"><video id="video" autoplay playsinline muted></video><div class="reticle">⌜　　　　　　　　　⌝<br><br><br>⌞　　　　　　　　　⌟</div><div class="empty" id="empty"><span>◎</span><strong>Your perspective begins here</strong><p>Enable your camera to start observing frames.</p></div><span id="live" class="live">● LIVE</span></div>
<div class="buttons"><button id="start" class="primary">▶ Start camera</button><button id="stop" disabled>■ Stop</button><button id="flip" disabled>⇄ Flip</button><button id="snap" disabled>◉ Capture now</button></div>
<p id="message" class="muted" role="status">Your camera stays on your device. Only temporary grayscale thumbnails are retained in memory.</p>
<div class="rate"><label for="fps">Sampling rate <b id="rate">1 FPS</b></label><input id="fps" type="range" min="1" max="5" value="1"></div>
<div class="metrics"><div><b id="sampled">0</b><small>SAMPLED</small></div><div><b id="kept">0</b><small>RETAINED</small></div><div><b id="discarded">0</b><small>DISCARDED</small></div><div><b id="stored">0</b><small>IN MEMORY</small></div></div>
<div class="log-head"><strong>Frame activity</strong><button id="clear" class="link">Clear session</button></div><pre id="log">No frames sampled yet.</pre></section>
<section class="panel"><div class="panel-title"><div><span class="eyebrow">02 / GUIDED LEARNING</span><h2>Light It Up!</h2></div><span class="chip">DEMO LESSON</span></div>
<div class="step-row"><span id="progress-label">STEP 01 / 05</span><span id="step-id">PREPARE</span></div><div class="progress"><div id="bar"></div></div>
<div class="board"><div class="rail upper"></div><div id="holes" class="holes"></div><div class="rail lower"></div><svg viewBox="0 0 320 180" aria-label="Illustrative breadboard, not a wiring diagram"><path id="wire" d="M115 90 H80 V34 H40 M226 90 H258 V146 H281" stroke="#40c4ec" stroke-width="4" fill="none" stroke-dasharray="8 6"/><g id="led"><path d="M145 90 V64 M162 90 V64" stroke="#e2edf6" stroke-width="3"/><path d="M137 65 Q137 35 153 35 Q170 35 170 65 Z" fill="#20ccc0" stroke="#8af9ed" stroke-width="2"/><circle id="glow" cx="153" cy="48" r="29" fill="#f6ca4c" opacity=".5"/></g><g id="resistor"><path d="M205 88 V73 H252 V88" stroke="#e6bf7f" stroke-width="3" fill="none"/><rect x="213" y="64" width="30" height="18" rx="5" fill="#e4b57e"/><path d="M220 65 V81 M229 65 V81 M237 65 V81" stroke="#84552f" stroke-width="2"/></g></svg></div>
<h3 id="title"></h3><p id="instruction" class="explanation"></p><p class="note" id="hint"></p>
<div class="buttons"><button id="back">← Back</button><button class="primary" id="next">Next step →</button><button id="restart" class="link">↻ Restart</button></div><p class="muted">Simulation only. Physical wiring and electrical safety are not verified.</p></section></div></main>
<footer>GHOST HANDS · LEARN AR WITH SPECS · BROWSER PREVIEW, NOT THE SPECS LENS</footer></div>`;
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const video = el<HTMLVideoElement>('video');
const canvas = document.createElement('canvas');
canvas.width = 32; canvas.height = 24;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const activity: string[] = [];
function log(msg: string) {
  activity.unshift(new Date().toLocaleTimeString() + '   ' + msg);
  activity.splice(5);
  el('log').textContent = activity.join('\n');
}
function updateCounts() {
  el('sampled').textContent = String(sampled);
  el('kept').textContent = String(kept);
  el('discarded').textContent = String(discarded);
  el('stored').textContent = String(memory.snapshot().length);
}
function sample(force = false) {
  if (!stream || !ctx || video.readyState < 2) return;
  try {
    ctx.drawImage(video, 0, 0, 32, 24);
    const rgba = ctx.getImageData(0, 0, 32, 24).data;
    const pixels = new Uint8Array(32 * 24);
    for (let i = 0; i < pixels.length; i++) pixels[i] = Math.round(rgba[i*4]*.299 + rgba[i*4+1]*.587 + rgba[i*4+2]*.114);
    sampled++;
    const result = memory.observe({ timestampMs: Date.now(), width: 32, height: 24, pixels }, force);
    if (result.accepted) { kept++; log(result.reason + ' / change ' + (result.changeScore*100).toFixed(1) + '%'); }
    else { discarded++; if (discarded % 5 === 1) log('filtered / ' + result.reason); }
    updateCounts();
  } catch (err) { el('message').textContent = 'Frame error: ' + String(err); }
}
function schedule() { if (interval !== undefined) clearInterval(interval); interval = window.setInterval(() => sample(), 1000 / fps); }
function setActive(active: boolean) {
  for (const id of ['stop','flip','snap']) (el(id) as HTMLButtonElement).disabled = !active;
  (el('start') as HTMLButtonElement).disabled = active;
  el('empty').style.display = active ? 'none' : 'flex';
  el('live').style.display = active ? 'block' : 'none';
  el('status').textContent = active ? '● Camera active' : '● Camera offline';
  el('status').classList.toggle('active', active);
}
function stop() {
  if (interval !== undefined) { clearInterval(interval); interval = undefined; }
  if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
  video.srcObject = null;
  setActive(false);
}
async function start() {
  if (!navigator.mediaDevices?.getUserMedia) { el('message').textContent = 'Camera access requires HTTPS or localhost and a compatible browser.'; return; }
  stop();
  try {
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    stream = acquired;
    video.srcObject = acquired;
    acquired.getVideoTracks().forEach(t => t.addEventListener('ended', () => { if (stream === acquired) stop(); }));
    await video.play();
    setActive(true); schedule(); sample(true);
    el('message').textContent = 'Camera active. Frame analysis is local; no images are uploaded.';
  } catch (err) { stop(); el('message').textContent = 'Camera unavailable: ' + (err instanceof Error ? err.message : String(err)); }
}
el('start').addEventListener('click', () => void start());
el('stop').addEventListener('click', stop);
el('flip').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; void start(); });
el('snap').addEventListener('click', () => sample(true));
el('fps').addEventListener('input', (e) => {
  fps = Number((e.target as HTMLInputElement).value);
  el('rate').textContent = fps + ' FPS';
  if (stream) schedule();
});
el('clear').addEventListener('click', () => {
  memory.clear(); sampled = kept = discarded = 0; activity.length = 0;
  el('log').textContent = 'Session cleared.'; updateCounts();
});
el('holes').innerHTML = Array.from({ length: 90 }, () => '<i></i>').join('');
function updateLesson() {
  const s = lesson.getSnapshot(), v = s.step.visuals;
  el('progress-label').textContent = 'STEP ' + String(s.index+1).padStart(2,'0') + ' / ' + String(s.total).padStart(2,'0');
  el('step-id').textContent = s.step.id.toUpperCase();
  el('bar').style.width = (100*(s.index+1)/s.total) + '%';
  el('title').textContent = s.step.title; el('instruction').textContent = s.step.instruction;
  el('hint').textContent = s.step.hint;
  el('led').style.display = v.visibleComponents.includes('led') ? '' : 'none';
  el('resistor').style.display = v.visibleComponents.includes('resistor') ? '' : 'none';
  el('wire').style.display = v.showConnectionPath ? '' : 'none';
  el('glow').style.display = v.virtualLedLit ? '' : 'none';
  (el('back') as HTMLButtonElement).disabled = !s.canGoBack;
  (el('next') as HTMLButtonElement).disabled = !s.canGoNext;
}
lesson.subscribe(updateLesson);
el('back').addEventListener('click', () => lesson.back());
el('next').addEventListener('click', () => lesson.next());
el('restart').addEventListener('click', () => lesson.restart());
window.addEventListener('pagehide', () => { stop(); memory.clear(); });
setActive(false);
updateCounts();

mountLearningModules(document.querySelector('main')!);
