import { isFunction as isFn } from '@parameter1/utils';
import repos from '../../repos.js';

export default async ({ filter, disabledWhen, projection } = {}) => {
  const cursor = await repos.$('user').find({
    query: {},
    options: {
      projection: { ...projection, email: 1, name: 1 },
      sort: { 'name.family': 1 },
    },
  });

  const users = await cursor.toArray();
  return users.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => ({
    name: `${doc.name.family}, ${doc.name.given} [${doc.email}]`,
    value: doc,
    disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
  }));
};
