export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

type Body = {
  campaign_id: string;
  access_token: string;
};

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const body = (await req.json()) as Body;

    const campaign_id = body?.campaign_id;
    const access_token = body?.access_token;

    if (!campaign_id || !access_token) {
      return NextResponse.json(
        { ok: false, reason: "missing_campaign_id_or_access_token" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.functions.invoke("nhs-activate", {
      body: { campaign_id },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, reason: "edge_function_error", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, reason: "unexpected_error", error: message },
      { status: 500 }
    );
  }
}
