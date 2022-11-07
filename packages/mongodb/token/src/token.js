import { PropTypes, attempt, validateAsync } from '@parameter1/sso-prop-types-core';
import { ObjectId } from '@parameter1/mongodb-bson';
import { mongoClientProp } from '@parameter1/mongodb-prop-types';
import { dateToUnix } from '@parameter1/utils';
import jwt from 'jsonwebtoken';

import { tokenProps } from './props.js';

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const { object, string } = PropTypes;

/**
 * @typedef {import("@parameter1/mongodb-core").MongoClient} MongoClient
 * @typedef {import("@parameter1/mongodb-bson").ObjectId} ObjectId
 *
 * @typedef {import("./types").TokenDocument} TokenDocument
 * @typedef {import("./types").CreateAndSignTokenResult} CreateAndSignTokenResult
 *
 * @typedef CreateTokenParams
 * @property {string} subject
 * @property {string} audience
 * @property {string} [issuer]
 * @property {number} [ttl=0]
 * @property {object} [data={}]
 *
 * @typedef CreateTokenOptions
 * @property {object} [projection]
 * @property {import("@parameter1/mongodb-core").ClientSession} [session]
 */
export class TokenRepo {
  /**
   * @typedef ConstructorParams
   * @property {MongoClient} mongo
   * @property {string} tokenSecret
   *
   * @param {ConstructorParams} params
   */
  constructor(params) {
    /** @type {ConstructorParams} */
    const { mongo, tokenSecret } = attempt(params, object({
      mongo: mongoClientProp.required(),
      tokenSecret: string().required(),
    }).required());

    /** @type {import("@parameter1/mongodb-core").Collection} */
    this.collection = mongo.db('sso').collection('tokens');

    /** @type {string} */
    this.tokenSecret = tokenSecret;
  }

  /**
   * Creates and returns a new token using the provided parameters.
   *
   * @param {CreateTokenParams} params
   * @param {CreateTokenOptions} options
   * @returns {Promise<TokenDocument>}
   */
  async createAndReturn(params, { projection, session } = {}) {
    const doc = await validateAsync(object({
      subject: tokenProps.subject.required(),
      audience: tokenProps.audience.required(),
      issuer: tokenProps.issuer,
      ttl: tokenProps.ttl.default(0),
      data: tokenProps.data.default({}),
    }).custom((token) => {
      const { ttl } = token;
      return {
        ...token,
        issuedAt: '$$NOW',
        ...(ttl && {
          expiresAt: { $add: ['$$NOW', ttl * 1000] },
        }),
      };
    }).required(), params);
    const { value } = await this.collection.findOneAndUpdate({ _id: { $lt: 0 } }, [{
      $replaceRoot: { newRoot: { $mergeObjects: [doc, '$$ROOT'] } },
    }], {
      projection,
      returnDocument: 'after',
      session,
      upsert: true,
    });
    return value;
  }

  /**
   * Creates, saves and signs a new token using the provided parameters.
   *
   * @typedef CreateAndSignResult
   * @property {TokenDocument} doc
   * @property {string} signed
   *
   * @param {CreateTokenParams} params
   * @param {CreateTokenOptions} options
   * @returns {Promise<CreateAndSignResult>}
   */
  async createAndSign(params, { projection, session } = {}) {
    const doc = await this.createAndReturn(params, { projection, session });
    const signed = this.signDocument(doc);
    return { doc, signed };
  }

  /**
   * Creates the database indexes for this repo.
   *
   * @returns {Promise<string[]>}
   */
  async createIndexes() {
    return this.collection.createIndexes([
      { key: { audience: 1, subject: 1 } },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
    ]);
  }

  /**
   * Invalidates/deletes a token by ID (jti) from the database.
   *
   * @typedef InvalidateParams
   * @property {string} id
   * @property {import("mongodb").DeleteOptions} [options]
   *
   * @param {InvalidateParams} params
   * @returns {Promise<import("mongodb").DeleteResult>}
   */
  async invalidate(params) {
    /** @type {InvalidateParams} */
    const { id, options } = await validateAsync(object({
      id: tokenProps.id.required(),
      options: object(),
    }).required(), params);
    return this.collection.deleteOne({ _id: id }, options);
  }

  /**
   * Signs a JWT payload.
   *
   * @param {object} payload
   */
  sign(payload) {
    return jwt.sign(payload, this.tokenSecret);
  }

  /**
   * Signs a MongoDB token document.
   *
   * @param {TokenDocument} doc
   */
  signDocument(doc) {
    const payload = TokenRepo.toJWT(doc);
    return this.sign(payload);
  }

  /**
   * Verifies a signed token string.
   *
   * @typedef VerifyResult
   * @property {TokenDocument} doc
   * @property {string} signed
   *
   * @typedef VerifyParams
   * @property {string} token
   * @property {string} subject
   * @property {import("mongodb").FindOptions} [options]
   *
   * @param {VerifyParams} params
   * @returns {Promise<VerifyResult>}
   */
  async verify(params) {
    /** @type {VerifyParams} */
    const { token, subject, options } = await validateAsync(object({
      token: string().required(),
      subject: tokenProps.subject.required(),
      options: object(),
    }).required(), params);

    try {
      // Verify the token signature.
      const verified = jwt.verify(token, this.tokenSecret, { algorithms: ['HS256'] });
      // Ensure the token exists in the db and matches the subject.
      const { jti } = verified;
      const doc = await this.collection.findOne({ _id: new ObjectId(jti) }, options);
      if (!doc) throw createError(404, 'No token was found for the provided value.');
      if (subject !== doc.subject) throw createError(409, 'The token subject does not match.');
      return { doc, signed: token };
    } catch (e) {
      switch (e.message) {
        case 'invalid signature':
          throw createError(401, 'The token signature is invalid.');
        case 'jwt expired':
          throw createError(401, 'The provided token has expired.');
        case 'jwt malformed':
          throw createError(422, 'The provided value is not a valid token.');
        default:
          throw e;
      }
    }
  }

  /**
   * Converts a MongoDB token doc to a JWT payload.
   *
   * @typedef JWTDocument
   * @property {ObjectId} jti
   * @property {string} sub
   * @property {string} [iss]
   * @property {string} aud
   * @property {number} iat
   * @property {number} [exp]
   * @property {object} [data]
   *
   * @param {TokenDocument} doc
   * @returns {JWTDocument}
   */
  static toJWT(doc) {
    const { expiresAt } = doc;
    const exp = expiresAt ? dateToUnix(expiresAt) : undefined;
    return {
      jti: doc._id,
      sub: doc.subject,
      iss: doc.issuer,
      aud: doc.audience,
      iat: dateToUnix(doc.issuedAt),
      ...(exp && { exp }),
      data: doc.data,
    };
  }
}
