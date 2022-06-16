import { managedRepos } from '../repos.js';

export default {
  /**
   *
   */
  delete: async ({ change }) => {
    const { _id } = change.documentKey;
    return Promise.all([
      // remove the member workspace from all users
      managedRepos.$('user').updateMany({
        query: { '_connection.workspace.edges._id': _id },
        update: { $pull: { '_connection.workspace.edges': { _id } } },
      }),
    ]);
  },
};
