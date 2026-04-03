import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { ProductType } from './service';

export class ProductTypesController extends GenericCrudController<ProductType> {
  constructor(service: Repository<ProductType>) {
    super(service, 'ProductType', ['name'], ['name', 'description', 'image_url']);
  }
}
