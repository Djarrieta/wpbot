import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Group } from './service';

export class GroupsController extends GenericCrudController<Group> {
  constructor(groupsService: Repository<Group>) {
    super(groupsService, 'Group', ['name'], ['name']);
  }
}
