/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';
import { asArray } from '@parameter1/utils';
import { get } from '@parameter1/object-path';

const applyProjectMeta = ({ args, config }) => {
  const { astNode } = config;
  const definedField = astNode ? astNode.name.value : null;
  const name = args.field == null ? definedField : args.field;
  if (astNode) {
    astNode.$project = {
      name,
      deep: args.deep,
      needs: new Set(asArray(args.needs).map((path) => {
        if (args.prefixNeedsWith) return `${args.prefixNeedsWith}.${path}`;
        return path;
      })),
    };
  }
  return { name };
};

export default function projectDirectiveTransformer(schema, directiveName = 'project') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (config) => {
      const args = getDirectiveArgs(schema, config, directiveName);
      if (!args) return;
      const { name } = applyProjectMeta({ args, config });
      if (!config.resolve && args.resolve !== false) config.resolve = (obj) => get(obj, name);
    },
    [MapperKind.INPUT_OBJECT_FIELD]: (config) => {
      const args = getDirectiveArgs(schema, config, directiveName);
      if (!args) return;
      applyProjectMeta({ args, config });
    },
  });
}
