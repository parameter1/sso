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
      managedRepos.$('workspace').deleteMany({
        query: { '_edge.organization._id': _id },
      }),
    ]);
  },
};
