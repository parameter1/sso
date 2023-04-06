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

  /**
   * @return {Promise<object[]>}
   */
  async loadUsers() { // eslint-disable-line
    throw new Error('This method must be implemented by the extending class.');
  }

  static appendUserDates(doc) {
    if (doc.createdAt && doc.updatedAt) return doc;
    const d = { ...doc };
    if (!d.createdAt) d.createdAt = d._id.getTimestamp();
    if (!d.updatedAt) d.updatedAt = d.createdAt;
    return d;
  }
}
