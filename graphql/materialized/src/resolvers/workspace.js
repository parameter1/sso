export default {
  /**
   *
   */
  Query: {
    /**
     *
     */
    async workspaceExists(_, { input }, { repos }) {
      const { applicationId } = input;
      const doc = await repos.$('workspace').findOne({
        query: {
          _id: input._id,
          ...(applicationId && { '_edge.application.node._id': applicationId }),
        },
        options: { projection: { _id: 1 } },
      });
      return Boolean(doc);
    },
  },
};
