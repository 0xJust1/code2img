import { createHash } from "node:crypto";
import { Queue, Worker, type Job } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import { normalizeConfig, cardConfigSchema } from "@code2img/shared";
import { renderImage, type RenderRequest, type RenderResult } from "./render.js";

export type { RenderRequest, RenderResult };
import { cacheGet, cacheSet } from "./cache.js";

const CACHE_TTL_MS = 24 * 3600 * 1000;
const connection: ConnectionOptions | undefined = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : undefined;

// Trusted requests (internal token from the web app, which owns entitlement checks)
// may carry `attachments`: data URLs for uploaded logo/background keyed by filename.
export interface RenderBody extends RenderRequest {
  attachments?: Record<string, string>;
}

export function parseRenderBody(body: unknown, trusted = false): RenderBody {
  const raw = body as {
    config?: unknown;
    format?: string;
    scale?: number;
    quality?: number;
    attachments?: Record<string, string>;
  };
  let config = normalizeConfig(raw.config);
  if (!trusted) {
    // Free tier: watermark always on, 2x max, no uploaded assets. Server-side enforced.
    config = { ...config, watermark: true };
    if (config.logo) delete config.logo;
    if (config.background.type === "image") config = { ...config, background: { type: "solid", color: "#1e1e2e" } };
  }
  const format = (["png", "jpg", "pdf"] as const).includes(raw.format as never) ? (raw.format as RenderRequest["format"]) : "png";
  const scale = (["1", "2", "3", "4"] as const).includes(String(raw.scale) as never)
    ? (raw.scale as RenderRequest["scale"])
    : 2;
  const capped = (trusted ? scale : Math.min(scale, 2)) as RenderRequest["scale"];
  const quality = typeof raw.quality === "number" ? raw.quality : 90;
  const attachments = trusted && raw.attachments ? raw.attachments : undefined;
  return { config, format, scale: capped, quality, attachments };
}

export function requestKey(req: RenderRequest & { attachments?: Record<string, string> }): string {
  return createHash("sha256")
    .update(JSON.stringify([req.config, req.format, req.scale, req.format === "jpg" ? req.quality : 0, req.attachments ?? null]))
    .digest("hex");
}

export async function doRender(req: RenderBody, selfOrigin: string): Promise<RenderResult> {
  // Normalize once here too: direct callers (tests, queue) get schema defaults applied.
  const safe: RenderBody = { ...req, config: cardConfigSchema.parse(req.config) };
  const key = requestKey(safe);
  const cached = cacheGet<RenderResult>(key);
  if (cached) return cached;
  const result = await renderImage(safe, selfOrigin);
  cacheSet(key, result, CACHE_TTL_MS);
  return result;
}

// ---- Optional BullMQ transport. Without REDIS_URL the render is done inline (same code path). ----
const QUEUE_NAME = "renders";

let queue: Queue | null = null;
let worker: Worker | null = null;

// Buffers don't survive JSON serialization through Redis: ship base64, rehydrate at the edge.
const serialize = (r: RenderResult) => ({ ...r, buf: r.buf.toString("base64") });
const deserialize = (r: RenderResult) => ({ ...r, buf: Buffer.from(r.buf as unknown as string, "base64") });

function ensureWorker(selfOrigin: string): { queue: Queue; worker: Worker } {
  if (!queue || !worker) {
    queue = new Queue(QUEUE_NAME, { connection: connection! });
    worker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        const { req, origin } = job.data as { req: RenderRequest; origin: string };
        return serialize(await doRender(req, origin === "" ? selfOrigin : origin));
      },
      { connection: connection!, concurrency: 2, lockDuration: 30_000 },
    );
  }
  return { queue, worker };
}

export async function submitRender(req: RenderRequest, selfOrigin: string): Promise<RenderResult> {
  if (!connection) return doRender(req, selfOrigin);
  const { queue, worker } = ensureWorker(selfOrigin);
  await worker.waitUntilReady();
  const job = await queue.add("render", { req, origin: selfOrigin }, { attempts: 1 });
  // Resolve on this job's completion event (simpler and typed tighter than QueueEvents).
  const result = await new Promise<RenderResult>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("queue timeout")), 20_000);
    const onCompleted = (done: Job | undefined) => {
      if (!done || done.id !== job.id) return;
      cleanup();
      resolve(deserialize(done.returnvalue as RenderResult));
    };
    const onFailed = (failed: Job | undefined) => {
      if (!failed || failed.id !== job.id) return;
      cleanup();
      reject(new Error(failed.failedReason ?? "render failed"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      worker.off("completed", onCompleted);
      worker.off("failed", onFailed);
    };
    worker.on("completed", onCompleted);
    worker.on("failed", onFailed);
  });
  return result;
}

export async function shutdownQueue(): Promise<void> {
  if (worker) await worker.close();
  if (queue) await queue.close();
}
