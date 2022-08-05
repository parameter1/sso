import { get, getAsArray } from '@parameter1/object-path';
import { addArrayFilter, getProjectionForType } from '@parameter1/sso-graphql-common';
import { filterObjects, findWithObjects } from '@parameter1/sso-mongodb';
import enums from '../enums.js';

const {
  UserOrganizationConnectionSortFieldEnum,
  UserWorkspaceConnectionSortFieldEnum,
  UserWorkspaceOrganizationConnectionSortFieldEnum,
} = enums;

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
    organizationConnection({ _connection }, { input }) {
      const edges = getAsArray(_connection, 'organization.edges');
      const {
        pagination,
        sort,
      } = input;
      return findWithObjects(edges, {
        limit: pagination.limit,
        cursor: pagination.cursor.value,
        direction: pagination.cursor.direction,
        sort: sort.length
          ? sort
          : [{ field: UserOrganizationConnectionSortFieldEnum.NODE_SLUG, order: 1 }],
      });
    },

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
    /**
     *
     */
    workspaceOrganizationConnection({ _connection }, { input }) {
      const edges = getAsArray(_connection, 'workspace.edges');
      const {
        applicationIds,
        applicationKeys,
        pagination,
        sort,
      } = input;

      const workspaces = filterObjects(edges, {
        ...addArrayFilter('node._edge.application.node._id', applicationIds),
        ...addArrayFilter('node._edge.application.node.key', applicationKeys),
      });

      const orgEdges = [...workspaces.reduce((map, { node: ws }) => {
        const org = get(ws, '_edge.organization.node');
        if (!org) return map;
        map.set(`${org._id}`, { node: org });
        return map;
      }, new Map()).values()];

      return findWithObjects(orgEdges, {
        limit: pagination.limit,
        cursor: pagination.cursor.value,
        direction: pagination.cursor.direction,
        sort: sort.length
          ? sort
          : [{ field: UserWorkspaceOrganizationConnectionSortFieldEnum.NODE_SLUG, order: 1 }],
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
