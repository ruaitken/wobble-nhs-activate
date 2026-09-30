export const APP_STORE_URL =
  "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.wobblebalance.app";

export const appDownloadCopy = {
  accountReadyTitle: "Your Wobble account is ready",
  accountReadyLead:
    "You already have an account. You do not need to create another one.",
  pendingTitle: "Your place is reserved",
  pendingLead:
    "App access is being finished. You can download the app now, then sign in shortly.",
  checkJunk:
    "If you cannot find the invitation email, look in junk or spam.",
  downloadOnDevice:
    "Download the Wobble app on your phone or tablet, not on a laptop. iPhone: App Store. Android: Google Play. Use only the store for your phone.",
  logInNotGetStarted:
    "Open the app and tap Log in or I already have an account. Do not tap Get started.",
  alreadyActivated:
    "Your place is already activated. Open the Wobble app on your phone or tablet and tap Log in or I already have an account. Do not tap Get started.",
};

export function signInWithEmailCopy(email?: string) {
  if (email) {
    return `Sign in with ${email} and the password you just chose.`;
  }
  return "Sign in with the same email and password you created when you activated your place.";
}
