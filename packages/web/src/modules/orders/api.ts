import type { Order, WithId } from '@wpbot/shared';
import { createApiClient } from '../../lib/createApiClient';

export const api = createApiClient<WithId<Order>>("/orders", "order");
