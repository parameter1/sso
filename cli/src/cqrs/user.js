import changeEmail from './user/change-email.js';
import changeName from './user/change-name.js';
import create from './user/create.js';
import deleteUser from './user/delete.js';
import generateAuthToken from './user/generate-auth-token.js';

export default {
  changeEmail,
  changeName,
  create,
  delete: deleteUser,
  generateAuthToken,
};
