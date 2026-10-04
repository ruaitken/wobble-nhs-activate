"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Choose the programme first",
    body: "Use the Programme menu on the left. A licence only applies to the programme selected there. A programme marked historical cannot be used.",
  },
  {
    title: "Send the licence",
    body: "Enter the person's email twice and send. They get an email to activate that place.",
  },
  {
    title: "Overview and Participants",
    body: "Overview is the group picture, with no names. Participants is the named list. It appears on Premium programmes, and only for people who agreed to be seen by name.",
  },
  {
    title: "Add a colleague from Account",
    body: "Enter their email and choose a role. They have 24 hours to open the invitation and press Sign in, then set up an authenticator app. An administrator can send licences and add or remove people. A viewer can see Overview and, on Premium, named participants. A viewer cannot send licences or add people.",
  },
];

export default function HowItWorks({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>{children}</div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="shrink-0 rounded-lg bg-[#E7B450] px-3 py-2 text-sm font-extrabold text-[#25303B] shadow-sm hover:bg-[#D9A63E]"
        >
          {open ? "Hide guide" : "How it works"}
        </button>
      </div>
      {open && (
        <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
          <h4 className="text-sm font-extrabold">How the portal works</h4>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25303B] text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <div className="text-sm font-extrabold">{step.title}</div>
                  <p className="mt-1 text-sm text-[#25303B]/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
