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

  /**
   *
   * @param {string} key
   * @returns {Organization|undefined}
   */
  get(key) {
    return this.orgs.get(key);
  }

  /**
   * @typedef OrgManagerSource
   * @prop {Organization} org
   * @prop {import("./workspace.js").Workspace} workspace
   * @prop {import("./sources/-abstract.js").AbstractSource} source
   *
   * @returns {OrgManagerSource[]}
   */
  getAllSources() {
    const sources = [];
    this.orgs.forEach((org) => {
      org.workspaces.forEach((workspace) => {
        workspace.sources.forEach((map) => {
          map.forEach((source) => {
            sources.push({
              org,
              workspace,
              source,
            });
          });
        });
      });
    });
    return sources;
  }
}
