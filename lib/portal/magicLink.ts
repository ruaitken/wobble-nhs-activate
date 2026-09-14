import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";

export function canSendPortalEmail() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isLocal =
    supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost");
  return isLocal || process.env.PORTAL_ALLOW_HOSTED_AUTH === "true";
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
  const { supabase, applyCookies } = await createPortalRouteClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${requestOrigin(request)}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw error;
  return { applyCookies };
}
