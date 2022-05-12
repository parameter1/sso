import { addArrayFilter, getProjectionForType } from '@parameter1/sso-graphql';
import { findWithObjects } from '@parameter1/sso-mongodb';
import enums from '../enums.js';

const {
  User_ConnectionOrganizationSortFieldEnum: userOrganizationSortField,
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
  User_Connection: {
    /**
     *
     */
    async organization({ organization }, { input }) {
      const {
        pagination,
        sort,
      } = input;
      return findWithObjects(organization, {
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
      return findWithObjects(workspace, {
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
  },
};
