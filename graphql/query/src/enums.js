import { paginationEnums, sortOrderEnums } from '@parameter1/graphql/features';

export default {
  ...paginationEnums,
  ...sortOrderEnums,

  UserWorkspaceConnectionSortFieldEnum: {
    NODE_PATH: 'node.path',
  },
};
