import { AbstractSource } from './-abstract.js';

export class NativeXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.key The NativeX tenant key, e.g. `acbm`
   */
  constructor({ key }) {
    super({ kind: 'native-x' });
    if (/^[a-z0-9]$/.test(key)) throw new Error(`Invalid NativeX tenant key: ${key}`);

    this.key = key;
  }
}
