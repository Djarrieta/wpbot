import type { OrderItem, WithId } from '@wpbot/shared';
import { createApiClient } from '../../lib/createApiClient';

export const api = createApiClient<WithId<OrderItem>>("/order-items", "orderItem");
