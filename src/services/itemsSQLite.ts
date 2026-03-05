import { Database } from 'bun:sqlite';
import { DB_PATH } from '../constants';
import { Repository } from '../core/repository';

export type Item = {
  id?: number;
  name: string;
  quantity: number;
};

export class ItemsSQLite extends Repository<Item> {
  private db: Database;

  constructor() {
    super();
    this.db = new Database(DB_PATH);
    this.initializeTable();
  }

  /**
   * Initialize the items table
   */
  initializeTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  /**
   * Create a new item
   */
  create(item: Omit<Item, 'id'>): Item {
    const stmt = this.db.prepare(`
      INSERT INTO items (name, quantity)
      VALUES (?, ?)
    `);
    const result = stmt.run(item.name, item.quantity);
    return {
      id: Number(result.lastInsertRowid),
      name: item.name,
      quantity: item.quantity,
    };
  }

  /**
   * Get all items
   */
  getAll(): Item[] {
    const results = this.db.query('SELECT * FROM items').all();
    return results as Item[];
  }

  /**
   * Get item by ID
   */
  getById(id: number): Item | null {
    const result = this.db.query('SELECT * FROM items WHERE id = ?').get(id);
    return result as Item | null;
  }

  /**
   * Update an item
   */
  update(id: number, item: Partial<Omit<Item, 'id'>>): Item | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const name = item.name ?? existing.name;
    const quantity = item.quantity ?? existing.quantity;

    this.db.prepare(`
      UPDATE items 
      SET name = ?, quantity = ? 
      WHERE id = ?
    `).run(name, quantity, id);

    return { id, name, quantity };
  }

  /**
   * Delete an item
   */
  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }
}
