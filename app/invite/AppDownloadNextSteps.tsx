import type { ReactNode } from "react";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
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
      Download the Wobble app on your <Strong>phone or tablet</Strong>, not on a
      laptop. iPhone: App Store. Android: Google Play. Use only the store for
      your phone.
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
      Your place is already activated. Open the Wobble app on your{" "}
      <Strong>phone or tablet</Strong> and tap <Strong>Log in</Strong>.{" "}
      <Strong>Do not tap Create an account</Strong>.
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
      <ol className="list-decimal space-y-3 pl-5">
        <li>
          <DownloadOnDeviceLine />
        </li>
        <li>
          <LogInNotCreateAccountLine />
        </li>
        <li>{signInWithEmailCopy(email)}</li>
      </ol>
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
  );
}
