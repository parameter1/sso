export { CommandHandlers } from './handlers.js';
export { Reservations } from './reservations.js';

export { applicationProps } from './props/application.js';

/**
 * @typedef {import("@parameter1/sso-mongodb-core").ClientSession} ClientSession
 * @typedef {import("./handlers/application").CreateApplicationSchema} CreateApplicationSchema
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
