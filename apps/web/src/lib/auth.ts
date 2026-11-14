import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, tables } from "@code2img/db";



async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    // Dev/test mode: no SMTP configured — the link lands in the service logs.
    console.log(`[auth] magic link for ${email}: ${url}`);
    return;
  }
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "Code2Img <no-reply@code2img.app>",
    to: email,
    subject: "Your Code2Img sign-in link",
    text: `Sign in: ${url}\nThis link expires in 5 minutes.`,
  });
}

// Only available once DATABASE_URL is set; without it the web app stays in
// Phase 1 mode and auth routes answer 503.
export function getAuth() {
  const db = getDb();
  if (!db) return null;
  return betterAuth({
    appName: "Code2Img",
    secret: process.env.AUTH_SECRET,
    baseURL: process.env.APP_URL ?? "http://localhost:3335",
    trustedOrigins: [process.env.APP_URL ?? "http://localhost:3335"],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: tables.users,
        session: tables.sessions,
        account: tables.accounts,
        verification: tables.verifications,
      },
    }),
    socialProviders: {
      // Configurable but disabled by default: present only when credentials exist.
      ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
        : {}),
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
        : {}),
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => sendMagicLinkEmail(email, url),
        expiresIn: 300,
      }),
    ],
    user: {
      deleteUser: {
        enabled: true,
        // RGPD hard delete: FK cascades remove sessions/accounts/presets/uploads/keys/images.
      },
    },
  });
}
