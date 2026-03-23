import type { ModuleConfig } from '../types';
import { ShippingPage } from './Page';

export default {
  basePath: '/shipping',
  label: 'Envíos',
  icon: '🚚',
  Page: ShippingPage,
} satisfies ModuleConfig;
