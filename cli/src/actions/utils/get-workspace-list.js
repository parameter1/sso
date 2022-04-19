import { isFunction as isFn } from '@parameter1/utils';
import repos from '../../repos.js';

export default async ({
  filter,
  disabledWhen,
  query,
  projection,
} = {}) => {
  const cursor = await repos.$('workspace').aggregate({
    pipeline: [
      { $match: { ...query } },
      {
        $lookup: {
          from: 'applications',
          foreignField: '_id',
          localField: 'application._id',
          as: 'application',
        },
      },
      {
        $lookup: {
          from: 'organizations',
          foreignField: '_id',
          localField: 'organization._id',
          as: 'organization',
        },
      },
      { $unwind: '$application' },
      { $unwind: '$organization' },
      {
        $project: {
          ...projection,
          'application._id': 1,
          'application.name': 1,
          'application.key': 1,

          'organization._id': 1,
          'organization.name': 1,
          'organization.key': 1,
          name: 1,
          key: 1,
        },
      },
    ],
  });

  const workspaces = await cursor.toArray();
  return workspaces.filter((doc) => {
    if (isFn(filter)) return filter(doc);
    return true;
  }).map((doc) => {
    const { application: app, organization: org } = doc;
    const name = [app.name, org.name, doc.name].join(' > ');
    const ns = [app.key, org.key, doc.key].join('.');
    return {
      name: `${name} [${ns}]`,
      value: doc,
      disabled: isFn(disabledWhen) ? disabledWhen(doc) : false,
    };
  });
};
