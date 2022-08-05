import { getProjectionForType } from '@parameter1/sso-graphql';

export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async currentUser(_, __, { auth, dataloaders }, info) {
      const _id = await auth.getUserId();
      const { projection } = getProjectionForType(info);
      return dataloaders.get('user').load({ value: _id, strict: true, projection });
    },
  },

  /**
   *
   */
  UserInterfaceName: {
    /**
     *
     */
    full({ givenName, familyName }) {
      return [givenName, familyName].join(' ');
    },
  },
};
