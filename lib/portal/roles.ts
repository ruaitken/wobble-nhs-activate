import type { PortalRole } from "@/lib/portal/membership";

export function canManageLicences(role: PortalRole | undefined) {
  return role === "customer_admin" || role === "wobble_admin";
}

export function canManageUsers(role: PortalRole | undefined) {
  return role === "customer_admin" || role === "wobble_admin";
}
