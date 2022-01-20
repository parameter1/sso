import { ManagedRepo } from '@parameter1/mongodb';

export default class UserRepo extends ManagedRepo {
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'users',
      collatableFields: ['email'],
      indexes: [
        [{ email: 1 }, { unique: true, collation: { locale: 'en_US' } }],

        { updatedAt: 1, _id: 1 },
      ],
    });
  }
}
