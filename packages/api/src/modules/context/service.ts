import { PgRepository } from '../../core/pgRepository';
import type { Context } from '@wpbot/shared';

export type { Context };

export function createContextRepository() {
  return new PgRepository<Context>('context', [
    { name: 'topic', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'content', type: 'TEXT', constraints: 'NOT NULL' },
  ]);
}
