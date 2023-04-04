import { AbstractSource } from './-abstract.js';

export class LeadManagementSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.key The lead management tenant key, e.g. `acbm`
   */
  constructor({ key }) {
    super({ kind: 'lead-management' });
    if (/^[a-z0-9]+$/.test(key)) throw new Error(`Invalid Lead Management tenant key: ${key}`);

    this.key = key;
  }
}
