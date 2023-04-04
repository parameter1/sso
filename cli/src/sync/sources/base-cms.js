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
   * @param {string} params.tenant The BaseCMS tenant key, e.g. `acbm_fcp`
   */
  constructor({ stack, tenant }) {
    if (!stacks.has(stack)) throw new Error(`Invalid BaseCMS stack value: ${stack}`);
    if (/^[a-z0-9]+_[a-z0-9]+$/.test(tenant)) throw new Error(`Invalid BaseCMS tenant key: ${tenant}`);

    super({ kind: 'base-cms', key: `${stack}:${tenant}` });
    this.stack = stack;
    this.tenant = tenant;
  }
}
