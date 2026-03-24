import type { Context, WithId } from '@wpbot/shared';
import { createApiClient } from '@/lib/createApiClient';

export const api = createApiClient<WithId<Context>>("/context", "context");
