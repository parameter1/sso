import { jsonServer } from '@parameter1/micro';
import actions from './actions/index.js';
import pkg from '../package.js';

export default jsonServer({
  name: pkg.name,
  actions,
  logErrors: ({ status }) => (status >= 500),
});
