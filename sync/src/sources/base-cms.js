import basedb from '@parameter1/base-cms-db';
import { AbstractSource } from './-abstract.js';

const { createBaseDB } = basedb;
export class BaseCMSSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {import("@parameter1/base-cms-db").MongoDB} params.mongo
   * @param {string} params.tenant The BaseCMS tenant key, e.g. `acbm_fcp`
   */
  constructor({ mongo, tenant }) {
    if (!/^[a-z0-9]+_[a-z0-9]+$/.test(tenant)) throw new Error(`Invalid BaseCMS tenant key: ${tenant}`);

    super({ kind: 'base-cms', key: tenant });
    this.db = createBaseDB({ tenant, client: mongo });
    this.tenant = tenant;
    this.org = tenant.split('_').shift();
  }
}
