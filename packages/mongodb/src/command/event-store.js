import { Repo, runTransaction } from '@parameter1/mongodb';
import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';
import { DB_NAME } from '../constants.js';

const {
  any,
  boolean,
  date,
  object,
  objectId,
  oneOrMany,
  string,
} = PropTypes;

export const eventProps = {
  _id: objectId(),
  command: string().uppercase().pattern(/^[A-Z_]+$/),
  entityId: any().disallow(null, ''),
  entityType: string().valid('application', 'manager', 'member', 'organization', 'user', 'workspace'),
  date: date().allow('$$NOW'),
  omitFromHistory: boolean(),
  omitFromModified: boolean(),
  values: object(),
  userId: objectId().allow(null),
};

export function getEventSort() {
  return { entityId: 1, date: 1, _id: 1 };
}

/**
 * @typedef EventStoreDocument
 * @property {string} command The command name
 * @property {*} entityId The entity/document ID to assign to the values to
 * @property {string} entityType The entity type to assign to the values to
 * @property {Date|string} date The date of the event
 * @property {boolean} omitFromHistory Whether to omit the entry from the normalized history
 * @property {boolean} omitFromModified Whether to omit the date and user from the modified into
 * @property {object} values The values to push
 * @property {ObjectId|null} userId The user that pushed the command
 */
export const eventSchema = object({
  command: eventProps.command.required(),
  entityId: eventProps.entityId.required(),
  entityType: eventProps.entityType.required(),
  date: eventProps.date.default('$$NOW'),
  omitFromHistory: eventProps.omitFromHistory.default(false),
  omitFromModified: eventProps.omitFromModified.default(false),
  values: eventProps.values.default({}),
  userId: eventProps.userId.default(null),
}).required();

export class EventStore extends Repo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   */
  constructor(params) {
    const {
      client,
    } = attempt(params, object({
      client: mongoDBClientProp.required(),
    }).required());

    super({
      client,
      collectionName: 'event-store',
      dbName: DB_NAME,
      indexes: [
        { key: { entityId: 1, date: 1, _id: 1 } },
        { key: { entityId: 1, entityType: 1, command: 1 } },
        { key: { entityId: 1, entityType: 1 }, unique: true, partialFilterExpression: { command: 'CREATE' } },
      ],
      name: 'event store',
    });
  }

  /**
   * Pushes and persists one or more events to the store.
   *
   * @param {EventStoreDocument|EventStoreDocument[]} events
   * @param {object} options
   * @param {boolean} [options.returnResults=false]
   * @param {ClientSession} [options.session]
   * @returns {Promise<EventPushResult[]>}
   */
  async push(events, { returnResults = false, session: currentSession } = {}) {
    const prepared = await attempt(
      events,
      oneOrMany(eventSchema).required().label('event'),
    );
    const operations = prepared.map((event) => ({
      updateOne: {
        filter: { _id: { $lt: 0 } },
        update: [{ $replaceRoot: { newRoot: { $mergeObjects: [event, '$$ROOT'] } } }],
        upsert: true,
      },
    }));

    const push = async ({ session } = {}) => {
      const { result } = await this.bulkWrite({ operations, options: { session } });
      const eventMap = new Map();
      if (returnResults) {
        const eventIds = result.upserted.map(({ _id }) => _id);
        const cursor = await this.find({
          query: { _id: { $in: eventIds } },
          options: { projection: { values: 0 }, session },
        });
        const docs = await cursor.toArray();
        docs.forEach((doc) => eventMap.set(`${doc._id}`, doc));
      }
      return result.upserted.map((o) => ({
        ...o,
        entityId: prepared[o.index].entityId,
        event: eventMap.get(`${o._id}`),
        values: prepared[o.index].values || {},
      }));
    };

    let result;
    const useSession = currentSession || prepared.length > 1;
    if (useSession) {
      (result = await runTransaction(
        ({ session }) => push({ session }),
        { currentSession, client: this.client },
      ));
    } else {
      (result = await push());
    }
    return result;
  }

  static getEventSort() {
    return getEventSort();
  }
}
