export const APP_STORE_URL =
  "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.wobblebalance.app";
export const WEB_APP_URL = "https://app.wobblebalance.com/";

export const appDownloadCopy = {
  accountReadyTitle: "Your Wobble account is ready",
  accountReadyLead:
    "You already have an account. You do not need to create another one.",
  pendingTitle: "Your place is reserved",
  pendingLead:
    "App access is being finished. You can download the app on a phone or tablet, or open the web app on a computer, then sign in shortly.",
  checkJunk:
    "If you cannot find the invitation email, look in junk or spam.",
  checkJunkHtml:
    "If you cannot find the invitation email, look in <strong>junk or spam</strong>.",
  downloadOnDevice:
    "On a phone or tablet, download the Wobble app. It works best there. iPhone: App Store. Android: Google Play.",
  downloadOnDeviceHtml:
    "On a <strong>phone or tablet</strong>, download the Wobble app. It works best there. iPhone: App Store. Android: Google Play.",
  webAppOnComputer:
    "On a laptop or computer, use the web app. Sign in with the same email and password.",
  webAppOnComputerHtml:
    "On a <strong>laptop or computer</strong>, use the web app. Sign in with the same email and password.",
  logInNotCreateAccount:
    "Open the app and tap Log in. Do not tap Create an account.",
  logInNotCreateAccountHtml:
    "Open the app and tap <strong>Log in</strong>. <strong>Do not tap Create an account</strong>.",
  alreadyActivated:
    "Your place is already activated. On a phone or tablet, open the Wobble app and tap Log in. Do not tap Create an account. On a laptop or computer, open the web app and sign in with the same email and password.",
};

export function signInWithEmailCopy(email?: string) {
  if (email) {
    return `Sign in with ${email} and the password you just chose.`;
  }
  return "Sign in with the same email and password you created when you activated your place.";
}
