import { ManagedRepo } from '@parameter1/mongodb';
import { PropTypes, attempt } from '@parameter1/prop-types';

const DELETED_PATH = '_deleted';

const { boolean, object } = PropTypes;

export default class AbstractMaterializedRepo extends ManagedRepo {
  constructor(params) {
    const {
      usesSoftDelete,
      indexes,
      ...rest
    } = attempt(params, object({
      usesSoftDelete: boolean().default(true),
    }).required().unknown());

    super({
      ...rest,
      // ensure unique indexes exclude soft-deleted items
      indexes: usesSoftDelete ? (indexes || []).map((index) => {
        if (index.unique) return index;
        return {
          ...index,
          partialFilterExpression: {
            ...index.partialFilterExpression,
            [DELETED_PATH]: false,
          },
        };
      }) : indexes,
      // ensure soft-deleted documents are excluded from all queries.
      globalFindCriteria: usesSoftDelete ? { [DELETED_PATH]: false } : undefined,
    });
    this.usesSoftDelete = usesSoftDelete;
  }
}
