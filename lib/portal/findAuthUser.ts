import { getSupabaseServer } from "@/lib/supabaseServer";

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

export async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const admin = getSupabaseServer();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw error;

    const users = data.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (users.length < PAGE_SIZE) return null;
  }

  return null;
}

export async function emailsByUserId(userIds: string[]) {
  const admin = getSupabaseServer();
  const uniqueIds = [...new Set(userIds)];
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data.user?.email) return [userId, ""] as const;
      return [userId, data.user.email.toLowerCase()] as const;
    })
  );
  return new Map(entries);
}
