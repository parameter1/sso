export default (slug) => ({
  redirects: {
    $cond: {
      if: '$__didChange',
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
