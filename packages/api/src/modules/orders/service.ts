import { PgRepository } from '../../core/pgRepository';
import type { Order } from '@wpbot/shared';

export type { Order };

export function createOrdersRepository() {
  return new PgRepository<Order>('orders', [
    { name: 'user_id', type: 'BIGINT', constraints: 'NOT NULL' },
    { name: 'date', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'status', type: 'TEXT', constraints: "NOT NULL DEFAULT 'pending'" },
    { name: 'shipping_city', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'shipping_address', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'payment_method', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  ]);
}
