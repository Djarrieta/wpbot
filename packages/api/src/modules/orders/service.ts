import { PgRepository } from '../../core/pgRepository';
import type { Order } from '@wpbot/shared';

export type { Order };

export function createOrdersRepository() {
  return new PgRepository<Order>('orders', [
    { name: 'user_id', type: 'BIGINT', constraints: 'NOT NULL' },
    { name: 'date', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'status', type: 'TEXT', constraints: "NOT NULL DEFAULT 'pending'" },
  ]);
}
