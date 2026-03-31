import pg from 'pg';
import { getPool, type PoolRole } from './dbPool';
import { Repository, type BaseEntity, type PaginatedResult } from './repository';

export interface ColumnDef {
  name: string;
  type: 'TEXT' | 'REAL' | 'INTEGER' | 'BIGINT' | 'BOOLEAN' | 'JSONB';
  constraints?: string;
}

const PG_TYPE_MAP: Record<ColumnDef['type'], string> = {
  TEXT: 'TEXT',
  REAL: 'DOUBLE PRECISION',
  INTEGER: 'INTEGER',
  BIGINT: 'BIGINT',
  BOOLEAN: 'BOOLEAN',
  JSONB: 'JSONB',
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

  /** Create an assistant version of this repository (limited permissions) */
  asAssistant(): PgRepository<T> {
    return new PgRepository<T>(this.tableName, this.columns, 'assistant');
  }

  async initializeTable(): Promise<void> {
    // Only admin can create tables
    if (this.role === 'assistant') {
      throw new Error('Cannot initialize table with assistant connection');
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

  async getAll(filter?: Record<string, string>): Promise<T[]> {
    if (!filter || Object.keys(filter).length === 0) {
      const result = await this.pool.query(`SELECT * FROM ${this.tableName}`);
      return result.rows as T[];
    }

    // Filter only by valid columns
    const validFilters = Object.entries(filter).filter(([key]) =>
      this.fieldNames.includes(key)
    );

    if (validFilters.length === 0) {
      const result = await this.pool.query(`SELECT * FROM ${this.tableName}`);
      return result.rows as T[];
    }

    const whereClauses = validFilters.map(([key], i) => `${key} = $${i + 1}`);
    const values = validFilters.map(([, value]) => value);
    const result = await this.pool.query(
      `SELECT * FROM ${this.tableName} WHERE ${whereClauses.join(' AND ')}`,
      values
    );
    return result.rows as T[];
  }

  async getAllPaginated(page: number, limit: number, filter?: Record<string, string>, search?: string, searchColumns?: string[]): Promise<PaginatedResult<T>> {
    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (filter && Object.keys(filter).length > 0) {
      const validFilters = Object.entries(filter).filter(([key]) =>
        this.fieldNames.includes(key)
      );
      for (const [key, value] of validFilters) {
        values.push(value);
        conditions.push(`${key} = $${values.length}`);
      }
    }

    if (search && searchColumns && searchColumns.length > 0) {
      const validSearchCols = searchColumns.filter((col) => this.fieldNames.includes(col));
      if (validSearchCols.length > 0) {
        values.push(`%${search}%`);
        const paramIndex = values.length;
        const searchClauses = validSearchCols.map((col) => `${col} ILIKE $${paramIndex}`);
        conditions.push(`(${searchClauses.join(' OR ')})`);
      }
    }

    const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.tableName}${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const offset = (page - 1) * limit;
    const dataResult = await this.pool.query(
      `SELECT * FROM ${this.tableName}${whereClause} ORDER BY id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return {
      data: dataResult.rows as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
