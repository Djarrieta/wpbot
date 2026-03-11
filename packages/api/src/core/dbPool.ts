import pg from 'pg';
import { PG_CONNECTION_STRING, PG_READONLY_CONNECTION_STRING } from '../constants';

// Parse FLOAT8 (OID 701) and NUMERIC (OID 1700) as JS numbers instead of strings
pg.types.setTypeParser(701, parseFloat);
pg.types.setTypeParser(1700, parseFloat);

export type PoolRole = 'admin' | 'readonly';

let adminPool: pg.Pool | null = null;
let readonlyPool: pg.Pool | null = null;

export function getPool(role: PoolRole = 'admin'): pg.Pool {
  if (role === 'readonly') {
    if (!readonlyPool) {
      readonlyPool = new pg.Pool({ connectionString: PG_READONLY_CONNECTION_STRING });
    }
    return readonlyPool;
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
  if (readonlyPool) {
    await readonlyPool.end();
    readonlyPool = null;
  }
}
