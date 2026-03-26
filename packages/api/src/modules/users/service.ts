import pg from 'pg';
import { PgRepository, type ColumnDef } from '../../core/pgRepository';
import { getPool, type PoolRole } from '../../core/dbPool';
import type { User } from '@wpbot/shared';

export type { User };

const USER_COLUMNS: ColumnDef[] = [
  { name: 'name', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  { name: 'email', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  { name: 'phone', type: 'TEXT', constraints: "NOT NULL DEFAULT ''" },
  { name: 'role', type: 'TEXT', constraints: "NOT NULL DEFAULT 'client'" },
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
        phone TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'client'
      )
    `);
    // Unique constraint on email (only for non-empty values) to enable email-based matching
    await this.userPool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email != ''
    `);

    // Identity providers table — links external IDs to internal users
    await this.userPool.query(`
      CREATE TABLE IF NOT EXISTS user_identities (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(provider, provider_id)
      )
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

  /** Find user by external identity (provider + provider_id) */
  async findByIdentity(provider: string, providerId: string): Promise<User | null> {
    const result = await this.userPool.query(
      `SELECT u.* FROM users u
       JOIN user_identities ui ON ui.user_id = u.id
       WHERE ui.provider = $1 AND ui.provider_id = $2`,
      [provider, providerId]
    );
    return (result.rows[0] as User) ?? null;
  }

  /** Add an identity to an existing user. No-op if already exists. */
  async addIdentity(userId: number, provider: string, providerId: string): Promise<void> {
    await this.userPool.query(
      `INSERT INTO user_identities (user_id, provider, provider_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (provider, provider_id) DO NOTHING`,
      [userId, provider, providerId]
    );
  }

  /**
   * Resolve a user by external identity.
   * 1. Check user_identities for existing link → return user
   * 2. If email provided, try to match existing user by email → auto-link
   * 3. Otherwise, create new user + identity
   */
  async resolveByIdentity(
    provider: string,
    providerId: string,
    extras?: { name?: string; email?: string; phone?: string },
  ): Promise<User> {
    // 1. Existing identity
    const byIdentity = await this.findByIdentity(provider, providerId);
    if (byIdentity) return byIdentity;

    // 2. Auto-link by email
    if (extras?.email) {
      const byEmail = await this.getByEmail(extras.email);
      if (byEmail) {
        await this.addIdentity(byEmail.id!, provider, providerId);
        return byEmail;
      }
    }

    // 3. Create new user + identity
    const result = await this.userPool.query(
      'INSERT INTO users (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [extras?.name || '', extras?.email || '', extras?.phone || '']
    );
    const user = result.rows[0] as User;
    await this.addIdentity(user.id!, provider, providerId);
    return user;
  }

  /**
   * Merge sourceUser into targetUser: move all related data, then delete source.
   * Returns the target user after merge.
   */
  async mergeUsers(targetId: number, sourceId: number): Promise<User> {
    if (targetId === sourceId) throw new Error('Cannot merge a user with itself');

    const target = await this.getById(targetId);
    if (!target) throw new Error(`Target user ${targetId} not found`);
    const source = await this.getById(sourceId);
    if (!source) throw new Error(`Source user ${sourceId} not found`);

    // Transfer all related records from source to target
    await this.userPool.query('UPDATE orders SET user_id = $1 WHERE user_id = $2', [targetId, sourceId]);
    await this.userPool.query('UPDATE chat_history SET user_id = $1 WHERE user_id = $2', [targetId, sourceId]);
    // Move identities (skip conflicts — target may already have some)
    await this.userPool.query(
      `UPDATE user_identities SET user_id = $1 WHERE user_id = $2
       AND NOT EXISTS (
         SELECT 1 FROM user_identities ui2
         WHERE ui2.user_id = $1 AND ui2.provider = user_identities.provider AND ui2.provider_id = user_identities.provider_id
       )`,
      [targetId, sourceId]
    );

    // Fill in missing info on target from source
    const updates: Record<string, string> = {};
    if (!target.name && source.name) updates.name = source.name;
    if (!target.phone && source.phone) updates.phone = source.phone;
    if (Object.keys(updates).length > 0) {
      await this.update(targetId, updates);
    }

    // Delete source user (cascades user_identities)
    await this.delete(sourceId);

    return (await this.getById(targetId))!;
  }

  /**
   * Check if setting an email on a user would match another user.
   * If so, merge them and return the merged user. Otherwise return null.
   */
  async tryAutoMergeByEmail(userId: number, email: string): Promise<User | null> {
    if (!email) return null;
    const existing = await this.getByEmail(email);
    if (!existing || existing.id === userId) return null;

    // Another user has this email — merge current user INTO that one
    return this.mergeUsers(existing.id!, userId);
  }
}

export function createUsersRepository() {
  return new UsersRepository();
}
