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

export const camel = (value) => run(value, camelCase);
export const none = (value) => run(value, noCase);
export const pascal = (value) => run(value, pascalCase);
export const param = (value) => run(value, paramCase);
export const plural = (value) => run(value, infl.pluralize);
export const singular = (value) => run(value, infl.singularize);
