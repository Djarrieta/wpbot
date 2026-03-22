import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { OrderItem } from './service';

export class OrderItemsController extends GenericCrudController<OrderItem> {
  constructor(orderItemsService: Repository<OrderItem>) {
    super(orderItemsService, 'OrderItem', ['order_id', 'item_id', 'quantity', 'unit_price']);
  }
}
