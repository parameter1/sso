export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async applicationKeyExists(_, { input }, { repos }) {
      console.log({ key: input.value });
      const doc = await repos.$('application').findOne({
        query: { key: input.value },
        options: { projection: { _id: 1 } },
      });
      return Boolean(doc);
    },
  },
};
