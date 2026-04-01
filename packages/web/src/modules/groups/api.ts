import type { Group, WithId } from "@wpbot/shared";
import { createApiClient } from "@/lib/createApiClient";

export const api = createApiClient<WithId<Group>>("/groups", "group");
