/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';
import { get } from '@parameter1/object-path';

export default function filterDeletedDirectiveTransformer(schema, directiveName = 'filterDeleted') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (config) => {
      const args = getDirectiveArgs(schema, config, directiveName);
      if (!args) return;

      const { resolve: defaultFieldResolver } = config;
      if (!defaultFieldResolver) throw new Error('A resolver must be defined in order to filter deleted items.');

      config.resolve = async (obj, ...rest) => {
        const path = args.field ? `${args.field}._deleted` : '_deleted';
        const r = await defaultFieldResolver(obj, ...rest);
        if (!r) return r;
        if (Array.isArray(r)) return r.filter((o) => !get(o, path));
        return get(r, path) ? null : r;
      };
    },
  });
}
