import { ModuleCatalog, validateModule } from "../modules/ModuleCatalog.ts";
import { ModuleProgress } from "../modules/ModuleProgress.ts";

const CACHE_KEY = "ghost-hands:aws-s3-basics:v1";
const catalog = new ModuleCatalog();
let progress: ModuleProgress | null = null;

/** Browser-only educational module UI. No executable third-party packs. */
export function mountLearningModules(container: HTMLElement): void {
  const panel = document.createElement("section");
  panel.className = "panel module-panel";
  panel.innerHTML = `
    <div class="panel-title"><div><span class="eyebrow">03 / LEARNING PACKS</span><h2>Learning library</h2></div><span class="chip">BETA</span></div>
    <p class="muted">Download a lesson once, then review its saved instructions without a connection. AWS console tasks still require internet access.</p>
    <div class="buttons"><button id="module-install" class="primary">↓ Download AWS S3 Basics</button><button id="module-delete">Remove saved pack</button></div>
    <p id="module-status" class="muted" role="status"></p>
    <div id="module-lesson" hidden>
      <div class="step-row"><span id="module-count"></span><span>AWS S3 BASICS</span></div>
      <h3 id="module-title"></h3><p id="module-instruction" class="explanation"></p><p id="module-checkpoint" class="note"></p>
      <div class="buttons"><button id="module-back">← Back</button><button id="module-next" class="primary">Next →</button><button id="module-restart">↻ Restart</button></div>
    </div>`;
  container.append(panel);
  const node = <T extends HTMLElement>(id: string) => panel.querySelector<T>("#" + id)!;
  const status = (msg: string) => { node("module-status").textContent = msg; };
  function render(): void {
    node("module-lesson").hidden = progress === null;
    if (!progress) return;
    const current = progress.current();
    const info = progress.status();
    node("module-count").textContent = `STEP ${info.index + 1} / ${info.total}`;
    node("module-title").textContent = current.title;
    node("module-instruction").textContent = current.instruction;
    node("module-checkpoint").textContent = "Checkpoint: " + current.checkpoint;
    node<HTMLButtonElement>("module-back").disabled = info.index === 0;
    node<HTMLButtonElement>("module-next").disabled = info.complete;
  }
  function install(raw: unknown, source: string): void {
    const item = validateModule(raw);
    if (item.id !== "aws-s3-basics") throw new Error("Unexpected module ID");
    catalog.remove(item.id);
    progress = new ModuleProgress(catalog.add(item));
    status(source + ": " + item.title + " ready. Progress is session-only.");
    render();
  }
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) install(JSON.parse(cached) as unknown, "Saved pack");
  } catch {
    localStorage.removeItem(CACHE_KEY);
    status("Previously saved pack was invalid and was cleared.");
  }
  node<HTMLButtonElement>("module-install").addEventListener("click", async () => {
    const button = node<HTMLButtonElement>("module-install");
    button.disabled = true;
    status("Downloading pack…");
    try {
      const response = await fetch("/modules/aws-s3-basics.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Pack download unavailable");
      const raw: unknown = await response.json();
      const item = validateModule(raw);
      if (item.id !== "aws-s3-basics") throw new Error("Unexpected module ID");
      localStorage.setItem(CACHE_KEY, JSON.stringify(item));
      install(item, "Downloaded");
    } catch (error) {
      status(error instanceof Error ? error.message : "Couldn't download module");
    } finally { button.disabled = false; }
  });
  node<HTMLButtonElement>("module-delete").addEventListener("click", () => {
    localStorage.removeItem(CACHE_KEY);
    catalog.remove("aws-s3-basics");
    progress = null;
    status("Pack removed from this browser.");
    render();
  });
  node<HTMLButtonElement>("module-next").addEventListener("click", () => { progress?.next(); render(); });
  node<HTMLButtonElement>("module-back").addEventListener("click", () => { progress?.back(); render(); });
  node<HTMLButtonElement>("module-restart").addEventListener("click", () => { progress?.restart(); render(); });
  render();
}
