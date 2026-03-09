import { SQLiteRepository } from '../core/sqliteRepository';

export type User = {
  id?: number;
  name: string;
  email: string;
  phone: string;
};

export function createUsersRepository() {
  return new SQLiteRepository<User>('users', [
    { name: 'name', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'email', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
    { name: 'phone', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  ]);
}
