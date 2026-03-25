import type { ModuleConfig } from '../types';
import { InventoryPage } from './Page';

export default {
  basePath: '/admin/inventory',
  label: 'Inventario',
  icon: '📋',
  Page: InventoryPage,
} satisfies ModuleConfig;
