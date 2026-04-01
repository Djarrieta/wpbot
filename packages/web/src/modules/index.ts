import type { ModuleConfig } from './types';
import products from './products';
import items from './items';
import groups from './groups';
import subgroups from './subgroups';
import users from './users';
import orders from './orders';
import context from './context';
import shipping from './shipping';
import chathistory from './chathistory';

export const modules: ModuleConfig[] = [
  products,
  items,
  groups,
  subgroups,
  users,
  orders,
  context,
  shipping,
  chathistory,
];
