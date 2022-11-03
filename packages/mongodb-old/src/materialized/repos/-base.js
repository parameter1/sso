import { Repo, MongoDBDataLoader } from '@parameter1/mongodb';
import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';

import { DB_NAME } from '../../constants.js';
import { mongoDBClientProp } from '../../props.js';
import { eventProps } from '../../command/event-store.js';

const { array, object } = PropTypes;

export class BaseMaterializedRepo extends Repo {
  /**
   *
   * @param {object} params
   * @param {MongoDBClient} params.client
   * @param {object[]} [params.indexes=[]]
   * @param {string} params.entityType
   */
  constructor(params) {
    const {
      client,
      indexes,
      entityType,
    } = attempt(params, object({
      client: mongoDBClientProp.required(),
      entityType: eventProps.entityType.required(),
      indexes: array().items(object()).default([]),
    }).required());

    super({
      client,
      collectionName: `${entityType}/materialized`,
      dbName: DB_NAME,
      indexes,
      name: entityType,
    });
    this.entityType = entityType;
  }

  /**
   * Creates and returns a new dataloader instance for this repo.
   *
   * Multiple calls will create separate instances and cache will not be shared
   * between them.
   */
  async createDataloader(params = {}) {
    const collection = await this.collection();
    return new MongoDBDataLoader({
      ...params,
      name: this.name,
      collection,
      logger: this.logger,
      criteria: { _deleted: false },
    });
  }
}
