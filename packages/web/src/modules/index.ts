import type { ModuleConfig } from './types';
import items from './items';
import users from './users';
import inventory from './inventory';
import orders from './orders';

export const modules: ModuleConfig[] = [
  items,
  users,
  inventory,
  orders,
];
