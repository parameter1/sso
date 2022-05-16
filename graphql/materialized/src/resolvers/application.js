export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async applicationKeyExists(_, { input }, { repos }) {
      const doc = await repos.$('application').findOne({
        query: { key: input.key },
        options: { projection: { _id: 1 } },
      });
      return Boolean(doc);
    },
  },
};
