import type { ModuleConfig } from '../types';
import { ContextPage } from './Page';

export default {
  basePath: '/context',
  label: 'Context',
  icon: '📋',
  Page: ContextPage,
} satisfies ModuleConfig;
