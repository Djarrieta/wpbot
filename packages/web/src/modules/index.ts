import type { ModuleConfig } from './types';
import items from './items';
import users from './users';
import inventory from './inventory';
import orders from './orders';
import context from './context';

export const modules: ModuleConfig[] = [
  items,
  users,
  inventory,
  orders,
  context,
];
