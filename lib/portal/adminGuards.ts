export type OrgAdmin = {
  user_id: string;
  role: string;
};

export function canRemoveMember(members: OrgAdmin[], targetUserId: string) {
  const target = members.find((member) => member.user_id === targetUserId);
  if (!target) return false;
  if (target.role === "viewer") return true;
  return canRemoveOrgAdmin(members, targetUserId);
}

export function canRemoveOrgAdmin(admins: OrgAdmin[], targetUserId: string) {
  const adminIds = admins
    .filter((member) => member.role === "customer_admin" || member.role === "wobble_admin")
    .map((member) => member.user_id);

  if (!adminIds.includes(targetUserId)) return false;
  if (adminIds.length <= 1) return false;
  return true;
}
