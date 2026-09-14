import { NextResponse } from "next/server";
import { invitationPublicDetails, LicenceError } from "@/lib/portal/licences";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const details = await invitationPublicDetails(token);
    if (!details) {
      return NextResponse.json({ ok: false, reason: "invalid_invite" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...details });
  } catch (error) {
    if (error instanceof LicenceError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    return NextResponse.json({ ok: false, reason: "invite_error" }, { status: 500 });
  }
}
