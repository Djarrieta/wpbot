import pg from 'pg';
import { PG_CONNECTION_STRING } from '../constants';
import { Repository, type BaseEntity } from './repository';

// Parse FLOAT8 (OID 701) and NUMERIC (OID 1700) as JS numbers instead of strings
pg.types.setTypeParser(701, parseFloat);
pg.types.setTypeParser(1700, parseFloat);

export interface ColumnDef {
  name: string;
  type: 'TEXT' | 'REAL' | 'INTEGER';
  constraints?: string;
}

const PG_TYPE_MAP: Record<ColumnDef['type'], string> = {
  TEXT: 'TEXT',
  REAL: 'DOUBLE PRECISION',
  INTEGER: 'INTEGER',
};

let sharedPool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!sharedPool) {
    sharedPool = new pg.Pool({ connectionString: PG_CONNECTION_STRING });
  }
  return sharedPool;
}

export class PgRepository<T extends BaseEntity> extends Repository<T> {
  private pool: pg.Pool;
  private tableName: string;
  private columns: ColumnDef[];
  private fieldNames: string[];

  constructor(tableName: string, columns: ColumnDef[]) {
    super();
    this.tableName = tableName;
    this.columns = columns;
    this.fieldNames = columns.map((c) => c.name);
    this.pool = getPool();
  }

  async initializeTable(): Promise<void> {
    const columnDefs = this.columns
      .map((c) => `${c.name} ${PG_TYPE_MAP[c.type]} ${c.constraints ?? ''}`.trim())
      .join(',\n        ');
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        ${columnDefs}
      )
    `);
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    const placeholders = this.fieldNames.map((_, i) => `$${i + 1}`).join(', ');
    const values = this.fieldNames.map((f) => (entity as Record<string, unknown>)[f]);
    const result = await this.pool.query(
      `INSERT INTO ${this.tableName} (${this.fieldNames.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0] as T;
  }

  async getAll(): Promise<T[]> {
    const result = await this.pool.query(`SELECT * FROM ${this.tableName}`);
    return result.rows as T[];
  }

  async getById(id: number): Promise<T | null> {
    const result = await this.pool.query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return (result.rows[0] as T) ?? null;
  }

  async update(id: number, entity: Partial<Omit<T, 'id'>>): Promise<T | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged: Record<string, unknown> = {};
    for (const f of this.fieldNames) {
      merged[f] = (entity as Record<string, unknown>)[f] ?? (existing as Record<string, unknown>)[f];
    }

    const setClause = this.fieldNames.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = this.fieldNames.map((f) => merged[f]);
    const result = await this.pool.query(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${this.fieldNames.length + 1} RETURNING *`,
      [...values, id]
    );
    return (result.rows[0] as T) ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  text(): string {
    const fields = ['id: number', ...this.columns.map((c) => {
      const tsType = c.type === 'REAL' || c.type === 'INTEGER' ? 'number' : 'string';
      return `${c.name}: ${tsType}`;
    })];
    return `{${fields.join(', ')}}`;
  }

  name(): string {
    return this.tableName;
  }
}
