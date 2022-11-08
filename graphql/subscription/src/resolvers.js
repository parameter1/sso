import { GraphQLObjectId } from '@parameter1/mongodb-graphql-types';
import { GraphQLDateTime } from '@parameter1/sso-graphql';
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
      resolve(result) {
        return { _id: result._id, result };
      },

      subscribe: withFilter(
        () => pubSubManager.asyncIterator(COMMAND_PROCESSED),
        async (result, { input }, { auth }) => {
          const userId = await auth.getUserId();

          const $or = [];
          input.for.forEach(({ entityType, commands, entityIds }) => {
            $or.push({
              entityType,
              ...(commands.length && { command: { $in: commands } }),
              ...(entityIds.length && { entityId: { $in: entityIds } }),
            });
          });

          const query = {
            ...($or.length && { $or }),
            userId,
          };
          const [match] = [result].filter(sift(query));
          return Boolean(match);
        },
      ),
    },
  },
};
