import infl from 'inflected';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
import { noCase } from 'no-case';

const run = (value, fn) => {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? fn(trimmed) : null;
};

export default {
  camel: (value) => run(value, camelCase),
  none: (value) => run(value, noCase),
  pascal: (value) => run(value, pascalCase),
  param: (value) => run(value, paramCase),
  plural: (value) => run(value, infl.pluralize),
  singular: (value) => run(value, infl.singularize),
};
