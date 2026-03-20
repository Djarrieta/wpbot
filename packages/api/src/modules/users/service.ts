import pg from 'pg';
import { PgRepository, type ColumnDef } from '../../core/pgRepository';
import { getPool, type PoolRole } from '../../core/dbPool';
import type { User } from '@wpbot/shared';

export type { User };

const USER_COLUMNS: ColumnDef[] = [
  { name: 'name', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  { name: 'email', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  { name: 'phone', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
];

export class UsersRepository extends PgRepository<User> {
  private userPool: pg.Pool;

  constructor(role: PoolRole = 'admin') {
    super('users', USER_COLUMNS, role);
    this.userPool = getPool(role);
  }

  /** Override to use BIGINT PRIMARY KEY (for external IDs like Telegram) instead of SERIAL */
  override async initializeTable(): Promise<void> {
    await this.userPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT ''
      )
    `);
  }

  async getOrCreateById(id: number, name?: string): Promise<User> {
    const existing = await this.getById(id);
    if (existing) return existing;

    // Insert with explicit ID
    const userName = name || `user_${id}`;
    const result = await this.userPool.query(
      'INSERT INTO users (id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, userName, '', '']
    );
    return result.rows[0] as User;
  }
}

export function createUsersRepository() {
  return new UsersRepository();
}
