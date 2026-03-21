import type { ModuleConfig } from '../types';
import { ShippingPage } from './Page';

export default {
  basePath: '/shipping',
  label: 'Shipping',
  icon: '🚚',
  Page: ShippingPage,
} satisfies ModuleConfig;
