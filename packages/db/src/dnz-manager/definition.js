import DenormalizedField from './field.js';
import DenormalizedTarget from './target.js';

export default class DenormalizedFieldDefintion {
  /**
   *
   * @param {object} params
   * @param {DenormalizedTarget} params.target
   * @param {object[]} params.fields
   */
  constructor({ target, fields = [] }) {
    if (!fields.length) throw new Error('At least one field must be defined for each target');
    if (!(target instanceof DenormalizedTarget)) throw new Error('Target must be an instanceof DenormalizedTarget');
    this.target = target;
    this.fields = fields.reduce((map, params) => {
      const field = new DenormalizedField(params);
      map.set(field.name, field);
      return map;
    }, new Map());
  }

  /**
   *
   * @param {function} cb
   */
  forEach(cb) {
    this.fields.forEach((field) => {
      cb(field, this.target);
    });
  }

  /**
   * @todo Do this need to account for Joi schemas??
   */
  buildBulkOpFor({ id, values = {} }) {
    if (!id) throw new Error('The foreign, denormalized model ID is required.');
    const { target } = this;
    const arrayFilterField = target.getArrayFilterField();

    const $set = {};
    let hasUpdate = false;
    this.getUpdateFieldPaths().forEach((path, field) => {
      const value = values[field];
      // @todo undefined should be skipped, null should be validated for required
      // and then unset if allowed. also need to handle empty strings
      if (value == null) return;
      hasUpdate = true;
      $set[path] = value;
    });

    if (!hasUpdate) return null;
    return {
      updateMany: {
        filter: { [target.getQueryIDField()]: id },
        update: { $set },
        ...(arrayFilterField && { arrayFilters: [{ [arrayFilterField]: id }] }),
      },
    };
  }

  getUpdateFieldPaths() {
    const map = new Map();
    this.fields.forEach((field) => {
      map.set(field.name, this.target.getUpdateFieldPathFor(field.name));
    });
    return map;
  }
}
