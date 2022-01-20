import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import { dateToUnix } from '@parameter1/utils';
import jwt from 'jsonwebtoken';
import {
  tokenAttributes as tokenAttrs,
  userAttributes as userAttrs,
} from '../schema/attributes/index.js';

export default class TokenRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   * @param {string} params.tokenSecret
   * @param {...object} params.rest
   */
  constructor({ tokenSecret, ...rest } = {}) {
    if (!tokenSecret) throw new Error('A token secret must be provided.');
    super({
      ...rest,
      collectionName: 'tokens',
      collatableFields: [],
      indexes: [
        { key: { audience: 1, subject: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      ],
    });
    this.tokenSecret = tokenSecret;
  }

  /**
   * Creates, saves and signs a new token from the provided parameters.
   *
   * @param {object} params
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      subject,
      audience,
      issuer,
      issuedAt,
      ttl,
      expiresAt,
      data,
      options,
    } = await validateAsync(Joi.object({
      subject: tokenAttrs.subject.required(),
      audience: tokenAttrs.audience.required(),
      issuer: tokenAttrs.issuer,
      issuedAt: tokenAttrs.issuedAt.default(() => new Date()),
      ttl: tokenAttrs.ttl.default(0),
      data: tokenAttrs.data,
      options: Joi.object().default({}),
    }).required().external((obj) => {
      let exp;
      if (obj.ttl) exp = new Date((dateToUnix(obj.issuedAt) + obj.ttl) * 1000);
      return { ...obj, expiresAt: exp };
    }), params);

    const doc = await this.insertOne({
      doc: cleanDocument({
        subject,
        audience,
        issuer,
        issuedAt,
        ttl,
        expiresAt,
        data,
      }),
      options,
    });
    const signed = this.signDocument(doc);
    return { doc, signed };
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.userId
   * @param {object} [params.findOptions]
   * @param {object} [params.options]
   */
  async getOrCreateAuthToken(params = {}) {
    const { userId, findOptions, options } = await validateAsync(Joi.object({
      userId: userAttrs.id.required(),
      findOptions: Joi.object().default({}),
      options: Joi.object().default({}),
    }).required(), params);
    const query = { subject: 'auth', audience: userId };
    const doc = await this.findOne({ query, options: findOptions });
    if (doc) return { doc, signed: this.signDocument(doc) };
    return this.create({ ...query, ttl: 60 * 60 * 24, options });
  }

  /**
   * Invalidates/deletes a token by ID (jti) from the database.
   *
   * @param {object} params
   * @param {string} params.id The token ID/jti to delete
   * @param {object} [params.options]
   */
  async invalidate(params = {}) {
    const { id, options } = await validateAsync(Joi.object({
      id: tokenAttrs.id.required(),
      options: Joi.object().default({}),
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
    const { token, subject, options } = await validateAsync(Joi.object({
      token: Joi.string().required(),
      subject: tokenAttrs.subject.required(),
      options: Joi.object().default({}),
    }).required(), params);

    const { createError } = ManagedRepo;
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
