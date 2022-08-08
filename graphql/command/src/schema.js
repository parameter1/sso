import { makeExecutableSchema } from '@parameter1/graphql/schema';
import { enumDefaultValuesTransformer } from '@parameter1/graphql/transformers';
import { interfaceFieldsDirectiveTransformer } from '@parameter1/graphql/directives';
import { authDirectiveTransformer } from '@parameter1/sso-graphql';

import enums from './enums.js';
import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';

const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

const withInterfaceFields = interfaceFieldsDirectiveTransformer(schema);
const withAuth = authDirectiveTransformer(withInterfaceFields);

// handle enum default values
const withEnumDefaults = enumDefaultValuesTransformer(withAuth, enums);

export default withEnumDefaults;
