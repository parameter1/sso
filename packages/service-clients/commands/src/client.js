import { EJSONClient } from '@parameter1/micro-ejson';

export class CommandServiceClient extends EJSONClient {
  constructor(...args) {
    super(...args);

    this.foo = 'nar';
  }
}
