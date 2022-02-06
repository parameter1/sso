export default (slug) => ({
  redirects: {
    $cond: {
      if: '$__willChange',
      then: {
        $filter: {
          input: { $concatArrays: ['$redirects', ['$__current:slug']] },
          as: 'slug',
          cond: { $ne: ['$$slug', slug] },
        },
      },
      else: '$redirects',
    },
  },
});
