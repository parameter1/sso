import { getProjectionForType } from '@parameter1/sso-graphql';
import { materialized } from '../mongodb.js';
import { createStrictError } from '../utils.js';

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
      const repo = materialized.get('workspace');
      const doc = await repo.collection.findOne({ 'namespace.default': input.namespace }, {
        projection,
      });
      if (input.strict && !doc) throw createStrictError('workspace');
      return doc;
    },
  },

  /**
   *
   */
  WorkspaceInterfaceName: {
    /**
     *
     */
    application({ nameParts }) {
      const parts = [...nameParts];
      parts.shift();
      return parts.join(' > ');
    },
  },
};
