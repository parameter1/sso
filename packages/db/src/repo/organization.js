import { ManagedRepo } from '@parameter1/mongodb';

export default class OrganizationRepo extends ManagedRepo {
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
      collatableFields: ['name'],
      indexes: [
        { key: { slug: 1 }, unique: true, collation: { locale: 'en_US' } },

        { key: { name: 1, _id: 1 }, collation: { locale: 'en_US' } },
        { key: { 'date.created': 1, _id: 1 } },
        { key: { 'date.updated': 1, _id: 1 } },
      ],
    });
  }
}
