/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';

export default function authDirectiveTransformer(schema, directiveName = 'auth') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const args = getDirectiveArgs(schema, fieldConfig, directiveName);
      if (!args) return;

      const { needsRequiredUserFields } = args;
      const { resolve: defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async (...resolverArgs) => {
        const [, , { auth }] = resolverArgs;
        await auth.check({ needsRequiredUserFields });
        if (defaultFieldResolver) return defaultFieldResolver(...resolverArgs);
        return null;
      };
    },
  });
}
