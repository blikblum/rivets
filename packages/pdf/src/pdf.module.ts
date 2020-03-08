export * from './binders';
// export * from './components';
// export * from './formatters';
export * from './types';
export * from './services';

import { RibaModule } from '@ribajs/core';
import * as binders from './binders';
import * as formatters from './formatters';
import { } from './services';
import * as components from './components';

export const pdfModule: RibaModule = {
  formatters,
  binders,
  services: { },
  components: components,
};