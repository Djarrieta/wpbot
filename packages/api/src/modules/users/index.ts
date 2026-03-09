import type { ResourceRoute } from '../../core/types';
import { createUsersRepository } from './service';
import { UsersController } from './controller';

const service = createUsersRepository();
const controller = new UsersController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { User } from './service';
export { UsersController } from './controller';

export default {
  basePath: '/users',
  controller,
} satisfies ResourceRoute;
