import merge from 'lodash.merge';
import { ObjectId } from '@parameter1/sso-mongodb';
import { GraphQLDateTime, GraphQLObjectId } from '@parameter1/graphql/scalars';

export default merge({
  DateTime: GraphQLDateTime,
  ObjectID: GraphQLObjectId(ObjectId),

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    ping() {
      return 'pong';
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    ping() {
      return 'pong';
    },
  },
});
