import type { User, WithId } from '@wpbot/shared';
import { createApiClient } from '@/lib/createApiClient';

export const api = createApiClient<WithId<User>>("/users", "user");

export async function mergeUsers(targetId: number, sourceId: number): Promise<WithId<User>> {
  const res = await fetch("/api/users/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ targetId, sourceId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Merge failed: ${res.status}`);
  }
  return res.json();
}
