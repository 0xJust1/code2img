import { contactPage } from "../../site/pages";
import { send } from "../../site/shell";

export function GET() {
  return send(contactPage("fr"));
}
