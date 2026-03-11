import pg from 'pg';
import { getPool, type PoolRole } from './dbPool';
import { Repository, type BaseEntity } from './repository';

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

export class PgRepository<T extends BaseEntity> extends Repository<T> {
  private pool: pg.Pool;
  private tableName: string;
  private columns: ColumnDef[];
  private fieldNames: string[];
  private role: PoolRole;

  constructor(tableName: string, columns: ColumnDef[], role: PoolRole = 'admin') {
    super();
    this.tableName = tableName;
    this.columns = columns;
    this.fieldNames = columns.map((c) => c.name);
    this.role = role;
    this.pool = getPool(role);
  }

  /** Create a readonly version of this repository */
  asReadonly(): PgRepository<T> {
    return new PgRepository<T>(this.tableName, this.columns, 'readonly');
  }

  async initializeTable(): Promise<void> {
    // Only admin can create tables
    if (this.role === 'readonly') {
      throw new Error('Cannot initialize table with readonly connection');
    }
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
