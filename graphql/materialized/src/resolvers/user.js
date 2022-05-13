import { get } from '@parameter1/object-path';
import { addArrayFilter, getProjectionForType } from '@parameter1/sso-graphql';
import { filterObjects, findWithObjects } from '@parameter1/sso-mongodb';
import enums from '../enums.js';

const {
  User_ConnectionOrganizationSortFieldEnum: userOrganizationSortField,
  User_ConnectionWorkspaceOrganizationSortFieldEnum: userWorkspaceOrganizationSortField,
  User_ConnectionWorkspaceSortFieldEnum: userWorkspaceSortField,
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
    workspaceRoleFromId({ _connection }, { input }) {
      const [workspace] = filterObjects(_connection.workspace.edges, {
        'node._deleted': false,
        'node._id': input._id,
      });
      return workspace ? workspace.role : null;
    },
  },

  /**
   *
   */
  User_Connection: {
    /**
     *
     */
    async organization({ organization }, { input }) {
      const {
        pagination,
        sort,
      } = input;
      return findWithObjects(organization.edges, {
        query: { 'node._deleted': false },
        limit: pagination.limit,
        cursor: pagination.cursor.value,
        direction: pagination.cursor.direction,
        sort: sort.length
          ? sort
          : [{ field: userOrganizationSortField.NODE_SLUG, order: 1 }],
      });
    },

    /**
     *
     */
    async workspace({ workspace }, { input }) {
      const {
        applicationIds,
        applicationKeys,
        organizationIds,
        organizationKeys,
        pagination,
        sort,
      } = input;
      return findWithObjects(workspace.edges, {
        query: {
          'node._deleted': false,
          ...addArrayFilter('node._edge.application.node._id', applicationIds),
          ...addArrayFilter('node._edge.application.node.key', applicationKeys),
          ...addArrayFilter('node._edge.organization.node._id', organizationIds),
          ...addArrayFilter('node._edge.organization.node.key', organizationKeys),
        },
        limit: pagination.limit,
        cursor: pagination.cursor.value,
        direction: pagination.cursor.direction,
        sort: sort.length
          ? sort
          : [{ field: userWorkspaceSortField.NODE_PATH, order: 1 }],
      });
    },

    /**
     *
     */
    workspaceOrganization({ workspace }, { input }) {
      const {
        applicationIds,
        applicationKeys,
        pagination,
        sort,
      } = input;

      const workspaces = filterObjects(workspace.edges, {
        'node._deleted': false,
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
          : [{ field: userWorkspaceOrganizationSortField.NODE_SLUG, order: 1 }],
      });
    },
  },
};
