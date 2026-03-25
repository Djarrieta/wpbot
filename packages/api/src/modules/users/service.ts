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

  /** Use BIGSERIAL so IDs auto-increment but also accept explicit large IDs (Telegram, WhatsApp) */
  override async initializeTable(): Promise<void> {
    await this.userPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT ''
      )
    `);
    // Unique constraint on email (only for non-empty values) to enable email-based matching
    await this.userPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email != ''
    `);
  }

  async getByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const result = await this.userPool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return (result.rows[0] as User) ?? null;
  }

  async getOrCreateByEmail(email: string, name?: string): Promise<User> {
    const existing = await this.getByEmail(email);
    if (existing) return existing;

    const result = await this.userPool.query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name || '', email, '']
    );
    return result.rows[0] as User;
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
