import type { BaseEntity, Repository } from './repository';
import type { CrudController } from './types';

export class GenericCrudController<T extends BaseEntity> implements CrudController {
  protected service: Repository<T>;
  protected entityName: string;
  private requiredFields: string[];

  constructor(service: Repository<T>, entityName: string, requiredFields: string[]) {
    this.service = service;
    this.entityName = entityName;
    this.requiredFields = requiredFields;
  }

  async getAll(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const filter: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      filter[key] = value;
    });
    return Response.json(await this.service.getAll(filter));
  }

  async getById(_req: Request, id: number): Promise<Response> {
    const entity = await this.service.getById(id);
    if (!entity) {
      return Response.json({ error: `${this.entityName} not found` }, { status: 404 });
    }
    return Response.json(entity);
  }

  async create(req: Request): Promise<Response> {
    try {
      const body = await req.json() as Omit<T, 'id'>;

      const missing = this.requiredFields.filter(
        (f) => (body as Record<string, unknown>)[f] === undefined || (body as Record<string, unknown>)[f] === ''
      );
      if (missing.length > 0) {
        return Response.json(
          { error: `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required` },
          { status: 400 }
        );
      }

      const entity = await this.service.create(body);
      return Response.json(entity, { status: 201 });
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  async update(req: Request, id: number): Promise<Response> {
    try {
      const body = await req.json() as Partial<Omit<T, 'id'>>;
      const entity = await this.service.update(id, body);
      if (!entity) {
        return Response.json({ error: `${this.entityName} not found` }, { status: 404 });
      }
      return Response.json(entity);
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  async delete(_req: Request, id: number): Promise<Response> {
    const deleted = await this.service.delete(id);
    if (!deleted) {
      return Response.json({ error: `${this.entityName} not found` }, { status: 404 });
    }
    return Response.json({ success: true });
  }

  schemaText(): string {
    return `Tabla "${this.service.name()}": ${this.service.text()}`;
  }
}
