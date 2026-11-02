export const RESET_PASSWORD_PATH = "/reset-password";
export const RESET_PASSWORD_SITE = "https://wobble-account-activate-9i2r.vercel.app";

const TOKEN_HASH = /^[A-Za-z0-9_-]{20,512}$/;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

export function isRecoveryTokenHash(value: string) {
  return TOKEN_HASH.test(value);
}

export function isResetEmail(value: string) {
  return EMAIL.test(value) && value.length <= 320;
}

export function passwordResetProblem(password: string, confirm: string) {
  if (password.length < 8) return "short" as const;
  if (password !== confirm) return "mismatch" as const;
  return null;
}

export function recoveryEmailHref() {
  return `${RESET_PASSWORD_SITE}${RESET_PASSWORD_PATH}?token_hash={{ .TokenHash }}&type=recovery`;
}

export function recoveryEmailHtml() {
  const href = recoveryEmailHref();
  return `<h2>Choose a new password</h2>
<p>Press <strong>Choose a new password</strong>. On the page that opens, enter a new password and press <strong>Save password</strong>. Opening this email is not enough.</p>
<p><a href="${href}">Choose a new password</a></p>
<p>If you did not ask to reset your password, you can ignore this email.</p>`;
}
