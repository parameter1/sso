import Joi, { validateAsync } from '@parameter1/joi';

/**
 *
 * @param {object} params
 * @param {string} params.slug
 */
export default async function buildUpdateSlugPipeline(params = {}) {
  const {
    slug,
  } = await validateAsync(Joi.object({
    slug: Joi.slug().required(),
  }).required(), params);

  return [
    {
      $addFields: {
        currentSlug: '$slug',
        hasChanged: { $ne: ['$slug', slug] },
      },
    },
    {
      $set: {
        slug,
        'date.updated': { $cond: ['$hasChanged', new Date(), '$date.updated'] },
        redirects: {
          $cond: {
            if: '$hasChanged',
            then: {
              $filter: {
                input: { $concatArrays: ['$redirects', ['$currentSlug']] },
                as: 'slug',
                cond: { $ne: ['$$slug', slug] },
              },
            },
            else: '$redirects',
          },
        },
      },
    },
    { $unset: ['currentSlug', 'hasChanged'] },
  ];
}
