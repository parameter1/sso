import { AuthenticationError } from 'apollo-server-fastify';
import repos from '../repos.js';

const requiredUserFields = ['name'];
const requiredUserFieldProjection = requiredUserFields
  .reduce((o, field) => ({ ...o, [field]: 1 }), {});

const parseHeader = (header) => {
  if (!header) return {};
  const [type, value] = header.trim().replace(/\s\s+/, ' ').split(' ');
  return { type, value };
};

// const forbidden = (message) => {
//   const e = new ApolloError(message);
//   e.statusCode = 403;
//   return e;
// };

export default function AuthContext({ header } = {}) {
  let authToken;
  let error;
  let promise;
  let user;

  const load = async () => {
    if (!promise) {
      promise = (async () => {
        if (!header) return;
        const { type, value } = parseHeader(header);
        if (type !== 'Bearer') throw new AuthenticationError(`The auth type '${type}' is not supported.`);
        if (!value) return;
        authToken = value;
        user = await repos.$('user').verifyAuthToken({
          authToken,
          projection: { email: 1, ...requiredUserFieldProjection },
        });
      })();
    }
    try {
      await promise;
    } catch (e) {
      error = e;
    }
  };

  const check = async () => {
    await load();
    if (error) throw new AuthenticationError(error.message);
    if (!user) throw new AuthenticationError('You must be logged-in to access this resource.');
    return true;
  };

  const getAuthToken = async () => {
    await check();
    return authToken;
  };

  const getUser = async () => {
    await check();
    return user;
  };

  const getUserId = async () => {
    const u = await getUser();
    return u._id;
  };

  const isAuthenticated = async () => {
    try {
      await check();
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    check,
    getAuthToken,
    getUser,
    getUserId,
    isAuthenticated,
  };
}
