import type { ResourceRoute } from '../../core/types';
import { createInventoryRepository } from './service';
import { InventoryController } from './controller';

const service = createInventoryRepository();
const controller = new InventoryController(service);

export { service, controller };
export type { Inventory } from './service';
export { InventoryController } from './controller';

export default {
  basePath: '/inventory',
  controller,
} satisfies ResourceRoute;
