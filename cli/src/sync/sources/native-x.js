import { AbstractSource } from './-abstract.js';

export class NativeXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.tenant The NativeX tenant key, e.g. `acbm`
   */
  constructor({ tenant }) {
    if (/^[a-z0-9]$/.test(tenant)) throw new Error(`Invalid NativeX tenant key: ${tenant}`);

    super({ kind: 'native-x', key: tenant });
    this.tenant = tenant;
  }
}
