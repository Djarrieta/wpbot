import { GenericCrudController } from '../../core/crudController';
import type { Repository } from '../../core/repository';
import type { Product } from './service';

export class ProductsController extends GenericCrudController<Product> {
  constructor(productsService: Repository<Product>) {
    super(productsService, 'Product', ['name', 'product_type_id', 'price', 'image_url', 'requires_device'], ['name', 'description']);
  }
}
