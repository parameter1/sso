/**
 * @typedef {import("@parameter1/sso-mongodb-core").ClientSession} ClientSession
 * @typedef {import("@parameter1/sso-mongodb-core").ObjectId} ObjectId
 * @typedef {import("@parameter1/sso-mongodb-event-store").EventStoreResult} EventStoreResult
 *
 * @typedef ReservationsReleaseParams
 * @property {ReservationsReleaseParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReleaseParamsInput
 * @property {*} entityId
 * @property {string} entityType
 * @property {string} key
 *
 * @typedef ReservationsReserveParams
 * @property {ReservationsReserveParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReserveParamsInput
 * @property {*} entityId
 * @property {string} entityType
 * @property {string} key
 * @property {*} value
 */

export const _ = {};
