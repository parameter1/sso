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
    async application({ app }, _, { dataloaders }, info) {
      const projection = getProjectionForType(info);
      const localFields = ['_id', 'name', 'slug'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return app;
      return dataloaders.get('application').load({ value: app._id, projection, strict: true });
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
    async organization({ org }, _, { dataloaders }, info) {
      const projection = getProjectionForType(info);
      const localFields = ['_id', 'name', 'slug'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return org;
      return dataloaders.get('organization').load({ value: org._id, projection, strict: true });
    },

    /**
     *
     */
    url({ urls }) {
      return urls[NODE_ENV];
    },
  },
};
