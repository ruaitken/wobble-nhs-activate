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
    // The token (not the human-readable campaign id) is the access key.
    const { data: campaign, error: lookupError } = await supabase
      .from("nhs_campaigns")
      .select("id")
      .eq("dashboard_token", token)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { ok: false, reason: "db_error", error: lookupError.message },
        { status: 500 }
      );
    }

    if (!campaign) {
      return NextResponse.json(
        { ok: false, reason: "invalid_token" },
        { status: 404 }
      );
    }

    const { data: stats, error: rpcError } = await supabase.rpc(
      "get_campaign_stats",
      { p_campaign_id: campaign.id }
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
