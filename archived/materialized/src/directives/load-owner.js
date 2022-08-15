/* eslint-disable no-param-reassign */
import { mapSchema, MapperKind } from '@parameter1/graphql/utils';
import { getDirectiveArgs } from '@parameter1/graphql/directives';
import { getProjectionForType } from '@parameter1/sso-graphql-common';

export default function loadOwnerDirectiveTransformer(schema, directiveName = 'loadOwner') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (config) => {
      const args = getDirectiveArgs(schema, config, directiveName);
      if (!args) return;
      config.resolve = ({ _id }, _, { dataloaders }, info) => {
        const { projection } = getProjectionForType(info);
        return dataloaders.get(args.type).load({ value: _id, projection });
      };
    },
  });
}
