import type { ResourceRoute } from '../core/types';
import items, { init as initItems } from './items';
import users, { init as initUsers } from './users';
import inventory, { init as initInventory } from './inventory';
import chathistory, { init as initChatHistory } from './chathistory';
import orders, { init as initOrders } from './orders';
import orderItems, { init as initOrderItems } from './order_items';
import context, { init as initContext } from './context';
import shipping, { init as initShipping } from './shipping';

export const modules: ResourceRoute[] = [
  items,
  users,
  inventory,
  chathistory,
  orders,
  orderItems,
  context,
  shipping,
];

export async function initModules() {
  await Promise.all([initItems(), initUsers(), initInventory(), initChatHistory(), initOrders(), initOrderItems(), initContext(), initShipping()]);
}

