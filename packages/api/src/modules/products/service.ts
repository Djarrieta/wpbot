import { PgRepository } from '../../core/pgRepository';
import type { Product } from '@wpbot/shared';

export type { Product };

export function createProductsRepository() {
  return new PgRepository<Product>('products', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'description', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'product_type_id', type: 'INTEGER', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'price', type: 'REAL', constraints: 'NOT NULL DEFAULT 0' },
    { name: 'image_url', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'requires_device', type: 'BOOLEAN', constraints: 'NOT NULL DEFAULT false' },
  ]);
}
