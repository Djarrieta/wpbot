import pg from 'pg';
import { PG_CONNECTION_STRING, PG_ASSISTANT_CONNECTION_STRING } from '../constants';

// Parse FLOAT8 (OID 701) and NUMERIC (OID 1700) as JS numbers instead of strings
pg.types.setTypeParser(701, parseFloat);
pg.types.setTypeParser(1700, parseFloat);

export type PoolRole = 'admin' | 'assistant';

let adminPool: pg.Pool | null = null;
let assistantPool: pg.Pool | null = null;

export function getPool(role: PoolRole = 'admin'): pg.Pool {
  if (role === 'assistant') {
    if (!assistantPool) {
      assistantPool = new pg.Pool({ connectionString: PG_ASSISTANT_CONNECTION_STRING });
    }
    return assistantPool;
  }
  
  if (!adminPool) {
    adminPool = new pg.Pool({ connectionString: PG_CONNECTION_STRING });
  }
  return adminPool;
}

export async function closeAllPools(): Promise<void> {
  if (adminPool) {
    await adminPool.end();
    adminPool = null;
  }
  if (assistantPool) {
    await assistantPool.end();
    assistantPool = null;
  }
}
