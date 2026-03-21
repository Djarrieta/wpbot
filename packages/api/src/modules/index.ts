import type { ResourceRoute } from '../core/types';
import items, { init as initItems } from './items';
import users, { init as initUsers } from './users';
import inventory, { init as initInventory } from './inventory';
import chathistory, { init as initChatHistory } from './chathistory';
import orders, { init as initOrders } from './orders';
import context, { init as initContext } from './context';

export const modules: ResourceRoute[] = [
  items,
  users,
  inventory,
  chathistory,
  orders,
  context,
];

export async function initModules() {
  await Promise.all([initItems(), initUsers(), initInventory(), initChatHistory(), initOrders(), initContext()]);
}

