import { RepoManager } from '@parameter1/mongodb';

import TokenRepo from './token.js';

export default class Repos extends RepoManager {
  /**
   * @todo create change history handlers via change streams
   *       only add items that have a modified date change
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {string} [params.dbBame=tenancy]
   * @param {string} params.tokenSecret
   */
  constructor({ client, dbName = 'sso-management', tokenSecret } = {}) {
    super({ client, dbName });
    this
      .add({ key: 'token', ManagedRepo: TokenRepo, tokenSecret });
  }
}
