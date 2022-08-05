import { getProjectionForType } from '@parameter1/sso-graphql-common';

export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async applicationById(_, { input }, { repos }, info) {
      const { projection } = getProjectionForType(info);
      return repos.$('application').findByObjectId({
        id: input._id,
        options: { projection, strict: input.strict },
      });
    },

    /**
     *
     */
    async applicationByKey(_, { input }, { repos }, info) {
      const { projection } = getProjectionForType(info);
      return repos.$('application').findOne({
        query: { key: input.key },
        options: { projection, strict: input.strict },
      });
    },
  },
};
