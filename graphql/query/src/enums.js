import { paginationEnums, sortOrderEnums } from '@parameter1/sso-graphql';

export default {
  ...paginationEnums,
  ...sortOrderEnums,

  LoadOwnerDirectiveTypeEnum: {
    APPLICATION: 'application',
    ORGANIZATION: 'organization',
    USER: 'user',
    WORKSPACE: 'workspace',
  },

  UserWorkspaceConnectionSortFieldEnum: {
    NODE_PATH: 'node.path',
  },
};
