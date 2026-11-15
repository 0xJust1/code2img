import { languagePage } from "../../site/pages";
import { send } from "../../site/shell";

export async function GET(_req: Request, { params }: { params: Promise<{ language: string }> }) {
  const { language } = await params;
  const page = languagePage(language);
  if (!page) return new Response("Not found", { status: 404 });
  return send(page);
}
