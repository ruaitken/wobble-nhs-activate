import type { EmailOtpType } from "@supabase/supabase-js";
import { canSendInviteEmail, sendTransactionalEmail } from "@/lib/portal/inviteEmail";
import { PORTAL_HOME_PATH, PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";
import { requestOrigin } from "@/lib/supabase/route";
import { getSupabaseServer } from "@/lib/supabaseServer";

const OTP_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

export function canSendPortalEmail() {
  return canSendInviteEmail();
}

export function portalOtpType(value: string | null | undefined): EmailOtpType {
  if (value && (OTP_TYPES as readonly string[]).includes(value)) {
    return value as EmailOtpType;
  }
  return "magiclink";
}

export function signInConfirmUrl(origin: string, tokenHash: string, next: string) {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", "magiclink");
  url.searchParams.set("next", safePortalPath(next));
  return url.toString();
}

export function portalEmailHtml({
  heading,
  introHtml,
  detail,
  url,
  loginUrl,
}: {
  heading: string;
  introHtml: string;
  detail: string;
  url: string;
  loginUrl: string;
}) {
  const safeUrl = escapeHtml(url);
  const safeLoginUrl = escapeHtml(loginUrl);
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#A6D5CE;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#A6D5CE;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
            <tr>
              <td style="padding:0 8px 24px;font-family:Arial,Helvetica,sans-serif;color:#25303B;">
                <div style="font-size:15px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Wobble</div>
                <div style="margin-top:10px;font-size:32px;line-height:1.25;font-weight:800;">${escapeHtml(heading)}</div>
              </td>
            </tr>
            <tr>
              <td style="background:#F9F5EF;border-radius:20px;padding:32px 28px;font-family:Arial,Helvetica,sans-serif;color:#25303B;">
                <p style="margin:0 0 16px;font-size:17px;line-height:1.6;">
                  ${introHtml}
                </p>
                <p style="margin:0 0 24px;font-size:17px;line-height:1.6;">
                  ${escapeHtml(detail)}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="background:#25303B;border-radius:12px;">
                      <a href="${safeUrl}" style="display:inline-block;padding:16px 24px;color:#F9F5EF;text-decoration:none;font-size:17px;font-weight:700;">
                        Continue to sign in
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:15px;line-height:1.5;">
                  If the button does not work, copy this address:<br />
                  <a href="${safeUrl}" style="color:#25303B;word-break:break-all;">${safeUrl}</a>
                </p>
                <p style="margin:20px 0 0;font-size:15px;line-height:1.5;">
                  If the link has run out, go to the <a href="${safeLoginUrl}" style="color:#25303B;">portal login page</a> and enter your email to get a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#25303B;">
                If you were not expecting this, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function portalLoginUrl(url: string) {
  return new URL(PORTAL_LOGIN_PATH, url).toString();
}

export function buildSignInEmail(confirmUrl: string) {
  const loginUrl = portalLoginUrl(confirmUrl);
  const subject = "Sign in to the Wobble customer portal";
  const text = [
    "Sign in to the Wobble customer portal.",
    "",
    "Open this link, then press Sign in on the page that opens. Opening the email is not enough.",
    "The link lasts one hour and can be used once.",
    "",
    confirmUrl,
    "",
    "If the link has run out, go to the portal login page and enter your email to get a new one:",
    loginUrl,
    "",
    "If you were not expecting this, you can ignore this email.",
  ].join("\n");
  const html = portalEmailHtml({
    heading: "Sign in",
    introHtml:
      "Press <strong>Continue to sign in</strong>, then press <strong>Sign in</strong> on the page that opens. Opening the email is not enough.",
    detail: "The link lasts one hour and can be used once.",
    url: confirmUrl,
    loginUrl,
  });
  return { subject, text, html };
}

export async function generateSignInTokenHash(origin: string, email: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/confirm` },
  });
  if (error) throw error;
  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) throw new Error("missing_token");
  return tokenHash;
}

export async function sendPortalMagicLink({
  request,
  email,
  next,
}: {
  request: Request;
  email: string;
  next: string;
}) {
  if (!canSendPortalEmail()) {
    throw new Error("email_unavailable");
  }

  const origin = requestOrigin(request);
  const tokenHash = await generateSignInTokenHash(origin, email);

  const confirmUrl = signInConfirmUrl(origin, tokenHash, next || PORTAL_HOME_PATH);
  if (confirmUrl.includes("/auth/v1/verify")) {
    throw new Error("unsafe_confirm_url");
  }

  const message = buildSignInEmail(confirmUrl);
  await sendTransactionalEmail({ to: email, ...message });
  return { confirmUrl };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
