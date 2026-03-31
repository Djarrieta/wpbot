import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Shipping } from './service';

export class ShippingController extends GenericCrudController<Shipping> {
  constructor(service: Repository<Shipping>) {
    super(service, 'Shipping', ['city', 'department', 'shipping_cost_cop', 'delivery_estimated_days'], ['city', 'department']);
  }
}
