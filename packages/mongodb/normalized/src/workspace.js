import { NormalizedRepo } from './-root.js';

export class NormalizedWorkspaceRepo extends NormalizedRepo {
  /**
   * @param {import("./-root").NormalizedRepoConstructorParams} params
   */
  constructor(params) {
    super({
      ...params,
      entityType: 'workspace',
      indexes: [
        { key: { appId: 1 } },
        { key: { orgId: 1 } },
      ],
    });
  }
}
