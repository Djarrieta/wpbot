import { PgRepository } from '../../core/pgRepository';
import type { ChatHistory } from '@wpbot/shared';
import { getPool } from '../../core/dbPool';

export type { ChatHistory };

export class ChatHistoryRepository extends PgRepository<ChatHistory> {
  constructor() {
    super('chat_history', [
      { name: 'user_id', type: 'BIGINT', constraints: 'NOT NULL' },
      { name: 'message', type: 'TEXT', constraints: 'NOT NULL' },
      { name: 'role', type: 'TEXT', constraints: "NOT NULL DEFAULT 'user'" },
      { name: 'timestamp', type: 'TEXT', constraints: 'NOT NULL' },
    ]);
  }

  async getByUserId(userId: number, limit: number = 20): Promise<ChatHistory[]> {
    const pool = getPool('readonly');
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`,
      [userId, limit]
    );
    return (result.rows as ChatHistory[]).reverse();
  }

  async addMessage(userId: number, message: string, role: 'user' | 'assistant'): Promise<ChatHistory> {
    return this.create({
      user_id: userId,
      message,
      role,
      timestamp: new Date().toISOString(),
    });
  }
}

export function createChatHistoryRepository() {
  return new ChatHistoryRepository();
}
