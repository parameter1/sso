import { AbstractSource } from './sources/-abstract.js';

/**
 * @typedef {import("./sources/-abstract.js").SyncSourceKind} SyncSourceKind
 */
export class Workspace {
  /**
   *
   * @param {object} params
   * @param {string} [params.key=default]
   * @param {string} [params.name=Default]
   * @param {AbstractSource[]} params.sources
   */
  constructor({ key = 'default', name = 'Default', sources = [] } = {}) {
    if (!/^[a-z0-9][a-z0-9-]{0,}[a-z0-9]$/.test(key)) throw new Error(`Invalid workspace key: ${key}`);
    if (!name) throw new Error(`Invalid workspace name: ${name}`);
    this.key = key;
    this.name = name;

    /** @type {Map<SyncSourceKind, Map<string, AbstractSource>>} */
    this.sources = new Map();
    sources.forEach((source) => this.addSource(source));
  }

  /**
   *
   * @param {AbstractSource} source
   * @returns {Workspace}
   */
  addSource(source) {
    if (!(source instanceof AbstractSource)) throw new Error('The source must be an instance of AbstractSource.');
    const { sources } = this;
    if (!sources.has(source.kind)) sources.set(source.kind, new Map());
    const forKind = sources.get(source.kind);
    if (forKind.has(source.key)) throw new Error(`A ${source.kind} source already exists for ${source.key} on workspace ${this.key}`);
    forKind.set(source.key, source);
    return this;
  }
}
