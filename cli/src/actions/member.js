import changeRole from './member/change-role.js';
import create from './member/create.js';
import deleteMember from './member/delete.js';

export default {
  changeRole,
  create,
  delete: deleteMember,
};
