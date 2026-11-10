import type { ReactNode } from "react";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  WEB_APP_URL,
  appDownloadCopy,
  signInWithEmailCopy,
} from "@/lib/portal/appDownloadCopy";

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-extrabold text-[#25303B]">{children}</strong>;
}

export function CheckJunkLine() {
  return (
    <>
      If you cannot find the invitation email, look in <Strong>junk or spam</Strong>.
    </>
  );
}

export function DownloadOnDeviceLine() {
  return (
    <>
      On a <Strong>phone or tablet</Strong>, download the Wobble app. It works
      best there. iPhone: App Store. Android: Google Play.
    </>
  );
}

export function WebAppOnComputerLine() {
  return (
    <>
      On a <Strong>laptop or computer</Strong>, use the web app. Sign in with
      the same email and password.
    </>
  );
}

export function LogInNotCreateAccountLine() {
  return (
    <>
      Open the app and tap <Strong>Log in</Strong>.{" "}
      <Strong>Do not tap Create an account</Strong>.
    </>
  );
}

export function AlreadyActivatedLine() {
  return (
    <>
      Your place is already activated. On a <Strong>phone or tablet</Strong>,
      open the Wobble app and tap <Strong>Log in</Strong>.{" "}
      <Strong>Do not tap Create an account</Strong>. On a{" "}
      <Strong>laptop or computer</Strong>, open the{" "}
      <a
        href={WEB_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold text-[#25303B] underline"
      >
        web app
      </a>{" "}
      and sign in with the same email and password.
    </>
  );
}

const storeButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-[#25303B] px-4 py-3 text-base font-extrabold text-[#F9F5EF]";
const storeButtonSecondaryClass =
  "inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-base font-extrabold text-[#25303B]";

export default function AppDownloadNextSteps({
  email,
  pending = false,
}: {
  email?: string;
  pending?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3 text-base text-[#25303B]/80">
      <p>{pending ? appDownloadCopy.pendingLead : appDownloadCopy.accountReadyLead}</p>
      <p>{signInWithEmailCopy(email)}</p>
      <div className="space-y-2">
        <p className="font-extrabold text-[#25303B]">On a phone or tablet</p>
        <p>
          <DownloadOnDeviceLine />
        </p>
        <p>
          <LogInNotCreateAccountLine />
        </p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={storeButtonClass}
          >
            Download on the App Store
          </a>
          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={storeButtonSecondaryClass}
          >
            Get it on Google Play
          </a>
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-extrabold text-[#25303B]">On a laptop or computer</p>
        <p>
          <WebAppOnComputerLine />
        </p>
        <a
          href={WEB_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={storeButtonSecondaryClass}
        >
          Open the web app
        </a>
      </div>
    </div>
  );
}
