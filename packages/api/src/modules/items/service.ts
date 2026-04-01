import { PgRepository } from '../../core/pgRepository';
import type { Item } from '@wpbot/shared';

export type { Item };

export function createItemsRepository() {
  return new PgRepository<Item>('items', [
    { name: 'product_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'subgroup_id', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'stock', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0' },
  ]);
}
