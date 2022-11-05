import { EJSONClient } from '@parameter1/micro-ejson';

export class EntityCommandServiceClient extends EJSONClient {
  /**
   *
   * @returns {Promise<Map<string, string[]>>}
   */
  async createIndexes() {
    const r = await this.request('createIndexes');
    return new Map(r);
  }
}
