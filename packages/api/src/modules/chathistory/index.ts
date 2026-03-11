import type { ResourceRoute } from '../../core/types';
import { createChatHistoryRepository } from './service';
import { ChatHistoryController } from './controller';

const service = createChatHistoryRepository();
const controller = new ChatHistoryController(service);

export async function init() {
  await service.initializeTable();
}

export { service, controller };
export type { ChatHistory } from './service';
export { ChatHistoryController } from './controller';
export { ChatHistoryRepository } from './service';

export default {
  basePath: '/chathistory',
  controller,
} satisfies ResourceRoute;
