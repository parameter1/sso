import AuthContext from './auth.js';
import repos from '../repos.js';

export default async ({ request } = {}) => ({
  auth: AuthContext({
    header: request.headers.authorization,
  }),
  ip: request.ip,
  repos,
  ua: request.headers['user-agent'],
});
