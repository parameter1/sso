import { getProjectionForType } from '@parameter1/sso-graphql-common';

export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async workspaceByNamespace(_, { input }, { repos }, info) {
      const { projection } = getProjectionForType(info);
      return repos.$('workspace').findOne({
        query: { 'namespace.default': input.namespace },
        options: { projection, strict: input.strict },
      });
    },
  },
};
