/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';
import { asArray } from '@parameter1/utils';
import { get } from '@parameter1/object-path';

export default function projectDirectiveTransformer(schema, directiveName = 'project') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (config) => {
      const args = getDirectiveArgs(schema, config, directiveName);
      if (!args) return;

      const { astNode } = config;
      const definedField = astNode ? astNode.name.value : null;
      const name = args.field == null ? definedField : args.field;
      if (astNode) {
        astNode.$project = {
          name,
          deep: args.deep,
          needs: new Set(asArray(args.needs)),
        };
      }
      if (!config.resolve && args.resolve !== false) config.resolve = (obj) => get(obj, name);
    },
  });
}
