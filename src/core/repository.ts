export interface BaseEntity {
  id?: number;
}

export abstract class Repository<T extends BaseEntity> {
  abstract initializeTable(): void;
  abstract create(entity: Omit<T, 'id'>): T;
  abstract getAll(): T[];
  abstract getById(id: number): T | null;
  abstract update(id: number, entity: Partial<Omit<T, 'id'>>): T | null;
  abstract delete(id: number): boolean;
  abstract close(): void;
}
