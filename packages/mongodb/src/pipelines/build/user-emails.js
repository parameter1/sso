import { addToSet, pull } from '../utils/index.js';

export default (email) => ({
  domain: email.split('@')[1],
  // unverify if email has changed
  verified: { $cond: ['$__will_change.email', false, '$verified'] },
  // push the "new" email address and also pull the "old"
  previousEmails: {
    $cond: {
      if: '$__will_change.email',
      then: pull({
        input: addToSet({ path: '$previousEmails', value: '$email' }),
        value: email,
      }),
      else: '$previousEmails',
    },
  },
});
