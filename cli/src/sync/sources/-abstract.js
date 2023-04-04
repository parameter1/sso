/**
 * @typedef {('base-cms'|'email-x'|'identity-x'|'lead-management'|'native-x')} SyncSourceKind
 */
export const syncSourceKinds = new Set(['base-cms', 'email-x', 'identity-x', 'lead-management', 'native-x']);

export class AbstractSource {
  /**
   *
   * @param {object} params
   * @param {SyncSourceKind} params.kind The source kind, e.g. `base-cms`
   * @param {string} params.key A unique key for this source kind.
   */
  constructor({ kind, key }) {
    if (!syncSourceKinds.has(kind)) throw new Error(`Invalid sync source kind: ${kind}`);
    if (!key) throw new Error('A source key is required.');

    this.key = key;
    this.kind = kind;
  }
}
