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
   * @param {Workspace[]} params.workspaces
   */
  constructor({ key, name, workspaces = [] }) {
    if (!/^[a-z0-9]{2,}$/.test(key)) throw new Error(`Invalid organization key: ${key}`);
    if (!name) throw new Error(`Invalid organization name: ${name}`);
    this.key = key;
    this.name = name;

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
}
