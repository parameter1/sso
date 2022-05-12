import { AuthContext } from '@parameter1/sso-graphql';
import repos from '../repos.js';

export default async ({ request } = {}) => {
  const dataloaders = await repos.createDataloaders();
  return {
    auth: AuthContext({
      managedRepos: repos,
      header: request.headers.authorization,
    }),
    dataloaders,
    ip: request.ip,
    repos,
    ua: request.headers['user-agent'],
    // @todo need to add ip and ua to context fields, or find a way to wrap the repo methods??
  };
};
