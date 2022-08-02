import { Repo, runTransaction } from '@parameter1/mongodb';
import { PropTypes, attempt } from '@parameter1/prop-types';
import { mongoDBClientProp } from '../props.js';
import { DB_NAME } from '../constants.js';
import { eventProps } from './event-store.js';

const {
  any,
  object,
  oneOrMany,
  string,
} = PropTypes;

export const reservationProps = {
  entityId: eventProps.entityId,
  entityType: eventProps.entityType,
  key: string(),
  value: any().invalid(null),
};

/**
 * @typedef ReservationDocument
 * @property {string} entityId The entity ID that owns the reservation
 * @property {string} entityType The entity type to assign to reserve the value for
 * @property {string} key The field key to reserve the value for
 * @property {*} value The value to reserve
 */
export const reservationSchema = object({
  entityId: reservationProps.entityId.required(),
  entityType: reservationProps.entityType.required(),
  key: reservationProps.key.required(),
  value: reservationProps.value.required(),
}).required();

export class ReservationsRepo extends Repo {
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
      collectionName: 'reservations',
      dbName: DB_NAME,
      indexes: [
        { key: { entityId: 1 } },
        { key: { value: 1, key: 1, entityType: 1 }, unique: true },
      ],
      name: 'reservation',
    });
  }

  /**
   * Releases one or more entity field values.
   *
   * @param {ReservationDocument|ReservationDocument[]} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   * @returns {Promise<object>}
   */
  async release(params, { session: currentSession } = {}) {
    const prepared = await attempt(
      params,
      oneOrMany(reservationProps).required().label('reservation'),
    );
    const operations = prepared.map((event) => ({
      deleteOne: { filter: event },
    }));
    const useSession = currentSession || prepared.length > 1;
    let result;
    if (useSession) {
      result = await runTransaction(
        ({ session }) => this.bulkWrite({ operations, options: { session } }),
        { currentSession, client: this.client },
      );
    } else {
      result = await this.bulkWrite({ operations });
    }
    return result;
  }

  /**
   * Reserves one or more entity field values.
   *
   * @param {ReservationDocument|ReservationDocument[]} params
   * @param {object} options
   * @param {ClientSession} [options.session]
   * @returns {Promise<object>}
   */
  async reserve(params, { session: currentSession } = {}) {
    const prepared = await attempt(
      params,
      oneOrMany(reservationSchema).required().label('reservation'),
    );
    const operations = prepared.map((event) => ({
      insertOne: { document: event },
    }));
    const useSession = currentSession || prepared.length > 1;
    let result;
    if (useSession) {
      result = await runTransaction(
        ({ session }) => this.bulkWrite({ operations, options: { session } }),
        { currentSession, client: this.client },
      );
    } else {
      result = await this.bulkWrite({ operations });
    }
    return result;
  }
}
