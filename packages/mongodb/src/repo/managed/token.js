import { PipelinedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@parameter1/prop-types';
import { dateToUnix } from '@parameter1/utils';
import jwt from 'jsonwebtoken';

import { tokenProps, tokenSchema, userProps } from '../../schema/index.js';

const { boolean, object, string } = PropTypes;

export default class TokenRepo extends PipelinedRepo {
  /**
   *
   * @param {object} params
   * @param {string} params.tokenSecret
   * @param {object} params.rest
   */
  constructor({ tokenSecret, ...rest } = {}) {
    if (!tokenSecret) throw new Error('A token secret must be provided.');
    super({
      ...rest,
      collectionName: 'tokens',
      indexes: [
        { key: { audience: 1, subject: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      ],
      schema: tokenSchema,
    });
    this.tokenSecret = tokenSecret;
  }

  /**
   * Creates, saves and signs a new token from the provided parameters.
   *
   * @param {object} params
   */
  async createAndSignToken(params) {
    const doc = await this.createAndReturn(params);
    const signed = this.signDocument(doc);
    return { doc, signed };
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.userId
   * @param {boolean} [params.impersonated=false]
   * @param {object} [params.session]
   */
  async getOrCreateAuthToken(params = {}) {
    const {
      userId,
      impersonated,
      session,
    } = await validateAsync(object({
      userId: userProps.id.required(),
      impersonated: boolean().default(false),
      session: object(),
    }).required(), params);
    const query = {
      subject: 'auth',
      audience: userId,
      'data.impersonated': impersonated ? true : { $ne: true },
    };
    const doc = await this.findOne({ query, options: { session } });
    if (doc) return { doc, signed: this.signDocument(doc) };
    return this.createAndSignToken({
      doc: {
        subject: 'auth',
        audience: userId,
        data: { ...(impersonated && { impersonated: true }) },
        ttl: impersonated ? 60 * 60 : 60 * 60 * 24,
      },
      session,
    });
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

    const { createError } = PipelinedRepo;
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
