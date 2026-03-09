import type { ModuleConfig } from '../types';
import { UsersPage } from './Page';

export default {
  basePath: '/users',
  label: 'Users',
  icon: '👤',
  Page: UsersPage,
} satisfies ModuleConfig;
