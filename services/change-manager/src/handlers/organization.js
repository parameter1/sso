import { managedRepos } from '../repos.js';

export default {
  /**
   *
   */
  delete: async ({ change }) => {
    const { _id } = change.documentKey;
    // delete all associated workspace entries
    // @todo should this run through the PipelinedRepo.delete method?
    // @todo could also trigger soft-delete?
    return Promise.all([
      // delete all workspaces associated with this org
      managedRepos.$('workspace').deleteMany({
        query: { '_edge.organization._id': _id },
      }),
      // remove the managed organization from all users
      managedRepos.$('user').updateMany({
        query: { '_connection.organization.edges._id': _id },
        update: { $pull: { '_connection.organization.edges': { _id } } },
      }),
    ]);
  },
};
