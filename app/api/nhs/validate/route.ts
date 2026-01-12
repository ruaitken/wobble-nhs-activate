export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabaseServer = getSupabaseServer();

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaign_id");

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, reason: "missing_campaign_id" },
        { status: 400 }
      );
    }

    const { data: campaign, error } = await supabaseServer
      .from("nhs_campaigns")
      .select(
        "id, trust_name, service_name, seat_limit, seats_used, is_active, starts_at, claim_deadline_at, claim_duration_days"
      )
      .eq("id", campaignId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "db_error", error: error.message },
        { status: 500 }
      );
    }

    if (!campaign) {
      return NextResponse.json(
        { ok: false, reason: "campaign_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "unexpected_error", error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
