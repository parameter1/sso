import addEmailDomains from './add-email-domains.js';
import addManager from './add-manager.js';
import changeManagerRole from './change-manager-role.js';
import create from './create.js';
import deleteOrg from './delete.js';
import removeEmailDomains from './remove-email-domains.js';
import removeManager from './remove-manager.js';
import updateName from './update-name.js';

export default {
  addEmailDomains,
  addManager,
  changeManagerRole,
  create,
  delete: deleteOrg,
  removeEmailDomains,
  removeManager,
  updateName,
};
