import type { ComponentType } from 'react';

export interface ModuleConfig {
  basePath: string;
  label: string;
  icon: string;
  Page: ComponentType;
}
