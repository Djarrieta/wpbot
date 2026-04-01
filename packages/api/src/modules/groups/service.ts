import { PgRepository } from '../../core/pgRepository';
import type { Group } from '@wpbot/shared';

export type { Group };

export function createGroupsRepository() {
  return new PgRepository<Group>('groups', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
  ]);
}
