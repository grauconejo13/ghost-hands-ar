/** Portable, read-only learning pack format. No executable content in packs. */
export type LearningStep = Readonly<{ id: string; title: string; instruction: string; checkpoint: string }>;
export type LearningModule = Readonly<{
  schemaVersion: 1;
  id: string;
  title: string;
  summary: string;
  category: "cloud" | "electronics" | "outdoors" | "other";
  requiresInternet: boolean;
  steps: readonly LearningStep[];
}>;
export function validateModule(value: unknown): LearningModule {
  if (!value || typeof value !== "object") throw new Error("Module must be an object");
  const m = value as Record<string, unknown>;
  const text = (v: unknown, limit = 500) => typeof v === "string" && v.trim().length > 0 && v.length <= limit;
  if (m.schemaVersion !== 1 || !text(m.id, 80) || !/^[a-z0-9-]+$/.test(m.id as string) ||
      !text(m.title, 120) || !text(m.summary, 500) ||
      !["cloud", "electronics", "outdoors", "other"].includes(String(m.category)) ||
      typeof m.requiresInternet !== "boolean" || !Array.isArray(m.steps) ||
      m.steps.length < 1 || m.steps.length > 40) throw new Error("Invalid module manifest");
  const seen = new Set<string>();
  for (const raw of m.steps) {
    if (!raw || typeof raw !== "object") throw new Error("Invalid lesson step");
    const s = raw as Record<string, unknown>;
    if (!text(s.id, 80) || !/^[a-z0-9-]+$/.test(s.id as string) ||
        !text(s.title, 120) || !text(s.instruction, 1500) || !text(s.checkpoint, 500) || seen.has(s.id as string)) {
      throw new Error("Invalid or duplicate lesson step");
    }
    seen.add(s.id as string);
  }
  // A normalized copy prevents caller mutations from changing catalog content.
  return {
    schemaVersion: 1, id: m.id as string, title: m.title as string,
    summary: m.summary as string, category: m.category as LearningModule["category"],
    requiresInternet: m.requiresInternet as boolean,
    steps: (m.steps as LearningStep[]).map(s => ({
      id: s.id, title: s.title, instruction: s.instruction, checkpoint: s.checkpoint
    }))
  };
}
export class ModuleCatalog {
  private readonly modules = new Map<string, LearningModule>();
  add(raw: unknown): LearningModule {
    const module = validateModule(raw);
    if (this.modules.has(module.id)) throw new Error("Module already installed");
    this.modules.set(module.id, module);
    return module;
  }
  list(): LearningModule[] { return Array.from(this.modules.values()); }
  get(id: string): LearningModule | undefined { return this.modules.get(id); }
  remove(id: string): boolean { return this.modules.delete(id); }
}
