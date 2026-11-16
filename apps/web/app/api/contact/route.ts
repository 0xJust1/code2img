import { consumeAll, limitHeaders } from "@/lib/api/ratelimit";

const CONTACT_LIMIT = 5;
const CONTACT_WINDOW = 3600; // 1 hour

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[0]?.trim() ?? "unknown";
  }
  return "unknown";
}

function sanitize(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = await consumeAll(
    [
      { id: `rl:contact:${ip}:hour`, limit: CONTACT_LIMIT, windowSeconds: CONTACT_WINDOW },
      { id: `rl:contact:global:min`, limit: 30, windowSeconds: 60 },
    ],
    Date.now(),
  );
  if (!rl.allowed) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429, headers: limitHeaders(rl) });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  // Honeypot: bots fill this; humans don't see it.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    // Silently accept so the bot thinks it worked.
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "support";

  if (!name || name.length > 100) {
    return Response.json({ error: !name ? "Name is required." : "Name is too long." }, { status: 400 });
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: !email ? "Email is required." : "Invalid email address." }, { status: 400 });
  }
  if (!message || message.length > 5000) {
    return Response.json({ error: !message ? "Message is required." : "Message is too long." }, { status: 400 });
  }
  if (topic !== "support" && topic !== "hello") {
    return Response.json({ error: "Invalid topic." }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  if (!host) {
    return Response.json({ error: "contact temporarily unavailable" }, { status: 503 });
  }

  const from = process.env.SMTP_FROM ?? "Code2Img <support@code2img.app>";
  const to = topic === "support" ? "support@code2img.app" : "hello@code2img.app";
  const subject = topic === "support"
    ? `[Code2Img Support] Message from ${name}`
    : `[Code2Img Partners] Message from ${name}`;

  const html = `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55;color:#16171a;background:#f7f7f8;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #ebebee;border-radius:12px;padding:32px">
<h2 style="margin:0 0 12px;font-size:18px;font-weight:600">${sanitize(subject)}</h2>
<p style="margin:0 0 8px"><strong>From:</strong> ${sanitize(name)} &lt;${sanitize(email)}&gt;</p>
<p style="margin:0 0 8px"><strong>Topic:</strong> ${sanitize(topic)}</p>
<hr style="border:0;border-top:1px solid #ebebee;margin:16px 0">
<p style="margin:0;white-space:pre-wrap">${sanitize(message)}</p>
</div>
</body></html>`;

  const text = `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`;

  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({ from, to, replyTo: email, subject, text, html });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "contact temporarily unavailable" }, { status: 503 });
  }
}
