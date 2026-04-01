import type { ResourceRoute } from '../../core/types';
import { createSubgroupsRepository } from './service';
import { SubgroupsController } from './controller';

const service = createSubgroupsRepository();
const controller = new SubgroupsController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Subgroup } from './service';
export { SubgroupsController } from './controller';

export default {
  basePath: '/subgroups',
  controller,
} satisfies ResourceRoute;
