import { Repository } from '../core/repository';
import type { CrudController } from '../core/types';
import type { User } from '../services/usersSQLite';

export class UsersController implements CrudController {
  private usersService: Repository<User>;

  constructor(usersService: Repository<User>) {
    this.usersService = usersService;
  }

  async getAll(_req: Request): Promise<Response> {
    const users = this.usersService.getAll();
    return Response.json(users);
  }

  async getById(_req: Request, id: number): Promise<Response> {
    const user = this.usersService.getById(id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    return Response.json(user);
  }

  async create(req: Request): Promise<Response> {
    try {
      const body = await req.json() as Omit<User, 'id'>;

      if (!body.name || !body.email) {
        return Response.json(
          { error: 'name and email are required' },
          { status: 400 }
        );
      }

      const user = this.usersService.create({
        name: body.name,
        email: body.email,
        phone: body.phone ?? '',
      });

      return Response.json(user, { status: 201 });
    } catch (error) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  async update(req: Request, id: number): Promise<Response> {
    try {
      const body = await req.json() as Partial<Omit<User, 'id'>>;
      const user = this.usersService.update(id, body);

      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      return Response.json(user);
    } catch (error) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  async delete(_req: Request, id: number): Promise<Response> {
    const deleted = this.usersService.delete(id);

    if (!deleted) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  }
}
