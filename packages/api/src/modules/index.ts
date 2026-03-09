import type { ResourceRoute } from '../core/types';
import items from './items';
import users from './users';

export const modules: ResourceRoute[] = [
  items,
  users,
];
