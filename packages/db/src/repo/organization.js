import { ManagedRepo } from '@parameter1/mongodb';

export default class OrganizationRepo extends ManagedRepo {
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
      collatableFields: ['name'],
      indexes: [
        [{ slug: 1 }, { unique: true, collation: { locale: 'en_US' } }],

        [{ name: 1, _id: 1 }, { collation: { locale: 'en_US' } }],
        { updatedAt: 1, _id: 1 },
      ],
    });
  }
}
