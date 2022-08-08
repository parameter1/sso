import { getProjectionForType } from '@parameter1/sso-graphql';
import { entityManager } from '../mongodb.js';

export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async workspaceByNamespace(_, { input }, __, info) {
      const { projection } = getProjectionForType(info);
      const repo = entityManager.getMaterializedRepo('workspace');
      return repo.findOne({
        query: { 'namespace.default': input.namespace },
        options: { projection, strict: input.strict },
      });
    },
  },
};
