import application from './actions/application.js';
import organization from './actions/organization.js';
import user from './actions/user.js';

import { reservations, store } from './mongodb.js';

export default {
  createIndexes: async () => Promise.all([
    (async () => {
      const r = await store.createIndexes();
      return ['store', r];
    })(),
    (async () => {
      const r = await reservations.createIndexes();
      return ['reservations', r];
    })(),
  ]),

  application,
  organization,
  ping: () => 'pong',
  user,
};
