import { AuthContext } from '@parameter1/sso-graphql';
import { managedRepos, materializedRepos } from '../repos/index.js';

export default async ({ request } = {}) => {
  const dataloaders = await materializedRepos.createDataloaders();
  return {
    auth: AuthContext({
      managedRepos,
      header: request.headers.authorization,
    }),
    dataloaders,
    repos: materializedRepos,
  };
};
