import type { PortalRole } from "@/lib/portal/membership";

export function canManageLicences(role: PortalRole | undefined) {
  return role === "customer_admin" || role === "wobble_admin";
}

export function canManageUsers(role: PortalRole | undefined) {
  return role === "customer_admin" || role === "wobble_admin";
}

export function isWobbleAdmin(role: PortalRole | undefined) {
  return role === "wobble_admin";
}

export function hasWobbleAdminAccess(memberships: Array<{ role: PortalRole }>) {
  return memberships.some((membership) => membership.role === "wobble_admin");
}
