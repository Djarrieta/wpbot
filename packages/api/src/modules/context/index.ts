import type { ResourceRoute } from '../../core/types';
import { createContextRepository } from './service';
import { ContextController } from './controller';

const service = createContextRepository();
const controller = new ContextController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Context } from './service';
export { ContextController } from './controller';

export default {
  basePath: '/context',
  controller,
} satisfies ResourceRoute;
