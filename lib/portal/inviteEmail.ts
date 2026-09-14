import { requestOrigin } from "@/lib/supabase/route";

function isLocalSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");
}

function mailpitUrl() {
  if (process.env.MAILPIT_URL) return process.env.MAILPIT_URL;
  if (isLocalSupabase()) return "http://127.0.0.1:54324";
  return null;
}

export function canSendInviteEmail() {
  return Boolean(mailpitUrl()) || process.env.PORTAL_SEND_INVITES === "true";
}

export function inviteLinks(origin: string, token: string) {
  return {
    activateUrl: `${origin}/invite/${token}`,
    packUrl: `${origin}/pack`,
  };
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
  const subject = `Your Wobble information pack — ${programmeName}`;
  const text = [
    `You have been invited to join ${programmeName} on Wobble.`,
    "",
    "Use this same email address to activate your place. The link expires in 14 days.",
    activateUrl,
    "",
    "Information pack:",
    packUrl,
  ].join("\n");
  const html = `
    <p>You have been invited to join <strong>${escapeHtml(programmeName)}</strong> on Wobble.</p>
    <p>Use this same email address to activate your place. The link expires in 14 days.</p>
    <p><a href="${activateUrl}">Activate your Wobble place</a></p>
    <p>Read the information pack: <a href="${packUrl}">${packUrl}</a></p>
  `;

  const inbox = mailpitUrl();
  if (!inbox) {
    throw new Error("invite_email_unavailable");
  }

  const response = await fetch(`${inbox.replace(/\/$/, "")}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: { Email: "invites@wobble.local", Name: "Wobble" },
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
