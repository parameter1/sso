import { Workspace } from './workspace.js';

/**
 * @typedef {import("./sources/-abstract.js").SyncSourceKind} SyncSourceKind
 */
export class Organization {
  /**
   *
   * @param {object} params
   * @param {string} params.key
   * @param {string} params.name
   * @param {string} [params.website]
   * @param {Workspace[]} params.workspaces
   */
  constructor({
    key,
    name,
    website,
    workspaces = [],
  }) {
    if (!/^[a-z0-9][a-z0-9-]{0,}[a-z0-9]{1,}$/.test(key)) throw new Error(`Invalid organization key: ${key}`);
    if (!name) throw new Error(`Invalid organization name: ${name}`);
    this.key = key;
    this.name = name;
    this.website = website;

    /** @type {Map<string, Workspace>} */
    this.workspaces = new Map();
    workspaces.forEach((workspace) => this.addWorkspace(workspace));
  }

  /**
   *
   * @param {Workspace} workspace
   * @returns {Organization}
   */
  addWorkspace(workspace) {
    if (!(workspace instanceof Workspace)) throw new Error('Invalid workspace instance.');
    if (this.workspaces.has(workspace.key)) throw new Error(`The workspace ${workspace.key} already exists for org ${this.key}`);
    this.workspaces.set(workspace.key, workspace);
    return this;
  }

  hasId() {
    return Boolean(this._id);
  }

  /**
   *
   * @param {import("@parameter1/mongodb-core").ObjectId} _id
   */
  setId(_id) {
    this._id = _id;
  }
}
