import { comparisonPage } from "../../site/pages";
import { send } from "../../site/shell";

export async function GET(_req: Request, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const page = comparisonPage(tool);
  if (!page) return new Response("Not found", { status: 404 });
  return send(page);
}
