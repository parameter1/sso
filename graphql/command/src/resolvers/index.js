import merge from 'lodash.merge';
import { ObjectId } from '@parameter1/sso-mongodb';
import { GraphQLDateTime, GraphQLObjectId } from '@parameter1/graphql/scalars';
import { withFilter } from 'graphql-subscriptions';
import { pubSubManager, COMMAND_PROCESSED } from '../pubsub.js';

import event from './event.js';
import user from './user.js';

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

  /**
   *
   */
  Subscription: {
    currentUserEventProcessed: {
      // resolve(payload) {
      //   return payload;
      // },
      subscribe: withFilter(
        () => pubSubManager.asyncIterator(COMMAND_PROCESSED),
        async (payload, { input }, { auth }) => {
          const userId = await auth.getUserId();
          if (payload.entityType !== 'user' || `${userId}` !== `${payload.entityId}`) return false;
          const commands = new Set(input.commands);
          if (commands.size && !commands.has(payload.command)) return false;
          return true;
        },
      ),
    },
  },
}, event, user);
