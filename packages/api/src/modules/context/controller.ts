import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Context } from './service';

export class ContextController extends GenericCrudController<Context> {
  constructor(contextService: Repository<Context>) {
    super(contextService, 'Context', ['topic', 'content']);
  }
}
