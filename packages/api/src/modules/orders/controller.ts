import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Order } from './service';

export class OrdersController extends GenericCrudController<Order> {
  constructor(ordersService: Repository<Order>) {
    super(ordersService, 'Order', ['user_id', 'date', 'status', 'shipping_city', 'shipping_address', 'payment_method']);
  }
}
