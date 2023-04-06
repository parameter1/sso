export { EventStore } from './event-store.js';

/**
 * @typedef EventStoreDocument
 * @property {string} command The command name
 * @property {Date|string} [date=$$NOW] The date of the event
 * @property {*} entityId The entity/document ID to assign to the values to
 * @property {string} entityType The entity type
 * @property {boolean} [omitFromHistory=false] Whether to omit the entry from the normalized history
 * @property {boolean} [omitFromModified=false] Whether to omit the date and user from modified
 * @property {string[]} [release] Keys of values to release along with this event.
 * @property {EventStoreDocumentReserve[]} [reserve] Values to reserve along with this event.
 * @property {object} [values={}] The values to push
 * @property {import("@parameter1/mongodb-bson").ObjectId} [userId] The user that pushed the command
 *
 * @typedef EventStoreDocumentReserve
 * @prop {string} key The field key to reserve.
 * @prop {*} value The value to reserve.
 *
 * @typedef EventStoreResult
 * @property {ObjectId} _id
 * @property {string} command
 * @property {*} entityId
 * @property {string} entityType
 * @property {import("@parameter1/mongodb-bson").ObjectId} [userId]
 * @property {object} [values={}] The pushed values
 */
