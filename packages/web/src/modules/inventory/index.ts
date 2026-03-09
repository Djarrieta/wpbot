import type { ModuleConfig } from '../types';
import { InventoryPage } from './Page';

export default {
  basePath: '/inventory',
  label: 'Inventory',
  icon: '📋',
  Page: InventoryPage,
} satisfies ModuleConfig;
