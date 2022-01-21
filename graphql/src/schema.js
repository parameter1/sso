import { makeExecutableSchema } from '@parameter1/graphql/schema';
import { enumDefaultValuesTransformer } from '@parameter1/graphql/transformers';

import resolvers from './resolvers/index.js';
import typeDefs from './definitions/index.js';
import enums from './enums.js';

const schema = makeExecutableSchema({
  resolvers,
  typeDefs,
});

// handle enum default values
const withEnumDefaults = enumDefaultValuesTransformer(schema, enums);

export default withEnumDefaults;
