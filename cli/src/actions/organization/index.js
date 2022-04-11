import addEmailDomains from './add-email-domains.js';
import create from './create.js';
import deleteOrg from './delete.js';
import removeEmailDomains from './remove-email-domains.js';
import updateName from './update-name.js';
import updateSlug from './update-slug.js';

export default {
  addEmailDomains,
  create,
  delete: deleteOrg,
  removeEmailDomains,
  updateName,
  updateSlug,
};
