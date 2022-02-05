import { RepoManager } from '@parameter1/mongodb';
import DenormalizedTarget from './target.js';
import DenormalizedFieldDefintion from './definition.js';

export default class DenormalizationManager {
  constructor({ repoManager, definitions, globalFields = [] } = {}) {
    if (!(repoManager instanceof RepoManager)) throw new Error('The repoManager must be an instanceof RepoManager');
    this.repoManager = repoManager;
    this.map = new Map();

    this.globalFields = globalFields;
    this.fieldTargetMap = new Map();
    definitions.forEach(([on, params]) => {
      this.addDefinition(on, params);
    });
  }

  /**
   *
   * @param {function} cb
   */
  forEach(cb) {
    this.map.forEach(cb);
  }

  /**
   *
   * @param {string} on The repo name + root field target, e.g. `workspace::app`
   * @param {object} params
   * @param {string?} [params.path=null] The optional subpath
   * @param {boolean} [params.isArray=false] Whether the target field is an array of docs
   * @param {object[]} params.fields The field definitions on this target doc
   *                                 Global fields will be merged with these.
   * @param {string} params.fields.name The field name/key
   * @param {object} params.fields.schema The field Joi schema
   * @returns {DenormalizedFields}
   */
  addDefinition(on, {
    path = null,
    isArray = false,
    fields = [],
  } = {}) {
    const target = new DenormalizedTarget({ on, path, isArray });
    this.map.set(on, new DenormalizedFieldDefintion({
      target, fields: [...this.globalFields, ...fields],
    }));
    return this;
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {object} params.value
   * @param {object} [params.options]
   * @returns {object[]}
   */
  buildRepoBulkOpsFor({ id, values = {} }) {
    return [...this.map].map(([, definition]) => {
      const op = definition.buildBulkOpFor({ id, values });
      const { repoName } = definition.target;
      // @todo add object hash to ops?
      return { repoName, op };
    }).filter(({ op }) => op); // filter out noops
  }

  /**
   *
   * @param {object} params
   * @param {object[]} params.repoBulkOps
   * @param {object} params.options
   */
  async executeRepoBulkOps({ repoBulkOps = [], options }) {
    if (!repoBulkOps.length) return [];
    const mappedByRepo = repoBulkOps.reduce((map, { repoName, op }) => {
      if (!map.has(repoName)) map.set(repoName, []);
      if (op) map.get(repoName).push(op);
      return map;
    }, new Map());
    return Promise.all(
      [...mappedByRepo].map(async ([
        repoName,
        operations,
      ]) => this.repoManager.$(repoName).bulkWrite({ operations, options })),
    );
  }
}
