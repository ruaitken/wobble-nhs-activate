export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, reason: "missing_token" },
        { status: 400 }
      );
    }

    // Resolve the opaque dashboard token to a campaign id.
    // The token is stored separately from nhs_campaigns so it is not exposed
    // through public campaign metadata reads.
    const { data: tokenRecord, error: lookupError } = await supabase
      .from("campaign_dashboard_tokens")
      .select("campaign_id")
      .eq("dashboard_token", token)
      .eq("is_active", true)
      .is("revoked_at", null)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { ok: false, reason: "db_error", error: lookupError.message },
        { status: 500 }
      );
    }

    if (!tokenRecord) {
      return NextResponse.json(
        { ok: false, reason: "invalid_token" },
        { status: 404 }
      );
    }

    const { data: stats, error: rpcError } = await supabase.rpc(
      "get_campaign_stats",
      { p_campaign_id: tokenRecord.campaign_id }
    );

    if (rpcError) {
      return NextResponse.json(
        { ok: false, reason: "stats_error", error: rpcError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, stats });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, reason: "unexpected_error", error: message },
      { status: 500 }
    );
  }
}
