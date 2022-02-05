import { isFunction as isFn } from '@parameter1/utils';

export default function buildUpdatePipeline(fields = [], {
  now = new Date(),
  updatedDatePath = 'date.updated',
} = {}) {
  const expose = [];
  const f = fields.map((field) => {
    const { exposeCurrentValue, path, set } = field;
    const prefixedPath = `$${path}`;
    if (exposeCurrentValue || isFn(set)) expose.push({ current: `__current:${path}`, prefixedPath });
    return { ...field, prefixedPath };
  });

  const pipeline = [
    {
      $addFields: {
        __didChange: {
          $or: f.map(({ prefixedPath, value }) => ({
            $ne: [`${prefixedPath}`, value],
          })),
        },
        ...expose.reduce((o, { current, prefixedPath }) => ({
          ...o, [current]: prefixedPath,
        }), {}),
      },
    },

    {
      $set: fields.reduce((o, { path, value, set }) => ({
        ...o,
        [path]: value,
        ...(isFn(set) && set()),
      }), {
        ...(updatedDatePath && {
          [updatedDatePath]: { $cond: ['$__didChange', now, `$${updatedDatePath}`] },
        }),
      }),
    },
    { $unset: ['__didChange', ...expose.map(({ current }) => current)] },
  ];
  return pipeline;
}
