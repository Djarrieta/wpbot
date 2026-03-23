import type { ModuleConfig } from '../types';
import { OrdersPage } from './Page';

export default {
  basePath: '/orders',
  label: 'Pedidos',
  icon: '🛒',
  Page: OrdersPage,
} satisfies ModuleConfig;
