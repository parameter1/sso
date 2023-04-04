import { Organization } from './organization.js';

export class OrgManager {
  /**
   *
   * @param {object} params
   * @param {Organization[]} params.orgs
   */
  constructor({ orgs = [] } = {}) {
    /** @type {Map<string, Organization>} */
    this.orgs = new Map();
    orgs.forEach((org) => this.add(org));
  }

  /**
   *
   * @param {Organization} organization
   * @returns {OrgManager}
   */
  add(organization) {
    if (!(organization instanceof Organization)) throw new Error('Invalid organization instance.');
    if (this.orgs.has(organization.key)) throw new Error(`The organization ${organization.key} already exists.`);
    this.orgs.set(organization.key, organization);
    return this;
  }
}
