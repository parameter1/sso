import infl from 'inflected';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
import { noCase } from 'no-case';

export default {
  camel: (value) => camelCase(value),
  none: (value) => noCase(value),
  pascal: (value) => pascalCase(value),
  param: (value) => paramCase(value),
  plural: (value) => infl.pluralize(value),
  singular: (value) => infl.singularize(value),
};
