import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import { sluggify } from '@parameter1/slug';
import { PropTypes, validateAsync } from '@sso/prop-types';

import { userProps } from '../../schema/index.js';

const { object } = PropTypes;

export default class UserRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'users',
      collatableFields: [],
      indexes: [
        { key: { email: 1 }, unique: true },
        { key: { email: 1, 'organizations._id': 1 }, unique: true },
        { key: { email: 1, 'workspaces._id': 1 }, unique: true },

        { key: { 'organizations._id': 1 } },
        { key: { 'workspaces._id': 1 } },

        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
        { key: { slug: 1, _id: 1 } },
      ],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.givenName
   * @param {string} params.familyName
   * @param {boolean} [params.verified]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      email,
      familyName,
      givenName,
      verified,
      options,
    } = await validateAsync(object({
      email: userProps.email.required(),
      familyName: userProps.familyName.required(),
      givenName: userProps.givenName.required(),
      verified: userProps.verified.default(false),
      options: object().default({}),
    }).required(), params);

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        date: { created: now, updated: now },
        email,
        domain: email.split('@')[1],
        familyName,
        givenName,
        loginCount: 0,
        organizations: [],
        previousEmails: [],
        slug: [familyName, givenName].map(sluggify).join('-'),
        verified,
        workspaces: [],
      }, { preserveEmptyArrays: true }),
      options,
    });
  }

  /**
   * Finds a user by email address.
   *
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  findByEmail({ email, options } = {}) {
    return this.findOne({ query: { email }, options });
  }
}
