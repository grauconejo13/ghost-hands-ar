/**
 * Camera-independent visual-change gate and ephemeral session memory.
 * Only compact grayscale thumbnails are retained, never raw camera images.
 * A future camera adapter must request user permission before producing them.
 */
export type GrayFrame = Readonly<{
  timestampMs: number;
  width: number;
  height: number;
  pixels: Uint8Array;
}>;
export type FrameDecision = Readonly<{
  accepted: boolean;
  reason: "first" | "changed" | "duplicate" | "rate-limited" | "heartbeat";
  changeScore: number;
}>;
export type FrameRecord = Readonly<{
  timestampMs: number;
  changeScore: number;
  thumbnail: Uint8Array;
}>;
export type FrameMemoryOptions = Readonly<{
  sampleIntervalMs?: number;
  maxAgeMs?: number;
  maxFrames?: number;
  changeThreshold?: number;
  heartbeatMs?: number;
}>;

export class FrameMemory {
  private records: FrameRecord[] = [];
  private lastSample: GrayFrame | null = null;
  private lastAcceptedMs = Number.NEGATIVE_INFINITY;
  private lastObservedMs = Number.NEGATIVE_INFINITY;
  readonly options: Required<FrameMemoryOptions>;

  constructor(options: FrameMemoryOptions = {}) {
    this.options = {
      sampleIntervalMs: options.sampleIntervalMs ?? 1000,
      maxAgeMs: options.maxAgeMs ?? 120000,
      maxFrames: options.maxFrames ?? 20,
      changeThreshold: options.changeThreshold ?? 0.07,
      heartbeatMs: options.heartbeatMs ?? 30000,
    };
    if (this.options.sampleIntervalMs <= 0 || this.options.maxAgeMs <= 0 ||
      !Number.isInteger(this.options.maxFrames) || this.options.maxFrames <= 0 ||
      this.options.changeThreshold < 0 || this.options.changeThreshold > 1 ||
      this.options.heartbeatMs <= 0) {
      throw new Error("Invalid frame memory settings");
    }
  }

  observe(frame: GrayFrame, force = false): FrameDecision {
    if (frame.width <= 0 || frame.height <= 0 ||
      frame.pixels.length !== frame.width * frame.height ||
      !Number.isFinite(frame.timestampMs) || frame.timestampMs < this.lastObservedMs) {
      throw new Error("Invalid or out-of-order frame");
    }
    this.expire(frame.timestampMs);
    this.lastObservedMs = frame.timestampMs;

    if (!force && this.lastSample !== null &&
      frame.timestampMs - this.lastSample.timestampMs < this.options.sampleIntervalMs) {
      return { accepted: false, reason: "rate-limited", changeScore: 0 };
    }
    const prior = this.lastSample;
    const compatible = prior !== null && prior.width === frame.width && prior.height === frame.height;
    let score = 1;
    if (compatible && prior !== null) {
      let total = 0;
      for (let i = 0; i < frame.pixels.length; i++) {
        total += Math.abs(frame.pixels[i] - prior.pixels[i]);
      }
      score = total / (frame.pixels.length * 255);
    }
    this.lastSample = { ...frame, pixels: new Uint8Array(frame.pixels) };

    const heartbeat = frame.timestampMs - this.lastAcceptedMs >= this.options.heartbeatMs;
    if (compatible && score < this.options.changeThreshold && !heartbeat && !force) {
      return { accepted: false, reason: "duplicate", changeScore: score };
    }
    const reason: FrameDecision["reason"] = prior === null ? "first" :
      heartbeat && score < this.options.changeThreshold && !force ? "heartbeat" : "changed";
    this.records.push({
      timestampMs: frame.timestampMs,
      changeScore: score,
      thumbnail: new Uint8Array(frame.pixels),
    });
    this.lastAcceptedMs = frame.timestampMs;
    this.trim();
    return { accepted: true, reason, changeScore: score };
  }

  snapshot(nowMs?: number): readonly FrameRecord[] {
    if (nowMs !== undefined) this.expire(nowMs);
    return this.records.map((record) => ({
      ...record,
      thumbnail: new Uint8Array(record.thumbnail),
    }));
  }

  clear(): void {
    this.records = [];
    this.lastSample = null;
    this.lastAcceptedMs = Number.NEGATIVE_INFINITY;
    this.lastObservedMs = Number.NEGATIVE_INFINITY;
  }

  private expire(nowMs: number): void {
    this.records = this.records.filter((r) => nowMs - r.timestampMs <= this.options.maxAgeMs);
  }

  private trim(): void {
    if (this.records.length > this.options.maxFrames) {
      this.records.splice(0, this.records.length - this.options.maxFrames);
    }
  }
}
