import type { ResourceRoute } from '../core/types';
import items from './items';
import users from './users';
import inventory from './inventory';

export const modules: ResourceRoute[] = [
  items,
  users,
  inventory,
];
