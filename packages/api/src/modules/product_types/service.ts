import { PgRepository } from '../../core/pgRepository';
import type { ProductType } from '@wpbot/shared';

export type { ProductType };

export function createProductTypesRepository() {
  return new PgRepository<ProductType>('product_types', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
  ]);
}
