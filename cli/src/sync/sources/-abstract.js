/**
 * @typedef {('base-cms'|'email-x'|'identity-x'|'lead-management'|'native-x')} SyncSourceKind
 */
export const syncSourceKinds = new Set(['base-cms', 'email-x', 'identity-x', 'lead-management', 'native-x']);

export class AbstractSource {
  /**
   *
   * @param {object} params
   * @param {SyncSourceKind} params.kind The source kind, e.g. `base-cms`
   */
  constructor({ kind }) {
    if (!syncSourceKinds.has(kind)) throw new Error(`Invalid sync source kind: ${kind}`);

    this.kind = kind;
  }
}
