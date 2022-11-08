export { EventStore } from './event-store.js';

/**
 * @typedef EventStoreDocument
 * @property {string} command The command name
 * @property {Date|string} [date=$$NOW] The date of the event
 * @property {*} entityId The entity/document ID to assign to the values to
 * @property {string} entityId The entity type
 * @property {boolean} [omitFromHistory=false] Whether to omit the entry from the normalized history
 * @property {boolean} [omitFromModified=false] Whether to omit the date and user from modified
 * @property {object} [values={}] The values to push
 * @property {import("@parameter1/mongodb-bson").ObjectId} [userId] The user that pushed the command
 *
 * @typedef EventStoreResult
 * @property {ObjectId} _id
 * @property {string} command
 * @property {*} entityId
 * @property {string} entityType
 * @property {import("@parameter1/mongodb-bson").ObjectId} [userId]
 * @property {object} [values={}] The values to push
 */
