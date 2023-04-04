import { AbstractSource } from './-abstract.js';

/**
 * @typedef {('leonis'|'tauron'|'virgon')} BaseCMSStackEnum
 */
const stacks = new Set(['leonis', 'tauron', 'virgon']);

export class BaseCMSSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {BaseCMSStackEnum} params.stack The BaseCMS stack, e.g. `tauron`
   * @param {string} params.key The BaseCMS tenant key, e.g. `acbm_fcp`
   */
  constructor({ stack, key }) {
    super({ kind: 'base-cms' });
    if (!stacks.has(stack)) throw new Error(`Invalid BaseCMS stack value: ${stack}`);
    if (/^[a-z0-9]+_[a-z0-9]+$/.test(key)) throw new Error(`Invalid BaseCMS tenant key: ${key}`);

    this.stack = stack;
    this.key = key;
  }
}
