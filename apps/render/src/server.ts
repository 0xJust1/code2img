import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import Fastify from "fastify";
import { FONTS, decodePreset } from "@code2img/shared";
import { parseRenderBody, submitRender } from "./pipeline.js";
import { closeBrowser } from "./render.js";

const PORT = Number(process.env.PORT ?? 3002);
const HOST = process.env.HOST ?? "0.0.0.0";
export const SELF_ORIGIN = process.env.SELF_ORIGIN ?? `http://127.0.0.1:${PORT}`;

const app = Fastify({ logger: true, bodyLimit: 300_000, trustProxy: true });

app.get("/healthz", async () => ({ ok: true }));

// GET /render/:presetB64url — stateless render from an encoded preset (used for OG/debug).
// Config comes from the URL, so all limits apply (50 KB code enforced by the schema).
app.get("/render/:preset", async (req, reply) => {
  const { preset } = req.params as { preset: string };
  const config = decodePreset(preset);
  if (!config) return reply.code(400).send({ error: "invalid preset" });
  const result = await submitRender({ config, format: "png", scale: 2, quality: 90 }, SELF_ORIGIN);
  return reply.header("content-type", result.mime).send(result.buf);
});

app.post("/render", async (req, reply) => {
  let parsed;
  try {
    parsed = parseRenderBody(req.body);
  } catch (err) {
    return reply.code(400).send({ error: (err as Error).message });
  }
  try {
    const result = await submitRender(parsed, SELF_ORIGIN);
    return reply
      .header("content-type", result.mime)
      .header("cache-control", "public, max-age=86400, immutable")
      .send(result.buf);
  } catch (err) {
    req.log.error(err);
    return reply.code(504).send({ error: `render failed or timed out: ${(err as Error).message}` });
  }
});

// Self-hosted fonts (no external requests from the sandboxed browser).
app.get("/fonts/:file", async (req, reply) => {
  const { file } = req.params as { file: string };
  if (!/^[\w-]+\.woff2$/.test(file)) return reply.code(400).send({ error: "bad font file" });
  const font = FONTS.find((f) => file.startsWith(`${f.id}-`));
  if (!font) return reply.code(404).send({ error: "unknown font" });
  const abs = path.join(process.cwd(), "node_modules", font.package, "files", file);
  if (!existsSync(abs)) return reply.code(404).send({ error: "font file missing" });
  return reply
    .header("content-type", "font/woff2")
    .header("cache-control", "public, max-age=31536000, immutable")
    .send(createReadStream(abs));
});

const start = async () => {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    await app.close();
    await closeBrowser();
    process.exit(0);
  });
}

void start();
