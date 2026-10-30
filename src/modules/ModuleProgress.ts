import type { LearningModule } from "./ModuleCatalog.ts";
/** Session-only progress. App storage persistence can be added later with consent. */
export class ModuleProgress {
  private index = 0;
  constructor(readonly module: LearningModule) {}
  current() { return this.module.steps[this.index]; }
  status() { return { index: this.index, total: this.module.steps.length, complete: this.index === this.module.steps.length - 1 }; }
  next() { if (this.index >= this.module.steps.length - 1) return false; this.index++; return true; }
  back() { if (this.index <= 0) return false; this.index--; return true; }
  restart() { this.index = 0; }
}
