import type { ModuleConfig } from '../types';
import { InventoryPage } from './Page';

export default {
  basePath: '/inventory',
  label: 'Inventario',
  icon: '📋',
  Page: InventoryPage,
} satisfies ModuleConfig;
