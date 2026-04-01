import { PgRepository } from '../../core/pgRepository';
import type { Subgroup } from '@wpbot/shared';

export type { Subgroup };

export function createSubgroupsRepository() {
  return new PgRepository<Subgroup>('subgroups', [
    { name: 'group_id', type: 'INTEGER', constraints: 'NOT NULL' },
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
  ]);
}
