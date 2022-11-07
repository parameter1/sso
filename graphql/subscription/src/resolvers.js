import { GraphQLObjectId } from '@parameter1/mongodb-graphql-types';
import { addArrayFilter, GraphQLDateTime } from '@parameter1/sso-graphql';
import { withFilter } from 'graphql-subscriptions';
import sift from 'sift';
import { pubSubManager, COMMAND_PROCESSED } from './pubsub.js';

export default {
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

  /**
   *
   */
  Subscription: {
    /**
     *
     */
    currentUserCommandProcessed: {
      resolve(payload) {
        return { _id: payload.result._id, ...payload };
      },

      subscribe: withFilter(
        () => pubSubManager.asyncIterator(COMMAND_PROCESSED),
        async ({ result }, { input }, { auth }) => {
          const userId = await auth.getUserId();
          const query = {
            ...addArrayFilter('_id', input._id),
            ...addArrayFilter('command', input.command),
            entityType: 'user',
            userId,
          };
          const [match] = [result].filter(sift(query));
          return Boolean(match);
        },
      ),
    },
  },
};
