import { NextResponse } from "next/server";
import {
  PatientConsentError,
  bearerAccessToken,
  getPatientReportingConsent,
  parsePatientConsentBody,
  updatePatientReportingConsent,
  userIdFromAccessToken,
} from "@/lib/portal/patientConsent";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return response;
}

function json(body: unknown, status = 200) {
  return withCors(NextResponse.json(body, { status }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(request: Request) {
  try {
    const userId = await userIdFromAccessToken(bearerAccessToken(request));
    const state = await getPatientReportingConsent(userId);
    return json({ ok: true, ...state });
  } catch (error) {
    if (error instanceof PatientConsentError) {
      return json({ ok: false, reason: error.reason }, error.status);
    }
    return json({ ok: false, reason: "consent_error" }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await userIdFromAccessToken(bearerAccessToken(request));
    const body = (await request.json()) as {
      consented?: unknown;
      campaign_id?: unknown;
    };
    const { consented, campaignId } = parsePatientConsentBody(body);
    const state = await updatePatientReportingConsent({
      userId,
      consented,
      campaignId,
    });
    return json({ ok: true, ...state });
  } catch (error) {
    if (error instanceof PatientConsentError) {
      return json({ ok: false, reason: error.reason }, error.status);
    }
    return json({ ok: false, reason: "consent_error" }, 500);
  }
}
