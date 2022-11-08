import { NotFoundError } from '@parameter1/sso-graphql';

export function createStrictError(entityType) {
  return new NotFoundError(`No ${entityType} was found for the provided criteria.`);
}

export function addArrayFilter(path, values) {
  return values.length ? { [path]: { $in: values } } : undefined;
}
