import type { ModuleConfig } from '../types';
import { ItemsPage } from './Page';

export default {
  basePath: '/items',
  label: 'Items',
  icon: '📦',
  Page: ItemsPage,
} satisfies ModuleConfig;
