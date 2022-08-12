import {
  interfaceFieldsDirectiveTransformer,
  authDirectiveTransformer,
  enumDefaultValuesTransformer,
  makeExecutableSchema,
} from '@parameter1/sso-graphql';

import enums from './enums.js';
import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';

const schema = makeExecutableSchema({ resolvers, typeDefs });
const withInterfaceFields = interfaceFieldsDirectiveTransformer(schema);
const withAuth = authDirectiveTransformer(withInterfaceFields);
const withEnumDefaults = enumDefaultValuesTransformer(withAuth, enums);

export default withEnumDefaults;
