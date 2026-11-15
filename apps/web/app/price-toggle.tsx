// Pricing cards. The billing toggle is a radio group, so the swap costs no JavaScript:
// the prices are in the markup and CSS shows the one the checked input selects.
import type { ReactNode } from "react";

function Price({
  monthly,
  yearly,
  noteMonthly,
  noteYearly,
}: {
  monthly: number;
  yearly: number;
  noteMonthly: string;
  noteYearly: string;
}) {
  return (
    <>
      <div className="amount price-monthly">
        {monthly} € <span>{noteMonthly}</span>
      </div>
      <div className="amount price-yearly">
        {yearly} € <span>{noteYearly}</span>
      </div>
    </>
  );
}

export default function PriceToggle({
  monthly,
  yearly,
}: {
  monthly: number;
  yearly: number;
  children?: ReactNode;
}) {
  return (
    <div className="price-block">
      <div className="toggle">
        <input type="radio" name="billing" id="billing-monthly" defaultChecked />
        <label htmlFor="billing-monthly">Monthly</label>
        <input type="radio" name="billing" id="billing-yearly" />
        <label htmlFor="billing-yearly">Annual</label>
      </div>

      <div className="plans">
        <section className="plan" aria-labelledby="plan-free">
          <div className="plan-head">
            <h3 id="plan-free">Free</h3>
            <div className="amount">
              0 € <span>forever</span>
            </div>
          </div>
          <a className="btn btn-primary btn-lg" href="/editor">
            Open the editor
          </a>
          <ul>
            <li>PNG, JPG and PDF export up to 2×</li>
            <li>18 themes, 7 code fonts, every language Shiki knows</li>
            <li>Public share links with an OG image</li>
            <li>10 saved presets</li>
            <li>API: 30 requests a minute, 500 a day</li>
            <li>Watermarked with code2img.app</li>
          </ul>
        </section>

        <section className="plan pro" aria-labelledby="plan-pro">
          <div className="plan-head">
            <h3 id="plan-pro">Pro</h3>
            <Price monthly={monthly} yearly={yearly} noteMonthly="per month" noteYearly="per year, billed once" />
          </div>
          <a className="btn btn-primary btn-lg" href="/login">
            Get Pro
          </a>
          <ul>
            <li>Export at 4× with no watermark</li>
            <li>Your own logo and background images</li>
            <li>Unlimited saved presets</li>
            <li>API: 300 requests a minute, 5.000 a day</li>
            <li>Every theme and font, for future themes too</li>
          </ul>
        </section>
      </div>
    </div>
  );
}