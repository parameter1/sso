export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async applicationExists(_, { input }, { repos }) {
      const doc = await repos.$('application').findByObjectId({
        id: input._id,
        options: { projection: { _id: 1 } },
      });
      return Boolean(doc);
    },
  },
};
