import { addToSet, pull } from '../utils/index.js';

export default (slug) => ({
  redirects: {
    $cond: {
      if: '$__will_change.slug',
      then: pull({
        input: addToSet({ path: '$redirect', value: '$slug' }),
        value: slug,
      }),
      else: '$redirects',
    },
  },
});
