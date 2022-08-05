import { getProjectionForType } from '@parameter1/sso-graphql';
import { filterObjects } from '@parameter1/sso-mongodb';

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
  User: {
    /**
     *
     */
    workspaceRoleFromId({ _connection }, { input }) {
      const [workspace] = filterObjects(_connection.workspace.edges, {
        'node._id': input._id,
      });
      return workspace ? workspace.role : null;
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
