import { getProjectionForType } from '@parameter1/graphql/projection';

const { NODE_ENV } = process.env;

export default {
  /**
   *
   */
  Workspace: {
    /**
     *
     */
    applicationEdge({ app }) {
      return { app };
    },

    /**
     *
     */
    fullName({ name, app, org }) {
      return [app.name, org.name, name].join(' > ');
    },

    /**
     *
     */
    namespace({ slug, app, org }) {
      return [app.slug, org.slug, slug].join('.');
    },

    /**
     *
     */
    organizationEdge({ org }) {
      return { org };
    },

    /**
     *
     */
    url({ urls }) {
      return urls[NODE_ENV];
    },
  },

  /**
   *
   */
  WorkspaceApplicationEdge: {
    /**
     *
     */
    node({ app }, _, { dataloaders }, info) {
      const projection = getProjectionForType(info);
      const localFields = ['_id', 'name', 'slug'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return app;
      return dataloaders.get('application').load({ value: app._id, projection, strict: true });
    },
  },

  /**
   *
   */
  WorkspaceOrganizationEdge: {
    /**
     *
     */
    node({ org }, _, { dataloaders }, info) {
      const projection = getProjectionForType(info);
      const localFields = ['_id', 'name', 'slug'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return org;
      return dataloaders.get('organization').load({ value: org._id, projection, strict: true });
    },
  },
};
