import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, tables } from "@code2img/db";
import { sendEmail } from "@/lib/email";



// EN default: the site has no per-user locale (EN/FR is a URL prefix); upgrade
// when a stored user preference exists.
async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  await sendEmail(email, { kind: "magic-link", url });
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
