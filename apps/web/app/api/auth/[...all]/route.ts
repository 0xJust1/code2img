import { getAuth } from "@/lib/auth";

const handler = async (req: Request) => {
  const auth = getAuth();
  if (!auth) return Response.json({ error: "service unavailable: database not configured" }, { status: 503 });
  return auth.handler(req);
};

export { handler as GET, handler as POST };
