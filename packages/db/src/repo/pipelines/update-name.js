import Joi, { validateAsync } from '@parameter1/joi';

/**
 *
 * @param {object} params
 * @param {string} params.name
 */
export default async function buildUpdateNamePipeline(params = {}) {
  const {
    name,
  } = await validateAsync(Joi.object({
    name: Joi.string().required(),
  }).required(), params);

  return [
    {
      $addFields: {
        __didChange: { $ne: ['$name', name] },
      },
    },
    {
      $set: {
        name,
        'date.updated': { $cond: ['$__didChange', new Date(), '$date.updated'] },
      },
    },
    { $unset: ['__didChange'] },
  ];
}
