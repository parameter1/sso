import { isFunction as isFn } from '@parameter1/utils';
import repos from '../../repos.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const cursor = await repos.$('user').find({
    query: { ...query },
    options: {
      projection: {
        ...projection,
        email: 1,
        givenName: 1,
        familyName: 1,
      },
      sort: { familyName: 1 },
    },
  });

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
