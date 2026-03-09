import { SQLiteRepository } from '../../core/sqliteRepository';
import type { Item } from '@wpbot/shared';

export type { Item };

export function createItemsRepository() {
  return new SQLiteRepository<Item>('items', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'description', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'price', type: 'REAL', constraints: 'NOT NULL DEFAULT 0' },
  ]);
}
