import { Repo } from '@parameter1/mongodb';
import { PropTypes, attempt } from '@parameter1/sso-prop-types';

import { DB_NAME } from '../../constants.js';
import { mongoDBClientProp } from '../../props.js';
import { eventProps } from '../../command/event-store.js';

const { array, object } = PropTypes;

export class BaseNormalizedRepo extends Repo {
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
      collectionName: `${entityType}/normalized`,
      dbName: DB_NAME,
      indexes,
      name: entityType,
    });
    this.entityType = entityType;
  }
}
