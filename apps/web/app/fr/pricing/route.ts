import { pricingPage } from "../../site/pages";
import { send } from "../../site/shell";

export function GET() {
  return send(pricingPage("fr"));
}
