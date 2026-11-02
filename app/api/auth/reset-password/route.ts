import { NextResponse } from "next/server";
import {
  isRecoveryTokenHash,
  isResetEmail,
  passwordResetProblem,
  RESET_PASSWORD_PATH,
} from "@/lib/auth/resetPassword";
import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");
  const back = new URL(RESET_PASSWORD_PATH, origin);

  if (!isRecoveryTokenHash(tokenHash)) {
    back.searchParams.set("error", "missing");
    return NextResponse.redirect(back, 303);
  }

  const problem = passwordResetProblem(password, confirm);
  if (problem) {
    back.searchParams.set("token_hash", tokenHash);
    back.searchParams.set("type", "recovery");
    back.searchParams.set("error", problem);
    return NextResponse.redirect(back, 303);
  }

  const { supabase, applyCookies } = await createPortalRouteClient();
  const { data, error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  if (error || !data.user) {
    back.searchParams.set("error", "invalid");
    return applyCookies(NextResponse.redirect(back, 303));
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  const email = data.user.email ?? "";
  await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);

  if (updateError) {
    back.searchParams.set("error", "failed");
    return applyCookies(NextResponse.redirect(back, 303));
  }

  const done = new URL(RESET_PASSWORD_PATH, origin);
  done.searchParams.set("saved", "1");
  if (isResetEmail(email)) done.searchParams.set("email", email);
  return applyCookies(NextResponse.redirect(done, 303));
}
