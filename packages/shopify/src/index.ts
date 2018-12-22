import { IRibaModule } from '@ribajs/core';

export * from './components';
export * from './formatters';
export * from './services';
export * from './interfaces';

import * as components from './components';
import * as formatters from './formatters';
import * as services from './services';

export default <IRibaModule> {
  formatters,
  services,
  components,
};
