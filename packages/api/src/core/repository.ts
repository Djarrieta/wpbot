export interface BaseEntity {
  id?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class Repository<T extends BaseEntity> {
  abstract initializeTable(): Promise<void>;
  abstract create(entity: Omit<T, 'id'>): Promise<T>;
  abstract getAll(filter?: Record<string, string>): Promise<T[]>;
  abstract getAllPaginated(page: number, limit: number, filter?: Record<string, string>, search?: string, searchColumns?: string[]): Promise<PaginatedResult<T>>;
  abstract getById(id: number): Promise<T | null>;
  abstract update(id: number, entity: Partial<Omit<T, 'id'>>): Promise<T | null>;
  abstract delete(id: number): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract text(): string;
  abstract name(): string;
}
