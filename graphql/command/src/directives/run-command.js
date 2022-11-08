/* eslint-disable no-param-reassign */
import { getDirectiveArgs, mapSchema, MapperKind } from '@parameter1/sso-graphql';
import { commands } from '../service-clients.js';

export function runCommandDirectiveTransformer(schema, directiveName = 'runCommand') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const args = getDirectiveArgs(schema, fieldConfig, directiveName);
      if (!args) return;

      const { resolve: defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = async (...resolverArgs) => {
        const [, { awaitingProcessing }, { ip, origin, ua }] = resolverArgs;
        const { value: resolverName } = fieldConfig.astNode.name;
        if (typeof defaultFieldResolver !== 'function') throw new Error(`A resolver function for "${resolverName}" must be defined.`);

        const { action, input } = await defaultFieldResolver(...resolverArgs) || {};
        if (!action || !input) throw new Error(`The resolver for "${resolverName}" must return an action name and input.`);

        const results = await commands.request(action, {
          input,
          awaitProcessing: Boolean(awaitingProcessing),
        }, { ip, origin, ua });
        return results;
      };
    },
  });
}
