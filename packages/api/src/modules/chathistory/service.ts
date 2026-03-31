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
      { name: 'requires_human', type: 'BOOLEAN', constraints: 'NOT NULL DEFAULT false' },
    ]);
  }

  async getByUserId(userId: number, limit: number = 20): Promise<ChatHistory[]> {
    const pool = getPool('admin');
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`,
      [userId, limit]
    );
    return (result.rows as ChatHistory[]).reverse();
  }

  async addMessage(userId: number, message: string, role: 'user' | 'assistant', requiresHuman = false): Promise<ChatHistory> {
    return this.create({
      user_id: userId,
      message,
      role,
      timestamp: new Date().toISOString(),
      requires_human: requiresHuman,
    });
  }

  async getLastAssistantMessage(userId: number): Promise<ChatHistory | null> {
    const pool = getPool('admin');
    const result = await pool.query(
      `SELECT * FROM chat_history WHERE user_id = $1 AND role = 'assistant' ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    return (result.rows[0] as ChatHistory) ?? null;
  }

  async markRequiresHuman(messageId: number): Promise<void> {
    const pool = getPool('admin');
    await pool.query(
      `UPDATE chat_history SET requires_human = true WHERE id = $1`,
      [messageId]
    );
  }

  async isConversationBlocked(userId: number): Promise<boolean> {
    const last = await this.getLastAssistantMessage(userId);
    if (!last) return false;
    return last.requires_human === true;
  }

  async unblockConversation(userId: number): Promise<void> {
    const pool = getPool('admin');
    await pool.query(
      `UPDATE chat_history SET requires_human = false WHERE user_id = $1 AND requires_human = true`,
      [userId]
    );
  }
}

export function createChatHistoryRepository() {
  return new ChatHistoryRepository();
}
