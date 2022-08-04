import { isFunction as isFn } from '@parameter1/utils';
import { entityManager } from '../../mongodb.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const repo = entityManager.getMaterializedRepo('workspace');
  const pipeline = [
    { $match: { _deleted: false, ...query } },
    {
      $project: {
        ...projection,
        fullName: 1,
        namespace: 1,
      },
    },
    { $sort: { path: 1, _id: 1 } },
  ];
  const cursor = await repo.aggregate({ pipeline });
  const apps = await cursor.toArray();
  return apps.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.fullName} [${doc.namespace.default}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
