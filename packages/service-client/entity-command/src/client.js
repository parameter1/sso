import { PropTypes, attempt } from '@parameter1/sso-prop-types-core';
import { ejsonClient, covertActionError } from '@parameter1/sso-micro-ejson';

const { object, string } = PropTypes;

export class EntityCommandServiceClient {
  /**
   * @typedef EntityCommandServiceClientConstructorParams
   * @property {string} url
   *
   * @param {EntityCommandServiceClientConstructorParams} params
   */
  constructor(params) {
    /** @type {EntityCommandServiceClientConstructorParams} */
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
   * @returns {Promise<object|array|string>}
   */
  async request(action, params) {
    return covertActionError(() => this.client.request(action, params));
  }
}
