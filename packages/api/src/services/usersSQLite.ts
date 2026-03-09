import { Database } from 'bun:sqlite';
import { DB_PATH } from '../constants';
import { Repository } from '../core/repository';

export type User = {
  id?: number;
  name: string;
  email: string;
  phone: string;
};

export class UsersSQLite extends Repository<User> {
  private db: Database;

  constructor() {
    super();
    this.db = new Database(DB_PATH);
    this.initializeTable();
  }

  initializeTable(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT ''
      )
    `);
  }

  create(user: Omit<User, 'id'>): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, phone)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(user.name, user.email, user.phone);
    return {
      id: Number(result.lastInsertRowid),
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  getAll(): User[] {
    const results = this.db.query('SELECT * FROM users').all();
    return results as User[];
  }

  getById(id: number): User | null {
    const result = this.db.query('SELECT * FROM users WHERE id = ?').get(id);
    return result as User | null;
  }

  update(id: number, user: Partial<Omit<User, 'id'>>): User | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const name = user.name ?? existing.name;
    const email = user.email ?? existing.email;
    const phone = user.phone ?? existing.phone;

    this.db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, phone = ? 
      WHERE id = ?
    `).run(name, email, phone, id);

    return { id, name, email, phone };
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }

  text(): string {
    return '{id: number, name: string, email: string, phone: string }';
  }
}
