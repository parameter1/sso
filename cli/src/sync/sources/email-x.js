import { AbstractSource } from './-abstract.js';

export class EmailXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.key The EmailX tenant key, e.g. `acbm`
   */
  constructor({ key }) {
    super({ kind: 'email-x' });
    if (/^[a-z0-9]+$/.test(key)) throw new Error(`Invalid EmailX tenant key: ${key}`);

    this.key = key;
  }
}
