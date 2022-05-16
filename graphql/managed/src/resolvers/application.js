import { getProjectionForType } from '@parameter1/sso-graphql';

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
  },
};