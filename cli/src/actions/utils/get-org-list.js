import { isFunction as isFn } from '@parameter1/utils';
import { materializedRepoManager } from '../../mongodb.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const repo = materializedRepoManager.get('organization');
  const pipeline = [
    { $match: { _deleted: false, ...query } },
    { $sort: { slug: 1, _id: 1 } },
    {
      $project: {
        ...projection,
        name: 1,
        key: 1,
      },
    },
  ];
  const orgs = await repo.collection.aggregate(pipeline).toArray();
  return orgs.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.name} [${doc.key}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
