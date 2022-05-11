import { AuthContext } from '@parameter1/sso-graphql';
import { managementRepos, materializedRepos } from '../repos/index.js';

export default async ({ request } = {}) => {
  const dataloaders = await materializedRepos.createDataloaders();
  return {
    auth: AuthContext({
      managementRepos,
      header: request.headers.authorization,
    }),
    dataloaders,
    repos: materializedRepos,
  };
};
