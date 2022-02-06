export default class DenormalizedTarget {
  constructor({ on, subPath = null, isArray = false } = {}) {
    if (typeof on !== 'string') throw new Error('The on value must be a string.');
    const [repoName, rootPath] = on.trim().split('::').map((v) => v.trim());
    if (!repoName || !rootPath) throw new Error('Unable to extract a repo name or root field name from the target.');
    this.repoName = repoName;
    this.rootPath = rootPath;
    this.subPath = subPath || null;
    this.isArray = Boolean(isArray);
  }

  getArrayFilterField() {
    if (!this.isArray) return null;
    const parts = ['elem'];
    if (this.subPath) parts.push(this.subPath);
    parts.push('_id');
    return parts.join('.');
  }

  /**
   *
   */
  getQueryIDField() {
    const parts = [this.rootPath];
    if (this.subPath) parts.push(this.subPath);
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
    const parts = [this.rootPath];
    if (this.isArray) parts.push('$[elem]');
    if (this.subPath) parts.push(this.subPath);
    return parts.join('.');
  }
}
