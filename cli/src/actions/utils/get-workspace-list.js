import { isFunction as isFn } from '@parameter1/utils';
import { materializedRepoManager } from '../../mongodb.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const repo = materializedRepoManager.get('workspace');
  const pipeline = [
    { $match: { _deleted: false, ...query } },
    {
      $project: {
        ...projection,
        fullName: 1,
        name: 1,
        namespace: 1,
      },
    },
    { $sort: { path: 1, _id: 1 } },
  ];
  const workspaces = await repo.collection.aggregate(pipeline).toArray();
  return workspaces.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.fullName} [${doc.namespace.default}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
