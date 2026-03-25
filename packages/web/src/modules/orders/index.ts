import type { ModuleConfig } from '../types';
import { OrdersPage } from './Page';

export default {
  basePath: '/admin/orders',
  label: 'Pedidos',
  icon: '🛒',
  Page: OrdersPage,
} satisfies ModuleConfig;
