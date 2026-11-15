import { blogPost } from "../../site/pages";
import { send } from "../../site/shell";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = blogPost(slug);
  if (!page) return new Response("Not found", { status: 404 });
  return send(page);
}
