export { CommandHandler } from './handler.js';
export { Reservations } from './reservations.js';

/**
 * @typedef {import("@parameter1/sso-mongodb-core").ClientSession} ClientSession
 *
 * @typedef ReservationsReleaseParamsInput
 * @property {*} entityId
 * @property {string} key
 *
 * @typedef ReservationsReleaseParams
 * @property {ReservationsReleaseParamsInput|ReservationsReleaseParamsInput[]} input
 * @property {ClientSession} [session]
 *
 * @typedef ReservationsReserveParamsInput
 * @property {*} entityId
 * @property {string} key
 * @property {*} value
 *
 * @typedef ReservationsReserveParams
 * @property {ReservationsReserveParamsInput|ReservationsReserveParamsInput[]} input
 * @property {ClientSession} [session]
 */
