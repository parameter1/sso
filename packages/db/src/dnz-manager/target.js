export default class DenormalizedTarget {
  constructor({ on, path = null, isArray = false } = {}) {
    const [repoName, rootField] = on.split('::').map((v) => v.trim());
    if (!repoName || !rootField) throw new Error('Unable to extract a repo name or root field name from the target.');
    this.repoName = repoName;
    this.rootField = rootField;
    this.path = path || null;
    this.isArray = Boolean(isArray);
  }

  getArrayFilterField() {
    if (!this.isArray) return null;
    const parts = ['elem'];
    if (this.path) parts.push(this.path);
    parts.push('_id');
    return parts.join('.');
  }

  /**
   *
   */
  getQueryIDField() {
    const parts = [this.rootField];
    if (this.path) parts.push(this.path);
    parts.push('_id');
    return parts.join('.');
  }

  /**
   *
   * @param {string} path
   * @returns {string}
   */
  getUpdateFieldPathFor(path) {
    return `${this.getUpdateFieldPrefix()}.${path}`;
  }

  /**
   *
   */
  getUpdateFieldPrefix() {
    const parts = [this.rootField];
    if (this.isArray) parts.push('$[elem]');
    if (this.path) parts.push(this.path);
    return parts.join('.');
  }
}
