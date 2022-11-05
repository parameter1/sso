import { ejsonServer } from '@parameter1/sso-micro-ejson';

import actions from './actions.js';
import pkg from '../package.js';

const { error } = console;

export default ejsonServer({
  name: pkg.name,
  actions,
  logErrors: ({ status }) => (status >= 500),
  onError: ({ e, status }) => {
    // @todo log
    if (status >= 500) error({ status }, e);
  },
});
