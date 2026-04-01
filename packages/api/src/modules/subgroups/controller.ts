import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Subgroup } from './service';

export class SubgroupsController extends GenericCrudController<Subgroup> {
  constructor(subgroupsService: Repository<Subgroup>) {
    super(subgroupsService, 'Subgroup', ['group_id', 'name'], ['name']);
  }
}
