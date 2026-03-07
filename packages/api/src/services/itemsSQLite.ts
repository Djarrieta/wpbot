import { Database } from 'bun:sqlite';
import { DB_PATH } from '../constants';
import { Repository } from '../core/repository';

export type Item = {
  id?: number;
  name: string;
  description: string;
  price: number;
};

export class ItemsSQLite extends Repository<Item> {
  private db: Database;

  constructor() {
    super();
    this.db = new Database(DB_PATH);
    this.initializeTable();
  }

  initializeTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL DEFAULT 0
      )
    `);
  }

  create(item: Omit<Item, 'id'>): Item {
    const stmt = this.db.prepare(`
      INSERT INTO items (name, description, price)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(item.name, item.description, item.price);
    return {
      id: Number(result.lastInsertRowid),
      name: item.name,
      description: item.description,
      price: item.price,
    };
  }

  getAll(): Item[] {
    const results = this.db.query('SELECT * FROM items').all();
    return results as Item[];
  }

  getById(id: number): Item | null {
    const result = this.db.query('SELECT * FROM items WHERE id = ?').get(id);
    return result as Item | null;
  }

  update(id: number, item: Partial<Omit<Item, 'id'>>): Item | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const name = item.name ?? existing.name;
    const description = item.description ?? existing.description;
    const price = item.price ?? existing.price;

    this.db.prepare(`
      UPDATE items 
      SET name = ?, description = ?, price = ? 
      WHERE id = ?
    `).run(name, description, price, id);

    return { id, name, description, price };
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }
  text(): string {
    return '{id: number, name: string, description: string, price: number }';
  }
}
