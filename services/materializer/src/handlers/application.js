import { deleteMaterializedRecord, materializeData } from '../utils.js';

export default {
  /**
   *
   */
  delete: async ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return deleteMaterializedRecord({ db, coll, _id });
  },

  /**
   *
   */
  insert: ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return materializeData({ db, coll }, { _id });
  },

  /**
   *
   */
  replace: ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return Promise.all([
      materializeData({ db, coll }, { _id }),
      materializeData({ db, coll: 'workspaces' }, { '_edge.application._id': _id }),
    ]);
  },

  /**
   *
   */
  update: ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return Promise.all([
      materializeData({ db, coll }, { _id }),
      materializeData({ db, coll: 'workspaces' }, { '_edge.application._id': _id }),
    ]);
  },
};
