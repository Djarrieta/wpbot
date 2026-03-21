import { PgRepository } from '../../core/pgRepository';
import type { Shipping } from '@wpbot/shared';

export type { Shipping };

export function createShippingRepository() {
  return new PgRepository<Shipping>('shipping', [
    { name: 'city', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'department', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'shipping_cost_cop', type: 'REAL', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'delivery_estimated_days', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0' },
  ]);
}
