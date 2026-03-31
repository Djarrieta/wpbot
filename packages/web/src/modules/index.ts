import type { ModuleConfig } from './types';
import items from './items';
import users from './users';
import orders from './orders';
import context from './context';
import shipping from './shipping';
import chathistory from './chathistory';

export const modules: ModuleConfig[] = [
  items,
  users,
  orders,
  context,
  shipping,
  chathistory,
];
