// Heuristic language detection from code snippets. Ordered: most specific first.
// Returns a shiki language id, or "typescript" as safe default for unknown code.

const RULES: [RegExp, string][] = [
  [/^\s*def\s+\w+\s*\(.*\)\s*:|^\s*import\s+\w+$|^\s*from\s+\w+\s+import\s/m, "python"],
  [/^\s*def\s+\w+|^\s*end\s*$|puts\s+|\battr_accessor\b|\brequire\b/m, "ruby"],
  [/^\s*package\s+main\b|func\s+\w+\(|:\s*=\s*/m, "go"],
  [/\bfn\s+\w+\s*\(|\blet\s+mut\b|::<|println!\(/m, "rust"],
  [/^\s*public\s+(class|static|void)\b|\bSystem\.out\.print/m, "java"],
  [/#include\s*<|int\s+main\s*\(/m, "cpp"],
  [/\bprintf\s*\(|\bmalloc\s*\(/m, "c"],
  [/\busing\s+System\b|\bnamespace\s+\w+|Console\.Write/m, "csharp"],
  [/<\?php|\bfunction\s+\w+\s*\(/m, "php"],
  [/^\s*<html[\s>]|<!DOCTYPE html|<div|<span/mi, "html"],
  [/@media|:\s*\w+\s*;|^\s*\.[\w-]+\s*\{/m, "css"],
  [/^\s*SELECT\b|\bFROM\b\s+\w+|\bWHERE\b|\bJOIN\b/im, "sql"],
  [/^\s*[{}[\]]|\basync\s+function\b|=>\s*\{|\bconst\b|\blet\b|console\./m, "javascript"],
  [/^\s*(interface|type)\s+\w+|:\s*(string|number|boolean)\b|\bimport\s+type\b/m, "typescript"],
  [/^\s*---\s*$|^\s*[\w.-]+:\s*\S+$/m, "yaml"],
  [/^\s*[{[][\s\S]*[}\]]\s*$/, "json"],
  [/#!\s*\/(bin|usr)\/(ba)?sh|\becho\b\s+\$|^\s*(apt|curl|cd|mkdir|export)\s/m, "shell"],
];

/** Every language a rule can return. "auto" and "text" are values of the API, not detected
 *  languages, so the marketing count reads this and not LANGUAGES.length. */
export const DETECTED_LANGUAGES = [...new Set(RULES.map(([, lang]) => lang))];

export const LANGUAGES = [
  "auto", "typescript", "javascript", "python", "go", "rust", "java", "c", "cpp", "csharp",
  "php", "ruby", "html", "css", "sql", "json", "yaml", "shell", "text",
] as const;

export function detectLanguage(code: string): string {
  for (const [re, lang] of RULES) if (re.test(code)) return lang;
  return "typescript";
}
