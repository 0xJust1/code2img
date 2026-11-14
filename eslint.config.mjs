import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/next-env.d.ts", "**/.next/**", "**/node_modules/**", "**/test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
