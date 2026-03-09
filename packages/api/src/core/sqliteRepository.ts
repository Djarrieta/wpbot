import { Database, type SQLQueryBindings } from 'bun:sqlite';
import { DB_PATH } from '../constants';
import { Repository, type BaseEntity } from './repository';

export interface ColumnDef {
  name: string;
  type: 'TEXT' | 'REAL' | 'INTEGER';
  constraints?: string;
}

export class SQLiteRepository<T extends BaseEntity> extends Repository<T> {
  private db: Database;
  private tableName: string;
  private columns: ColumnDef[];
  private fieldNames: string[];

  constructor(tableName: string, columns: ColumnDef[]) {
    super();
    this.tableName = tableName;
    this.columns = columns;
    this.fieldNames = columns.map((c) => c.name);
    this.db = new Database(DB_PATH);
    this.initializeTable();
  }

  initializeTable(): void {
    const columnDefs = this.columns
      .map((c) => `${c.name} ${c.type} ${c.constraints ?? ''}`.trim())
      .join(',\n        ');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${columnDefs}
      )
    `);
  }

  create(entity: Omit<T, 'id'>): T {
    const placeholders = this.fieldNames.map(() => '?').join(', ');
    const values = this.fieldNames.map((f) => (entity as Record<string, unknown>)[f] as SQLQueryBindings);
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (${this.fieldNames.join(', ')})
      VALUES (${placeholders})
    `);
    const result = stmt.run(...values);
    return { id: Number(result.lastInsertRowid), ...entity } as T;
  }

  getAll(): T[] {
    return this.db.query(`SELECT * FROM ${this.tableName}`).all() as T[];
  }

  getById(id: number): T | null {
    return this.db.query(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id) as T | null;
  }

  update(id: number, entity: Partial<Omit<T, 'id'>>): T | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const merged: Record<string, unknown> = {};
    for (const f of this.fieldNames) {
      merged[f] = (entity as Record<string, unknown>)[f] ?? (existing as Record<string, unknown>)[f];
    }

    const setClause = this.fieldNames.map((f) => `${f} = ?`).join(', ');
    const values = this.fieldNames.map((f) => merged[f] as SQLQueryBindings);
    this.db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`).run(...values, id);

    return { id, ...merged } as T;
  }

  delete(id: number): boolean {
    const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }

  text(): string {
    const fields = ['id: number', ...this.columns.map((c) => {
      const tsType = c.type === 'REAL' || c.type === 'INTEGER' ? 'number' : 'string';
      return `${c.name}: ${tsType}`;
    })];
    return `{${fields.join(', ')}}`;
  }
}
