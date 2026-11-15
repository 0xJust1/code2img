import { legalPage } from "../../site/pages";
import { send } from "../../site/shell";

export function GET() {
  return send(legalPage("terms"));
}
