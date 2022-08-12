import { getAsArray } from '@parameter1/object-path';
import { addArrayFilter, getProjectionForType } from '@parameter1/sso-graphql';
import { findWithObjects, filterObjects } from '@parameter1/sso-mongodb';
import enums from '../enums.js';

const { UserWorkspaceConnectionSortFieldEnum } = enums;

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
    workspaceConnection({ _connection }, { input }) {
      const edges = getAsArray(_connection, 'workspace.edges');
      const {
        applicationIds,
        applicationKeys,
        keys,
        organizationIds,
        organizationKeys,
        namespaces,
        pagination,
        sort,
      } = input;
      return findWithObjects(edges, {
        query: {
          ...addArrayFilter('node._edge.application.node._id', applicationIds),
          ...addArrayFilter('node._edge.application.node.key', applicationKeys),
          ...addArrayFilter('node.key', keys),
          ...addArrayFilter('node.namespace.default', namespaces),
          ...addArrayFilter('node._edge.organization.node._id', organizationIds),
          ...addArrayFilter('node._edge.organization.node.key', organizationKeys),
        },
        limit: pagination.limit,
        cursor: pagination.cursor.value,
        direction: pagination.cursor.direction,
        sort: sort.length
          ? sort
          : [{ field: UserWorkspaceConnectionSortFieldEnum.NODE_PATH, order: 1 }],
      });
    },

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
