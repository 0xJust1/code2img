import { z } from "zod";

// Free-tier backgrounds: gradient presets, solid color, mesh, patterns, transparent.

export const gradientPresets = [
  { id: "sunset", name: "Sunset", css: "linear-gradient(135deg, #ff9966, #ff5e62)" },
  { id: "ocean", name: "Ocean", css: "linear-gradient(135deg, #2e3192, #1bffff)" },
  { id: "grape", name: "Grape", css: "linear-gradient(135deg, #654ea3, #da98ce)" },
  { id: "forest", name: "Forest", css: "linear-gradient(135deg, #134e5e, #71b280)" },
  { id: "candy", name: "Candy", css: "linear-gradient(135deg, #f953c6, #b91d73)" },
  { id: "midnight", name: "Midnight", css: "linear-gradient(135deg, #0f2027, #2c5364)" },
  { id: "peach", name: "Peach", css: "linear-gradient(135deg, #ffe259, #ffa751)" },
  { id: "steel", name: "Steel", css: "linear-gradient(135deg, #232526, #414345)" },
  { id: "aurora", name: "Aurora", css: "linear-gradient(135deg, #00c9ff, #92fe9d)" },
  { id: "blush", name: "Blush", css: "linear-gradient(135deg, #ee9ca7, #ffdde1)" },
] as const;

export const patterns = ["dots", "grid", "stripes"] as const;

export const UPLOAD_FILE_RE = /^[\w-]+\.(png|jpe?g|webp)$/;

// { type: "image", file } is a Pro-only background: `file` is a stored upload filename.
// The bytes are never in the schema — callers resolve them into `attachments` (data URLs)
// which are honored only for trusted requests (see render pipeline).
export const backgroundSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("image"), file: z.string().max(80).regex(UPLOAD_FILE_RE) }),
  z.object({ type: z.literal("gradient"), preset: z.string() }),
  z.object({ type: z.literal("solid"), color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/) }),
  z.object({ type: z.literal("mesh"), colors: z.array(z.string().regex(/^#[0-9a-fA-F]{3,8}$/)).min(2).max(5) }),
  z.object({ type: z.literal("pattern"), pattern: z.enum(patterns), color: z.string().regex(/^#[0-9a-fA-F]{3,8}$/), base: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).default("#1e1e2e") }),
  z.object({ type: z.literal("transparent") }),
]);

export type Background = z.infer<typeof backgroundSchema>;

export function backgroundCss(bg: Background): string {
  switch (bg.type) {
    case "solid":
      return bg.color;
    case "gradient": {
      const p = gradientPresets.find((g) => g.id === bg.preset) ?? gradientPresets[0]!;
      return p.css;
    }
    case "mesh": {
      const [a = "#ff9966", b = "#654ea3", c = "#1bffff"] = bg.colors;
      return [
        `radial-gradient(at 20% 25%, ${a} 0px, transparent 55%)`,
        `radial-gradient(at 80% 20%, ${b} 0px, transparent 50%)`,
        `radial-gradient(at 70% 80%, ${c} 0px, transparent 55%)`,
        `radial-gradient(at 15% 85%, ${b} 0px, transparent 50%)`,
      ].join(", ");
    }
    case "pattern": {
      const c = bg.color;
      const images = {
        dots: `radial-gradient(${c} 1.5px, transparent 1.5px)`,
        grid: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        stripes: `repeating-linear-gradient(45deg, ${c} 0 10px, transparent 10px 20px)`,
      } as const;
      const sizes = { dots: "22px 22px", grid: "24px 24px", stripes: "auto" } as const;
      return `${bg.base}; background-image: ${images[bg.pattern]}; background-size: ${sizes[bg.pattern]}`;
    }
    case "transparent":
      return "transparent";
    // Image backgrounds are resolved by the caller (attachments); this is only a neutral fallback
    // for previews without the upload bytes.
    case "image":
      return "#1e1e2e";
  }
}
