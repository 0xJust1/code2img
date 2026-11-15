// GET / — the landing as a plain HTML document (no React runtime: see app/site/shell.ts).
import { home } from "./site/pages";
import { send } from "./site/shell";

export function GET() {
  return send(home("en"));
}
