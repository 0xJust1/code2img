// Pro-only asset uploads (logo / custom background). Stored on local disk.
import { getDb } from "@code2img/db";
import { can } from "@code2img/shared";
import { currentUserFor, planOf, serviceUnavailable } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return serviceUnavailable();
  const user = await currentUserFor(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!can(planOf(user), "custom-logo")) {
    return Response.json({ error: "pro plan required" }, { status: 402 });
  }
  const result = await saveUpload(db, user.id, await req.formData().catch(() => null));
  if (!result.ok) return Response.json({ error: result.detail }, { status: result.status });
  return Response.json({ id: result.id, file: result.file, kind: result.kind });
}
