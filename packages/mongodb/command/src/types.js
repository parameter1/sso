/**
 * @typedef {import("@parameter1/sso-mongodb-core").ClientSession} ClientSession
 * @typedef {import("@parameter1/sso-mongodb-core").ObjectId} ObjectId
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreResult} EventStoreResult
 *
 * @typedef ChangeApplicationNameSchema
 * @property {ObjectId} entityId
 * @property {Date|string} [date]
 * @property {string} name
 * @property {ObjectId} [userId]
 *
 * @typedef CreateApplicationSchema
 * @property {ObjectId} [entityId]
 * @property {Date|string} [date]
 * @property {CreateApplicationSchemaValues} values
 * @property {ObjectId} [userId]
 *
 * @typedef CreateApplicationSchemaValues
 * @property {string} name
 * @property {string} key
 * @property {string[]} [roles=[Administrator, Member]]
 *
 * @typedef ReservationsReleaseParams
 * @property {ReservationsReleaseParamsInput|ReservationsReleaseParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReleaseParamsInput
 * @property {*} entityId
 * @property {string} key
 *
 * @typedef ReservationsReserveParams
 * @property {ReservationsReserveParamsInput|ReservationsReserveParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReserveParamsInput
 * @property {*} entityId
 * @property {string} key
 * @property {*} value
 */

export const _ = {};
