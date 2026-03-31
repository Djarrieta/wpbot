import { PgRepository } from '../../core/pgRepository';
import type { Context } from '@wpbot/shared';

export type { Context };

const NUMBERED_SUFFIX_RE = /^(.+)_(\d+)$/;

/** Groups contexts whose topic ends in _N into a single merged context per base name. */
function groupContexts(contexts: Context[]): Context[] {
  const groups = new Map<string, { parts: { order: number; ctx: Context }[] }>();
  const standalone: Context[] = [];

  for (const ctx of contexts) {
    const match = ctx.topic.match(NUMBERED_SUFFIX_RE);
    if (match) {
      const base = match[1]!;
      const num = match[2]!;
      if (!groups.has(base)) groups.set(base, { parts: [] });
      groups.get(base)!.parts.push({ order: parseInt(num), ctx });
    } else {
      standalone.push(ctx);
    }
  }

  const result: Context[] = [];

  for (const ctx of standalone) {
    const group = groups.get(ctx.topic);
    if (group) {
      // base topic (no number) exists alongside numbered variants — treat as part 0
      group.parts.push({ order: 0, ctx });
    } else {
      result.push(ctx);
    }
  }

  for (const [base, group] of groups) {
    group.parts.sort((a, b) => a.order - b.order);
    result.push({
      topic: base,
      content: group.parts.map(p => p.ctx.content).join('\n'),
      always_inject: group.parts[0]!.ctx.always_inject,
    });
  }

  return result;
}

export function createContextRepository() {
  return new PgRepository<Context>('context', [
    { name: 'topic', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'content', type: 'TEXT', constraints: 'NOT NULL' },
    { name: 'always_inject', type: 'BOOLEAN', constraints: 'NOT NULL DEFAULT false' },
  ]);
}

export async function getAlwaysInjectContexts(repository: PgRepository<Context>): Promise<Context[]> {
  const all = await repository.getAll();
  return groupContexts(all.filter(c => c.always_inject));
}

export async function getQueryableTopics(repository: PgRepository<Context>): Promise<string[]> {
  const all = await repository.getAll();
  return groupContexts(all.filter(c => !c.always_inject)).map(c => c.topic);
}
