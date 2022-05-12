import { paginationEnums, sortOrderEnums } from '@parameter1/graphql/features';

export default {
  ...paginationEnums,
  ...sortOrderEnums,

  LoadOwnerDirectiveTypeEnum: {
    APPLICATION: 'application',
    ORGANIZATION: 'organization',
    USER: 'user',
    WORKSPACE: 'workspace',
  },

  OrganizationManagerRoleEnum: {
    OWNER: 'Owner',
    ADMINISTRATOR: 'Administrator',
    MANAGER: 'Manager',
  },

  User_ConnectionOrganizationSortFieldEnum: {
    NODE_SLUG: 'node.slug',
  },

  User_ConnectionWorkspaceSortFieldEnum: {
    NODE_PATH: 'node.path',
  },
};
