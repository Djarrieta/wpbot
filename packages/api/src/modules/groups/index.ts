import type { ResourceRoute } from '../../core/types';
import { createGroupsRepository } from './service';
import { GroupsController } from './controller';

const service = createGroupsRepository();
const controller = new GroupsController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { Group } from './service';
export { GroupsController } from './controller';

export default {
  basePath: '/groups',
  controller,
} satisfies ResourceRoute;
