import { PgRepository } from '../../core/pgRepository';
import type { Context } from '@wpbot/shared';

export type { Context };

export function createContextRepository() {
  return new PgRepository<Context>('context', [
    { name: 'topic', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'content', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'always_inject', type: 'BOOLEAN', constraints: 'NOT NULL DEFAULT false' },
  ]);
}

export async function getAlwaysInjectContexts(repository: PgRepository<Context>): Promise<Context[]> {
  const all = await repository.getAll();
  return all.filter(c => c.always_inject);
}

export async function getQueryableTopics(repository: PgRepository<Context>): Promise<string[]> {
  const all = await repository.getAll();
  return all.filter(c => !c.always_inject).map(c => c.topic);
}
