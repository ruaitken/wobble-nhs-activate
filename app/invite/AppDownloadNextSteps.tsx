import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  appDownloadCopy,
  signInWithEmailCopy,
} from "@/lib/portal/appDownloadCopy";

export default function AppDownloadNextSteps({
  email,
  pending = false,
}: {
  email?: string;
  pending?: boolean;
}) {
  return (
    <div className="mt-3 space-y-3 text-sm text-[#25303B]/80">
      <p>{pending ? appDownloadCopy.pendingLead : appDownloadCopy.accountReadyLead}</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>{appDownloadCopy.downloadOnDevice}</li>
        <li>{appDownloadCopy.logInNotGetStarted}</li>
        <li>{signInWithEmailCopy(email)}</li>
      </ol>
      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-[#25303B] px-4 py-2 text-sm font-extrabold text-[#F9F5EF]"
        >
          Download on the App Store
        </a>
        <a
          href={GOOGLE_PLAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-extrabold text-[#25303B]"
        >
          Get it on Google Play
        </a>
      </div>
    </div>
  );
}
