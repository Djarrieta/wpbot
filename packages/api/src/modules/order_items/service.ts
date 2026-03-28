import { PgRepository } from '../../core/pgRepository';
import type { OrderItem } from '@wpbot/shared';

export type { OrderItem };

export function createOrderItemsRepository() {
  return new PgRepository<OrderItem>('order_items', [
    { name: 'order_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'item_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'quantity', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 1' },
    { name: 'unit_price', type: 'REAL', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'device_reference', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  ]);
}
