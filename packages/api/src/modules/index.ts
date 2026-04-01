import type { ResourceRoute } from '../core/types';
import products, { init as initProducts } from './products';
import items, { init as initItems } from './items';
import users, { init as initUsers } from './users';
import chathistory, { init as initChatHistory } from './chathistory';
import orders, { init as initOrders } from './orders';
import orderItems, { init as initOrderItems } from './order_items';
import context, { init as initContext } from './context';
import shipping, { init as initShipping } from './shipping';
import groups, { init as initGroups } from './groups';
import subgroups, { init as initSubgroups } from './subgroups';

export const modules: ResourceRoute[] = [
  products,
  items,
  users,
  chathistory,
  orders,
  orderItems,
  context,
  shipping,
  groups,
  subgroups,
];

export async function initModules() {
  await Promise.all([initProducts(), initItems(), initUsers(), initChatHistory(), initOrders(), initOrderItems(), initContext(), initShipping(), initGroups(), initSubgroups()]);
}

