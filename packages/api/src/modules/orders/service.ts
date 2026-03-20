import { PgRepository } from '../../core/pgRepository';
import type { Order } from '@wpbot/shared';

export type { Order };

export function createOrdersRepository() {
  return new PgRepository<Order>('orders', [
    { name: 'user_id', type: 'BIGINT', constraints: 'NOT NULL' },
    { name: 'item_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'quantity', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 1' },
    { name: 'date', type: 'TEXT', constraints: 'NOT NULL' },
  ]);
}
