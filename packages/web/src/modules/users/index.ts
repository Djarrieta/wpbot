import type { ModuleConfig } from '../types';
import { UsersPage } from './Page';

export default {
  basePath: '/users',
  label: 'Usuarios',
  icon: '👤',
  Page: UsersPage,
} satisfies ModuleConfig;
