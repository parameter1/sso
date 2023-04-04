import { AbstractSource } from './-abstract.js';

export class EmailXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.tenant The EmailX tenant key, e.g. `acbm`
   */
  constructor({ tenant }) {
    if (!/^[a-z0-9]{2,}$/.test(tenant)) throw new Error(`Invalid EmailX tenant key: ${tenant}`);

    super({ kind: 'email-x', key: tenant });
    this.tenant = tenant;
  }
}
