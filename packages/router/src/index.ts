import { IRibaModule } from '@ribajs/core';

export * from './binders';
export * from './interfaces';
export * from './services';

import * as binders from './binders';
import * as services from './services';

export default <IRibaModule> {
  binders,
  services,
};
