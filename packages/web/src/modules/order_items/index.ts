import type { ModuleConfig } from '../types';
import { OrderItemsPage } from './Page';

export default {
  basePath: '/order-items',
  label: 'Order Items',
  icon: '📦',
  Page: OrderItemsPage,
} satisfies ModuleConfig;
