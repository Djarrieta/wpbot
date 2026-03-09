import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Item } from './service';

export class ItemsController extends GenericCrudController<Item> {
  constructor(itemsService: Repository<Item>) {
    super(itemsService, 'Item', ['name', 'description', 'price']);
  }
}
