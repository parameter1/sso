import normalize from './actions/-normalize.js';
import application from './actions/application.js';
import organization from './actions/organization.js';
import user from './actions/user.js';

export default {
  application,
  organization,
  normalize,
  ping: () => 'pong',
  user,
};
