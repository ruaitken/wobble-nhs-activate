import { requestOrigin } from "@/lib/supabase/route";

const DEFAULT_FROM_EMAIL = "enquiries@wobblebalance.com";
const DEFAULT_FROM_NAME = "Wobble";
const APP_STORE_URL =
  "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.wobblebalance.app";
const SUPPORT_EMAIL = "enquiries@wobblebalance.com";

function isLocalSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");
}

function mailpitUrl() {
  if (process.env.MAILPIT_URL) return process.env.MAILPIT_URL;
  if (isLocalSupabase()) return "http://127.0.0.1:54324";
  return null;
}

function resendApiKey() {
  return process.env.RESEND_API_KEY?.trim() || "";
}

function fromAddress() {
  const email = process.env.PORTAL_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const name = process.env.PORTAL_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
  return { email, name, formatted: `${name} <${email}>` };
}

export function canUseResend() {
  return Boolean(resendApiKey()) && process.env.PORTAL_USE_RESEND === "true";
}

export function canSendInviteEmail() {
  return canUseResend() || Boolean(mailpitUrl());
}

export function inviteLinks(origin: string, token: string) {
  return {
    activateUrl: `${origin}/invite/${token}`,
    packUrl: `${origin}/pack`,
  };
}

export function buildInviteEmail({
  programmeName,
  activateUrl,
  packUrl,
}: {
  programmeName: string;
  activateUrl: string;
  packUrl: string;
}) {
  const safeProgramme = escapeHtml(programmeName);
  const safeActivateUrl = escapeHtml(activateUrl);
  const safePackUrl = escapeHtml(packUrl);
  const subject = `You're invited to ${programmeName} on Wobble`;
  const text = [
    `You're invited to join ${programmeName} on Wobble.`,
    "",
    "Your organisation has reserved a place for you. Wobble is a strength and balance programme.",
    "",
    "1. Activate your place",
    "Use the same email address this pack was sent to. This link expires in 14 days.",
    activateUrl,
    "",
    "2. Download the Wobble app",
    `App Store: ${APP_STORE_URL}`,
    `Google Play: ${GOOGLE_PLAY_URL}`,
    "",
    "3. Sign in and complete your assessment",
    "Use the email and password you create on the activation page.",
    "",
    "Information pack:",
    packUrl,
    "",
    `Questions? Email ${SUPPORT_EMAIL}`,
    "If you were not expecting this, you can ignore this email.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#A6D5CE;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Activate your place, then download the app. Your link expires in 14 days.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#A6D5CE;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
            <tr>
              <td style="padding:0 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#25303B;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Wobble</div>
                <div style="margin-top:10px;font-size:28px;line-height:1.25;font-weight:800;">Your place is ready</div>
              </td>
            </tr>
            <tr>
              <td style="background:#F9F5EF;border-radius:20px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:#25303B;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">
                  You're invited to join <strong>${safeProgramme}</strong>.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                  Your organisation has reserved a place for you. Wobble is a strength and balance programme. Use the same email address this pack was sent to.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                  <tr>
                    <td style="background:#25303B;border-radius:12px;">
                      <a href="${safeActivateUrl}" style="display:inline-block;padding:14px 22px;color:#F9F5EF;text-decoration:none;font-size:15px;font-weight:700;">
                        Activate your Wobble place
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 28px;font-size:13px;line-height:1.5;color:#25303B;">
                  This link expires in 14 days. If the button does not work, copy this address:<br />
                  <a href="${safeActivateUrl}" style="color:#25303B;word-break:break-all;">${safeActivateUrl}</a>
                </p>
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Then download the app</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                  <a href="${APP_STORE_URL}" style="color:#25303B;font-weight:700;">App Store</a>
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <a href="${GOOGLE_PLAY_URL}" style="color:#25303B;font-weight:700;">Google Play</a>
                </p>
                <p style="margin:0 0 8px;font-size:14px;font-weight:700;">Sign in and complete your assessment</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
                  Use the email and password you create on the activation page, then finish onboarding in the app.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;">
                  Read the information pack:
                  <a href="${safePackUrl}" style="color:#25303B;font-weight:700;">${safePackUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#25303B;">
                Questions? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:#25303B;">${SUPPORT_EMAIL}</a>.
                If you were not expecting this, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export async function sendInviteEmail({
  request,
  to,
  programmeName,
  token,
}: {
  request: Request;
  to: string;
  programmeName: string;
  token: string;
}) {
  const origin = requestOrigin(request);
  const { activateUrl, packUrl } = inviteLinks(origin, token);
  const { subject, text, html } = buildInviteEmail({
    programmeName,
    activateUrl,
    packUrl,
  });

  if (canUseResend()) {
    await sendWithResend({ to, subject, text, html });
    return { activateUrl, packUrl };
  }

  const inbox = mailpitUrl();
  if (!inbox) {
    throw new Error("invite_email_unavailable");
  }

  const from = fromAddress();
  const response = await fetch(`${inbox.replace(/\/$/, "")}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: from.email, Name: from.name },
      To: [{ Email: to }],
      Subject: subject,
      Text: text,
      HTML: html,
    }),
  });

  if (!response.ok) {
    throw new Error("invite_email_failed");
  }

  return { activateUrl, packUrl };
}

async function sendWithResend({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const from = fromAddress();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from.formatted,
      to: [to],
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error("invite_email_failed");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
