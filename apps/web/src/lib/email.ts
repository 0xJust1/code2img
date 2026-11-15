// Branded transactional emails. Inline-styled tables (email-client safe),
// colors from apps/web/app/tokens.css. Dark card with explicit inline colors,
// so light-mode clients keep the dark surface instead of inheriting their own.
import { APP_URL } from "@code2img/shared";

export type Locale = "en" | "fr";

export const MAIL_FROM = "Code2Img <hello@code2img.app>";

const C = {
  ground: "#08090a",
  surface: "#0e0f11",
  border: "#26282e",
  ink: "#f2f3f5",
  ink2: "#a9aeb8",
  primary: "#f4f5f7",
  primaryInk: "#0a0a0c",
  danger: "#ff8f8f",
};

const t = {
  en: {
    magicSubject: "Your Code2Img sign-in link",
    magicTitle: "Sign in to Code2Img",
    magicBody: "Click the button below to sign in. This link expires in 5 minutes.",
    magicCta: "Sign in",
    magicCopy: "Or copy this link into your browser:",
    welcomeSubject: "Welcome to Code2Img Pro",
    welcomeTitle: "Welcome to Code2Img Pro",
    welcomeBody: "Your Pro subscription is active. You now have watermark-free exports at 4x, custom backgrounds and logos, unlimited presets, share links and full API access.",
    welcomeCta: "Open the editor",
    receiptSubject: (period: string) => `Your Code2Img receipt (${period})`,
    receiptTitle: "Payment received",
    receiptBody: (amount: string, period: string) => `We received your payment of ${amount} for ${period}. Your Pro subscription stays active.`,
    failedSubject: "Payment failed — action required",
    failedTitle: "Payment failed",
    failedBody: (amount: string) => `We couldn't charge ${amount} for your Pro subscription. Update your payment method to keep Pro (watermark-free 4x exports, API access).`,
    failedCta: "Update payment method",
    canceledSubject: "Your Code2Img Pro subscription ended",
    canceledTitle: "Subscription canceled",
    canceledBody: "Your Pro subscription has ended and your account is back on the Free plan. Your presets are safe — you can resubscribe anytime.",
    canceledCta: "Resubscribe",
    footer: "You receive this email because you have a Code2Img account.",
    expiry: "Link expires in 5 minutes",
    manage: "Manage billing",
  },
  fr: {
    magicSubject: "Votre lien de connexion Code2Img",
    magicTitle: "Connexion à Code2Img",
    magicBody: "Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 5 minutes.",
    magicCta: "Se connecter",
    magicCopy: "Ou copiez ce lien dans votre navigateur :",
    welcomeSubject: "Bienvenue dans Code2Img Pro",
    welcomeTitle: "Bienvenue dans Code2Img Pro",
    welcomeBody: "Votre abonnement Pro est actif : exports sans filigrane en 4x, fonds et logos personnalisés, presets illimités, liens de partage et accès API complet.",
    welcomeCta: "Ouvrir l'éditeur",
    receiptSubject: (period: string) => `Votre reçu Code2Img (${period})`,
    receiptTitle: "Paiement reçu",
    receiptBody: (amount: string, period: string) => `Nous avons bien reçu votre paiement de ${amount} pour ${period}. Votre abonnement Pro reste actif.`,
    failedSubject: "Paiement échoué — action requise",
    failedTitle: "Paiement échoué",
    failedBody: (amount: string) => `Nous n'avons pas pu prélever ${amount} pour votre abonnement Pro. Mettez à jour votre moyen de paiement pour conserver Pro (exports 4x sans filigrane, accès API).`,
    failedCta: "Mettre à jour le moyen de paiement",
    canceledSubject: "Votre abonnement Code2Img Pro est terminé",
    canceledTitle: "Abonnement terminé",
    canceledBody: "Votre abonnement Pro est terminé, votre compte repasse au plan Gratuit. Vos presets sont conservés — vous pouvez vous réabonner à tout moment.",
    canceledCta: "Se réabonner",
    footer: "Vous recevez cet email car vous avez un compte Code2Img.",
    expiry: "Ce lien expire dans 5 minutes",
    manage: "Gérer la facturation",
  },
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MARK = `<span style="font-family:ui-monospace,'JetBrains Mono','SF Mono',Menlo,monospace;font-size:15px;color:${C.primary}">&lt;</span><span style="font-family:ui-monospace,'JetBrains Mono','SF Mono',Menlo,monospace;font-size:15px;color:#5b9dff">&#9642;</span><span style="font-family:ui-monospace,'JetBrains Mono','SF Mono',Menlo,monospace;font-size:15px;color:${C.primary}">&gt;</span> <span style="font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:15px;font-weight:600;color:${C.ink}">Code2Img</span>`;

function layout(title: string, body: string, cta: { label: string; href: string } | null, extra: string, footer: string): { html: string; text: string } {
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px"><tr><td align="center" bgcolor="${C.primary}" style="border-radius:7px"><a href="${esc(cta.href)}" style="display:inline-block;padding:13px 32px;font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:15px;font-weight:600;color:${C.primaryInk};text-decoration:none;border-radius:7px">${esc(cta.label)}</a></td></tr></table>`
    : "";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:${C.ground}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ground}" style="background:${C.ground}"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;text-align:left">
    <tr><td style="padding:0 8px 24px">${MARK}</td></tr>
    <tr><td bgcolor="${C.surface}" style="background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:36px 40px 32px">
      <h1 style="margin:0 0 12px;font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:21px;font-weight:600;color:${C.ink}">${esc(title)}</h1>
      <p style="margin:0;font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:15px;line-height:1.55;color:${C.ink2}">${esc(body)}</p>
      ${ctaHtml}
      ${extra}
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:12px;line-height:1.5;color:#8a8f9a">${esc(footer)}<br><a href="${APP_URL}" style="color:#a9aeb8;text-decoration:underline">${APP_URL.replace("https://", "")}</a></td></tr>
  </table>
</td></tr></table>
</body></html>`;
  const text = [title, "", body, ...(cta ? ["", `${cta.label}: ${cta.href}`] : []), ...(extra ? ["", extra.replace(/<[^>]+>/g, "").trim()] : []), "", footer].join("\n");
  return { html, text };
}

function urlBlock(url: string, copyLabel: string): string {
  return `<p style="margin:20px 0 0;font-family:ui-sans-serif,system-ui,'Segoe UI',Inter,sans-serif;font-size:12px;color:#8a8f9a">${esc(copyLabel)}<br><span style="font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;font-size:12px;color:${C.ink2};word-break:break-all">${esc(url)}</span></p>`;
}

export type EmailTemplate =
  | { kind: "magic-link"; url: string }
  | { kind: "welcome-pro"; url?: string }
  | { kind: "receipt"; amount: string; period: string }
  | { kind: "payment-failed"; amount: string }
  | { kind: "subscription-canceled" };

export function renderEmail(template: EmailTemplate, locale: Locale = "en"): { subject: string; html: string; text: string } {
  const s = t[locale];
  switch (template.kind) {
    case "magic-link":
      return { subject: s.magicSubject, ...layout(s.magicTitle, `${s.magicBody}`, { label: s.magicCta, href: template.url }, `${urlBlock(template.url, s.magicCopy)}<p style="margin:16px 0 0;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#8a8f9a">${esc(s.expiry)}</p>`, s.footer) };
    case "welcome-pro":
      return { subject: s.welcomeSubject, ...layout(s.welcomeTitle, s.welcomeBody, { label: s.welcomeCta, href: `${APP_URL}/editor` }, "", s.footer) };
    case "receipt":
      return { subject: s.receiptSubject(template.period), ...layout(s.receiptTitle, s.receiptBody(template.amount, template.period), { label: s.manage, href: `${APP_URL}/api/billing/portal` }, "", s.footer) };
    case "payment-failed":
      return { subject: s.failedSubject, ...layout(s.failedTitle, s.failedBody(template.amount), { label: s.failedCta, href: `${APP_URL}/api/billing/portal` }, "", s.footer) };
    case "subscription-canceled":
      return { subject: s.canceledSubject, ...layout(s.canceledTitle, s.canceledBody, { label: s.canceledCta, href: `${APP_URL}/pricing` }, "", s.footer) };
  }
}

async function transport(): Promise<import("nodemailer").Transporter | null> {
  const host = process.env.SMTP_HOST;
  if (!host) return null; // dev/test: no SMTP, callers skip sending
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function sendEmail(to: string, template: EmailTemplate, locale: Locale = "en"): Promise<void> {
  const tr = await transport();
  if (!tr) {
    // Dev/test mode: no SMTP configured — keep the URL visible in service logs.
    console.log(`[email] smtp not configured, not sending ${template.kind} to ${to}`, template.kind === "magic-link" ? template.url : "");
    return;
  }
  const { subject, html, text } = renderEmail(template, locale);
  await tr.sendMail({ from: process.env.SMTP_FROM ?? MAIL_FROM, to, subject, text, html });
}
