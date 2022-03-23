import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, validateAsync } from '@sso/prop-types';

import cleanDocument from '../../utils/clean-document.js';
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
        { key: { givenName: 1, familyName: 1, _id: 1 }, collation: { locale: 'en_US' } },
        { key: { familyName: 1, givenName: 1, _id: 1 }, collation: { locale: 'en_US' } },
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
        date: {
          created: now,
          lastLoggedIn: null,
          lastSeen: null,
          updated: now,
        },
        email,
        domain: email.split('@')[1],
        familyName,
        givenName,
        loginCount: 0,
        organizations: [],
        previousEmails: [],
        verified,
        workspaces: [],
      }),
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
