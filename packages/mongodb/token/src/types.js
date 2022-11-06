/**
 * @typedef TokenDocument
 * @property {ObjectId} _id
 * @property {string} subject
 * @property {string} audience
 * @property {Date} issuedAt
 * @property {Date} [expiresAt]
 * @property {number} [ttl=0]
 * @property {object} [data={}]
 *
 * @typedef CreateAndSignTokenResult
 * @property {TokenDocument} doc
 * @property {string} signed
 */

export const _ = {};
