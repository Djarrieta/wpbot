import type { ModuleConfig } from '../types';
import { ContextPage } from './Page';

export default {
  basePath: '/context',
  label: 'Contexto',
  icon: '📋',
  Page: ContextPage,
} satisfies ModuleConfig;
