import type { Subgroup, WithId } from "@wpbot/shared";
import { createApiClient } from "@/lib/createApiClient";

export const api = createApiClient<WithId<Subgroup>>("/subgroups", "subgroup");
