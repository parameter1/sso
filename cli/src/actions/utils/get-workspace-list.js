import { isFunction as isFn } from '@parameter1/utils';
import repos from '../../repos.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const cursor = await repos.$('workspace').find({
    query: { ...query },
    options: {
      projection: {
        ...projection,
        app: 1,
        org: 1,
        name: 1,
        slug: 1,
      },
      sort: { 'app.name': 1, 'org.name': 1, name: 1 },
    },
  });

  const workspaces = await cursor.toArray();
  return workspaces.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => {
    const { app, org } = doc;
    const name = [app.name, org.name, doc.name].join(' > ');
    const ns = [app.slug, org.slug, doc.slug].join('.');
    return {
      name: `${name} [${ns}]`,
      value: doc,
      disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
    };
  });
};
