import { PgRepository } from '../../core/pgRepository';
import type { User } from '@wpbot/shared';

export type { User };

export function createUsersRepository() {
  return new PgRepository<User>('users', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'email', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'phone', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  ]);
}
