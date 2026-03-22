import type { ResourceRoute } from '../../core/types';
import { createOrderItemsRepository } from './service';
import { OrderItemsController } from './controller';

const service = createOrderItemsRepository();
const controller = new OrderItemsController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { OrderItem } from './service';
export { OrderItemsController } from './controller';

export default {
  basePath: '/order-items',
  controller,
} satisfies ResourceRoute;
