// Current user profile + effective entitlements (drives dashboard UI state).
import { currentUserFor, entitlementsOf, serviceUnavailable } from "@/lib/session";

export async function GET(req: Request) {
  const db = (await import("@code2img/db")).getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ user: null });
  return Response.json({
    user: { id: user.id, email: user.email, name: user.name },
    entitlements: entitlementsOf(user),
  });
}
