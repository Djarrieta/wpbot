import type { ResourceRoute } from '../../core/types';
import { createShippingRepository } from './service';
import { ShippingController } from './controller';

const service = createShippingRepository();
const controller = new ShippingController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Shipping } from './service';
export { ShippingController } from './controller';

export default {
  basePath: '/shipping',
  controller,
} satisfies ResourceRoute;
