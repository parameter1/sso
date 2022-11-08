import {
  interfaceFieldsDirectiveTransformer,
  authDirectiveTransformer,
  enumDefaultValuesTransformer,
  makeExecutableSchema,
} from '@parameter1/sso-graphql';

import enums from './enums.js';
import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';

import { runCommandDirectiveTransformer } from './directives/run-command.js';

const schema = makeExecutableSchema({ resolvers, typeDefs });
const withInterfaceFields = interfaceFieldsDirectiveTransformer(schema);
const withAuth = authDirectiveTransformer(withInterfaceFields);
const withRunCommand = runCommandDirectiveTransformer(withAuth);
const withEnumDefaults = enumDefaultValuesTransformer(withRunCommand, enums);

export default withEnumDefaults;
