import { AbstractSource } from './-abstract.js';

export class LeadManagementSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.tenant The lead management tenant key, e.g. `acbm`
   */
  constructor({ tenant }) {
    if (!/^[a-z0-9]{2,}$/.test(tenant)) throw new Error(`Invalid Lead Management tenant key: ${tenant}`);

    super({ kind: 'lead-management', key: tenant });
    this.tenant = tenant;
  }
}
