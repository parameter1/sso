import { isFunction as isFn } from '@parameter1/utils';
import repos from '../../repos.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const cursor = await repos.$('organization').find({
    query: { ...query },
    options: { projection: { ...projection, name: 1, key: 1 }, sort: { name: 1 } },
  });

  const orgs = await cursor.toArray();
  return orgs.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.name} [${doc.key}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
