import type { ResourceRoute } from '../../core/types';
import { createProductTypesRepository } from './service';
import { ProductTypesController } from './controller';

const service = createProductTypesRepository();
const controller = new ProductTypesController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { ProductType } from './service';
export { ProductTypesController } from './controller';

export default {
  basePath: '/product_types',
  controller,
} satisfies ResourceRoute;
