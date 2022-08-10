import { PropTypes, attempt } from '@parameter1/prop-types';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';
import { ObjectId } from '@parameter1/mongodb';

import { CHANNEL_PREFIX } from './constants.js';

const {
  func,
  object,
  integer,
  string,
} = PropTypes;

export class PubSubManager {
  /**
   *
   * @param {object} params
   * @param {object} params.redis
   * @param {string} params.redis.host
   * @param {number} [params.redis.port=6379]
   * @param {function} [params.redis.retryStrategy]
   */
  constructor(params) {
    const { redis } = attempt(params, object({
      redis: object({
        host: string().required(),
        port: integer().default(6379),
        retryStrategy: func().default(() => (times) => Math.min(times * 50, 2000)),
      }).unknown().required(),
    }).required());

    const redisOptions = { ...redis, lazyConnect: true };
    const publisher = new Redis(redisOptions);
    const subscriber = new Redis(redisOptions);

    this.publisher = publisher;
    this.subscriber = subscriber;
    this.graphql = new RedisPubSub({ publisher, subscriber, reviver: PubSubManager.eventReviver });
  }

  /**
   * Subscribes to an event over GraphQL by creating an async iterator. Generally
   * used on GraphQL subscription resolvers.
   *
   * @param {string} eventName
   */
  asyncIterator(eventName) {
    const channelName = PubSubManager.getChannelFor(eventName);
    return this.graphql.asyncIterator(channelName);
  }

  /**
   * Connects the Redis publisher and subscriber clients.
   *
   * @returns {Promise<array>}
   */
  connect() {
    return Promise.all([
      this.publisher.connect(),
      this.subscriber.connect(),
    ]);
  }

  on(eventName, callback) {
    this.onMessage(({ channelName, body }) => {
      if (PubSubManager.getChannelFor(eventName) !== channelName) return;
      callback({ body });
    });
  }

  /**
   * Listens for message events on the Redis subscribing client. Usually used outside
   * of GraphQL resolvers.
   *
   * @param {function} callback
   */
  onMessage(callback) {
    this.subscriber.on('message', (channelName, json) => {
      const body = JSON.parse(json, PubSubManager.eventReviver);
      callback({ channelName, body });
    });
  }

  /**
   * Pings the Redis publisher and subscriber connections.
   *
   * @returns {Promise<array>}
   */
  ping() {
    return Promise.all([
      this.publisher.ping(),
      this.subscriber.ping(),
    ]);
  }

  /**
   * Publishes an event to GraphQL+Redis publisher. Can be listened to either
   * directly via `this.onMesssage` or with GraphQL using `this.asyncIterator`
   *
   * @param {string} eventName
   * @param {object} payload
   */
  publish(eventName, payload) {
    const channelName = PubSubManager.getChannelFor(eventName);
    return this.graphql.publish(channelName, payload);
  }

  /**
   *
   * @param {string} eventName
   */
  async subscribe(eventName) {
    const channelName = PubSubManager.getChannelFor(eventName);
    return this.subscriber.subscribe(channelName);
  }

  /**
   * Closes the Redis publisher and subscriber connections.
   *
   * @returns {Promise<array>}
   */
  quit() {
    return Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }

  /**
   *
   * @param {string} eventName
   */
  unsubscribe(eventName) {
    const channelName = PubSubManager.getChannelFor(eventName);
    return this.subscriber.unsubscribe(channelName);
  }

  static eventReviver(_, value) {
    if (!value) return value;
    if (typeof value !== 'string') return value;
    if (/^[a-f0-9]{24}$/.test(value)) return new ObjectId(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
      return new Date(value);
    }
    return value;
  }

  /**
   *
   * @param {string} eventName
   * @returns {string}
   */
  static getChannelFor(eventName) {
    return `${CHANNEL_PREFIX}.${eventName}`;
  }
}
