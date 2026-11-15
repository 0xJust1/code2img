// GET /fr — the French landing. Same template, same render pipeline, French copy.
import { home } from "../site/pages";
import { send } from "../site/shell";

export function GET() {
  return send(home("fr"));
}
