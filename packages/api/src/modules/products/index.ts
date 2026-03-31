import type { ResourceRoute } from '../../core/types';
import { createProductsRepository } from './service';
import { ProductsController } from './controller';

const service = createProductsRepository();
const controller = new ProductsController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Product } from './service';
export { ProductsController } from './controller';

export default {
  basePath: '/products',
  controller,
} satisfies ResourceRoute;
