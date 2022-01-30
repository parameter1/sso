const { NODE_ENV } = process.env;

export default {
  /**
   *
   */
  Workspace: {
    /**
     *
     */
    url({ urls }) {
      return urls[NODE_ENV];
    },
  },
};
