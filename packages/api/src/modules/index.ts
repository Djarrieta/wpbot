import type { ResourceRoute } from '../core/types';
import items, { init as initItems } from './items';
import users, { init as initUsers } from './users';
import inventory, { init as initInventory } from './inventory';

export const modules: ResourceRoute[] = [
  items,
  users,
  inventory,
];

export async function initModules() {
  await Promise.all([initItems(), initUsers(), initInventory()]);
}
