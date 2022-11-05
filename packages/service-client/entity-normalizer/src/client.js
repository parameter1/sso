import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { ejsonClient, covertActionError } from '@parameter1/sso-micro-ejson';

const { object, string } = PropTypes;

export class EntityNormalizerServiceClient {
  /**
   * @typedef EntityNormalizerServiceClientConstructorParams
   * @property {string} url
   *
   * @param {EntityNormalizerServiceClientConstructorParams} params
   */
  constructor(params) {
    /** @type {EntityNormalizerServiceClientConstructorParams} */
    const { url } = attempt(params, object({
      url: string().required(),
    }).required());

    this.client = ejsonClient({ url });
  }

  /**
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createIndexes() {
    const r = await this.request('createIndexes');
    return new Map(r);
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
