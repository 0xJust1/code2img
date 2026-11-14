// Shiki bundled theme ids (>= 15) and monospace fonts (>= 6) shipped via @fontsource.
// Font files are served by apps/render (route /fonts/:file) and referenced from the card HTML.

export interface FontDef {
  id: string;
  label: string;
  family: string;
  package: string; // npm @fontsource package
  ligatures: boolean; // font supports programming ligatures
}

export const THEMES = [
  "github-dark",
  "github-light",
  "vitesse-dark",
  "vitesse-light",
  "one-dark-pro",
  "dracula",
  "tokyo-night",
  "night-owl",
  "material-theme-darker",
  "min-dark",
  "min-light",
  "catppuccin-mocha",
  "catppuccin-latte",
  "rose-pine",
  "rose-pine-moon",
  "nord",
  "ayu-dark",
  "synthwave-84",
] as const;

export type ThemeId = (typeof THEMES)[number];

export const FONTS: FontDef[] = [
  { id: "jetbrains-mono", label: "JetBrains Mono", family: "JetBrains Mono", package: "@fontsource/jetbrains-mono", ligatures: true },
  { id: "fira-code", label: "Fira Code", family: "Fira Code", package: "@fontsource/fira-code", ligatures: true },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", family: "IBM Plex Mono", package: "@fontsource/ibm-plex-mono", ligatures: false },
  { id: "source-code-pro", label: "Source Code Pro", family: "Source Code Pro", package: "@fontsource/source-code-pro", ligatures: false },
  { id: "roboto-mono", label: "Roboto Mono", family: "Roboto Mono", package: "@fontsource/roboto-mono", ligatures: false },
  { id: "space-mono", label: "Space Mono", family: "Space Mono", package: "@fontsource/space-mono", ligatures: false },
  { id: "cascadia-code", label: "Cascadia Code", family: "Cascadia Code", package: "@fontsource/cascadia-code", ligatures: true },
];

export function getFont(id: string): FontDef {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]!;
}

// fontsource v5 file layout: <pkg>/files/<id>-<subset>-<weight>-<style>.woff2
export function fontFiles(font: FontDef): { file: string; weight: number }[] {
  return [
    { file: `${font.id}-latin-400-normal.woff2`, weight: 400 },
    { file: `${font.id}-latin-700-normal.woff2`, weight: 700 },
  ];
}
