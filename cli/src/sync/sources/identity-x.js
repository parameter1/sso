import { ObjectId } from '@parameter1/mongodb-core';
import { AbstractSource } from './-abstract.js';

export class IdentityXSource extends AbstractSource {
  /**
   *
   * @param {object} params
   * @param {string} params.org The IdentityX organization ID
   */
  constructor({ org }) {
    super({ kind: 'identity-x' });
    if (/^[a-f0-9]{24}$/.test(`${org}`)) throw new Error(`Invalid IdentityX org ID: ${org}`);

    this.org = new ObjectId(`${org}`);
  }
}
