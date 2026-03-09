import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { User } from './service';

export class UsersController extends GenericCrudController<User> {
  constructor(usersService: Repository<User>) {
    super(usersService, 'User', ['name', 'email']);
  }
}
