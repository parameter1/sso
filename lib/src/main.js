import loadIframe from './load-iframe';
import attachMessageListener from './attach-message-listener';
import { AuthToken } from './auth-token';

export default class SSO {
  constructor({
    appId,
    origin = 'https://sso.parameter1.com',
  }) {
    this.appId = appId;
    this.origin = origin;
  }

  async hasAuthToken() {
    await this.init();
    return AuthToken.exists();
  }

  async init() {
    const { origin } = this;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await loadIframe({ origin });
        attachMessageListener({ origin });
      })();
    }
    await this.initPromise;
  }
}
