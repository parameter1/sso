/* eslint-disable no-param-reassign */
import { getDirectiveArgs, mapSchema, MapperKind } from '@parameter1/graphql-utils';

export function authDirectiveTransformer(schema, directiveName = 'auth') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const args = getDirectiveArgs(schema, fieldConfig, directiveName);
      if (!args) return;

      const { subscribe: defaultSubscriber } = fieldConfig;
      if (defaultSubscriber) {
        fieldConfig.subscribe = async (...subscriberArgs) => {
          const [, , { auth }] = subscriberArgs;
          await auth.check();
          return defaultSubscriber(...subscriberArgs);
        };
      }

      const { resolve: defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async (...resolverArgs) => {
        const [root, , { auth }] = resolverArgs;
        await auth.check();
        if (defaultFieldResolver) return defaultFieldResolver(...resolverArgs);
        return root;
      };
    },
  });
}
