import { Repo } from '@parameter1/mongodb';
import { PropTypes, attempt, validateAsync } from '@parameter1/prop-types';
import { dateToUnix } from '@parameter1/utils';
import jwt from 'jsonwebtoken';

import { DB_NAME } from '../constants.js';
import { mongoDBClientProp } from '../props.js';
import tokenProps from './props.js';

const { object, string } = PropTypes;

export class TokenRepo extends Repo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} params.tokenSecret
   */
  constructor(params) {
    const { client, tokenSecret } = attempt(params, object({
      client: mongoDBClientProp.required(),
      tokenSecret: string().required(),
    }).required());

    super({
      client,
      collectionName: 'tokens',
      dbName: DB_NAME,
      indexes: [
        { key: { audience: 1, subject: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      ],
      name: 'token',
    });
    this.tokenSecret = tokenSecret;
  }

  /**
   * Creates and returns a new token using the provided parameters.
   *
   * @param {object} params
   * @param {string} params.subject
   * @param {string} params.audience
   * @param {string} [params.issuer]
   * @param {number} [params.ttl=0]
   * @param {object} [params.data={}]
   *
   * @param {object} options
   * @param {object} [options.projection]
   * @param {ClientSession} [options.session]
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
    const collection = await this.collection();
    const { value } = await collection.findOneAndUpdate({ _id: { $lt: 0 } }, [{
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
   * @param {object} params
   * @param {string} params.subject
   * @param {string} params.audience
   * @param {string} [params.issuer]
   * @param {number} [params.ttl=0]
   * @param {object} [params.data={}]
   *
   * @param {object} options
   * @param {object} [options.projection]
   * @param {ClientSession} [options.session]
   */
  async createAndSign(params, { projection, session } = {}) {
    const doc = await this.createAndReturn(params, { projection, session });
    const signed = this.signDocument(doc);
    return { doc, signed };
  }

  /**
   * Invalidates/deletes a token by ID (jti) from the database.
   *
   * @param {object} params
   * @param {string} params.id The token ID/jti to delete
   * @param {object} [params.options]
   */
  async invalidate(params = {}) {
    const { id, options } = await validateAsync(object({
      id: tokenProps.id.required(),
      options: object().default({}),
    }).required(), params);
    const query = { _id: id };
    return this.deleteOne({ query, options });
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
   * @param {object} doc
   */
  signDocument(doc) {
    const payload = TokenRepo.toJWT(doc);
    return this.sign(payload);
  }

  /**
   * Verifies a signed token string.
   *
   * @param {object} params
   * @param {string} params.token
   * @param {string} params.subject
   * @param {object} [params.options]
   */
  async verify(params = {}) {
    const { token, subject, options } = await validateAsync(object({
      token: string().required(),
      subject: tokenProps.subject.required(),
      options: object().default({}),
    }).required(), params);

    const { createError } = Repo;
    try {
      // Verify the token signature.
      const verified = jwt.verify(token, this.tokenSecret, { algorithms: ['HS256'] });
      // Ensure the token exists in the db and matches the subject.
      const { jti } = verified;
      const doc = await this.findByObjectId({ id: jti, options: { ...options, strict: true } });
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
   * @param {object} doc
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
