// GET /api/v1/{themes|languages|fonts|backgrounds} — public catalogs, IP rate-limited.
// One dynamic segment for the whole catalog: static siblings (/images, /usage, …) win.
import { FONTS, LANGUAGES, THEMES, gradientPresets, patterns } from "@code2img/shared";
import { publicGuard } from "@/lib/api/guard";
import { problem } from "@/lib/api/problem";

const CATALOGS: Record<string, () => Record<string, unknown>> = {
  themes: () => ({ themes: THEMES }),
  languages: () => ({ languages: LANGUAGES }),
  fonts: () => ({ fonts: FONTS.map(({ id, label, ligatures }) => ({ id, label, ligatures })) }),
  backgrounds: () => ({
    gradients: gradientPresets.map(({ id, name }) => ({ id, name })),
    patterns,
  }),
};

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const build = CATALOGS[kind];
  if (!build) return problem(404, "Not found", `Unknown catalog "${kind}". Try themes, languages, fonts, backgrounds.`);
  const g = await publicGuard(req);
  if (!g.ok) return g.response;
  return Response.json(build(), { headers: { ...g.headers, "cache-control": "public, max-age=3600" } });
}