import { deleteMaterializedRecord, materializeData, relatedWorkspaceIds } from '../utils.js';

const workspaceIdsFor = ({ db, _id }) => relatedWorkspaceIds({ db }, { '_edge.organization._id': _id });

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
  replace: async ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return Promise.all([
      materializeData({ db, coll }, { _id }),
      materializeData({ db, coll: 'workspaces' }, { '_edge.organization._id': _id }),
      materializeData({ db, coll: 'users' }, {
        $or: [
          { '_connection.organization.edges._id': _id },
          { '_connection.workspace.edges._id': { $in: await workspaceIdsFor({ db, _id }) } },
        ],
      }),
    ]);
  },

  /**
   *
   */
  update: async ({ change }) => {
    const { _id } = change.documentKey;
    const { db, coll } = change.ns;
    return Promise.all([
      materializeData({ db, coll }, { _id }),
      materializeData({ db, coll: 'workspaces' }, { '_edge.organization._id': _id }),
      materializeData({ db, coll: 'users' }, { '_connection.organization.edges._id': _id }),
      materializeData({ db, coll: 'users' }, {
        $or: [
          { '_connection.organization.edges._id': _id },
          { '_connection.workspace.edges._id': { $in: await workspaceIdsFor({ db, _id }) } },
        ],
      }),
    ]);
  },
};
