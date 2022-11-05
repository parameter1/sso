import { EJSONClient } from '@parameter1/micro-ejson';

export class EntityMaterializerServiceClient extends EJSONClient {
  /**
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createIndexes() {
    const r = await this.request('createIndexes');
    return new Map(r);
  }
}
