import merge from 'lodash.merge';
import { GraphQLObjectId } from '@parameter1/mongodb-graphql-types';
import { GraphQLDateTime } from '@parameter1/sso-graphql';

import user from './user.js';

export default merge({
  DateTime: GraphQLDateTime,
  ObjectID: GraphQLObjectId,

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
}, user);
