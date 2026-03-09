import type { ResourceRoute } from '../../core/types';
import { createItemsRepository } from './service';
import { ItemsController } from './controller';

const service = createItemsRepository();
const controller = new ItemsController(service);

export { service, controller };
export type { Item } from './service';
export { ItemsController } from './controller';

export default {
  basePath: '/items',
  controller,
} satisfies ResourceRoute;
