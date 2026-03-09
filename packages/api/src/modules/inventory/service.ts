import { SQLiteRepository } from '../../core/sqliteRepository';
import type { Inventory } from '@wpbot/shared';

export type { Inventory };

export function createInventoryRepository() {
  return new SQLiteRepository<Inventory>('inventory', [
    { name: 'item_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'quantity', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'location', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  ]);
}
