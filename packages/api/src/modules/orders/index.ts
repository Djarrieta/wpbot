import type { ResourceRoute } from '../../core/types';
import { createOrdersRepository } from './service';
import { OrdersController } from './controller';

const service = createOrdersRepository();
const controller = new OrdersController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Order } from './service';
export { OrdersController } from './controller';

export default {
  basePath: '/orders',
  controller,
} satisfies ResourceRoute;
