import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { ejsonClient, covertActionError } from '@parameter1/sso-micro-ejson';

const { object, string } = PropTypes;

export class EntityMaterializerServiceClient {
  /**
   * @typedef EntityMaterializerServiceClientConstructorParams
   * @property {string} url
   *
   * @param {EntityMaterializerServiceClientConstructorParams} params
   */
  constructor(params) {
    /** @type {EntityMaterializerServiceClientConstructorParams} */
    const { url } = attempt(params, object({
      url: string().required(),
    }).required());

    this.client = ejsonClient({ url });
  }

  /**
   *
   * @param {string} action
   * @param {object} params
   */
  async request(action, params) {
    return covertActionError(() => this.client.request('action', params));
  }
}
