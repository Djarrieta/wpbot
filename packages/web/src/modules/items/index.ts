import type { ModuleConfig } from '../types';
import { ItemsPage } from './Page';

export default {
  basePath: '/admin/items',
  label: 'Artículos',
  icon: '📦',
  Page: ItemsPage,
} satisfies ModuleConfig;
