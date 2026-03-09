import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Inventory } from './service';

export class InventoryController extends GenericCrudController<Inventory> {
  constructor(inventoryService: Repository<Inventory>) {
    super(inventoryService, 'Inventory', ['item_id', 'quantity']);
  }
}
