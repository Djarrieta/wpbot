import type { Item, WithId } from '@wpbot/shared';
import { createApiClient } from '@/lib/createApiClient';

export const api = createApiClient<WithId<Item>>("/items", "item");
