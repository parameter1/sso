import { pascalCase } from 'pascal-case';

export default {
  /**
   *
   */
  CommandEventInterface: {
    /**
     *
     */
    __resolveType(event) {
      return `${pascalCase(event.entityType)}CommandEvent`;
    },
  },
};
