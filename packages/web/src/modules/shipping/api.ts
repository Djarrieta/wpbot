import type { Shipping, WithId } from '@wpbot/shared';
import { createApiClient } from '@/lib/createApiClient';

export const api = createApiClient<WithId<Shipping>>("/shipping", "shipping");
