import { NextResponse } from "next/server";
import { completeInvitation, LicenceError } from "@/lib/portal/licences";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      access_token?: string;
      first_name?: string;
      last_name?: string;
      consented?: unknown;
    };
    const token = body.token ?? "";
    const accessToken = body.access_token ?? "";
    if (!token || !accessToken) {
      return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
    }

    const result = await completeInvitation({
      token,
      accessToken,
      firstName: body.first_name ?? "",
      lastName: body.last_name ?? "",
      consented: body.consented,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof LicenceError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    return NextResponse.json({ ok: false, reason: "activate_error" }, { status: 500 });
  }
}
