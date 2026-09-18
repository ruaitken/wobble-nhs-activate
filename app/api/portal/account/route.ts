import { NextResponse } from "next/server";
import { jsonError, requireOrgAccess } from "@/lib/portal/access";
import {
  AccountError,
  inviteAccountMember,
  listAccountMembers,
  removeAccountMember,
} from "@/lib/portal/account";
import { canManageUsers } from "@/lib/portal/roles";

function orgIdFrom(request: Request, body?: { org_id?: string }) {
  const url = new URL(request.url);
  return body?.org_id ?? url.searchParams.get("org_id") ?? "";
}

export async function GET(request: Request) {
  try {
    const orgId = orgIdFrom(request);
    if (!orgId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }
    const session = await requireOrgAccess(orgId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    const members = await listAccountMembers(orgId);
    return NextResponse.json({
      ok: true,
      members,
      can_manage: canManageUsers(membership?.role),
      current_user_id: session.userId,
    });
  } catch (error) {
    if (error instanceof AccountError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      org_id?: string;
      email?: string;
      confirm_email?: string;
      role?: string;
    };
    const orgId = orgIdFrom(request, body);
    if (!orgId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    const session = await requireOrgAccess(orgId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    if (!canManageUsers(membership?.role)) {
      return NextResponse.json({ ok: false, reason: "forbidden_role" }, { status: 403 });
    }

    const result = await inviteAccountMember({
      orgId,
      email: body.email ?? "",
      confirmEmail: body.confirm_email ?? "",
      role: body.role ?? "",
      invitedBy: session.userId,
      request,
    });
    return NextResponse.json({
      ok: true,
      members: result.members,
      can_manage: true,
      current_user_id: session.userId,
      email_sent: result.email_sent,
      message: result.email_sent
        ? "Invitation sent. They can open the email to sign in."
        : "Person added. Ask them to request a sign-in link from the login page.",
    });
  } catch (error) {
    if (error instanceof AccountError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as {
      org_id?: string;
      user_id?: string;
    };
    const orgId = orgIdFrom(request, body);
    const userId = body.user_id ?? "";
    if (!orgId || !userId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    const session = await requireOrgAccess(orgId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    if (!canManageUsers(membership?.role)) {
      return NextResponse.json({ ok: false, reason: "forbidden_role" }, { status: 403 });
    }

    const members = await removeAccountMember({
      orgId,
      userId,
      actorUserId: session.userId,
    });
    return NextResponse.json({
      ok: true,
      members,
      can_manage: true,
      current_user_id: session.userId,
    });
  } catch (error) {
    if (error instanceof AccountError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
