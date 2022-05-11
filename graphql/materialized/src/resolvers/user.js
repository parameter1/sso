import { getProjectionForType } from '@parameter1/sso-graphql';

export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async currentUser(_, __, { auth, repos }, info) {
      const id = await auth.getUserId();
      const { projection } = getProjectionForType(info);
      return repos.$('user').findByObjectId({ id, options: { projection } });
    },
  },
};
