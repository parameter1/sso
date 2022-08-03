import { isFunction as isFn } from '@parameter1/utils';
import { entityManager } from '../../mongodb.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const repo = entityManager.getMaterializedRepo('user');
  const pipeline = [
    { $match: { ...query } },
    {
      $project: {
        ...projection,
        email: 1,
        givenName: 1,
        familyName: 1,
      },
    },
    { $sort: { 'slug.reverse': 1, _id: 1 } },
  ];
  const cursor = await repo.aggregate({ pipeline });
  const users = await cursor.toArray();
  return users.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.familyName}, ${doc.givenName} [${doc.email}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
