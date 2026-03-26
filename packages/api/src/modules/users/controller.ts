import { GenericCrudController } from '../../core/crudController';
import type { User } from './service';
import { UsersRepository } from './service';

export class UsersController extends GenericCrudController<User> {
  private usersRepo: UsersRepository;

  constructor(usersService: UsersRepository) {
    super(usersService, 'User', ['email']);
    this.usersRepo = usersService;
  }

  override async update(req: Request, id: number): Promise<Response> {
    try {
      const body = await req.json() as Partial<Omit<User, 'id'>>;

      // If email is being set/changed, try auto-merge first
      if (body.email) {
        const merged = await this.usersRepo.tryAutoMergeByEmail(id, body.email);
        if (merged) {
          return Response.json({ ...merged, merged: true });
        }
      }

      const entity = await this.usersRepo.update(id, body);
      if (!entity) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      return Response.json(entity);
    } catch (e) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }
}
