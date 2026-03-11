import type { ResourceRoute } from '../core/types';
import items, { init as initItems } from './items';
import users, { init as initUsers } from './users';
import inventory, { init as initInventory } from './inventory';
import chathistory, { init as initChatHistory, service as chatHistoryService } from './chathistory';

export const modules: ResourceRoute[] = [
  items,
  users,
  inventory,
  chathistory,
];

export async function initModules() {
  await Promise.all([initItems(), initUsers(), initInventory(), initChatHistory()]);
}
