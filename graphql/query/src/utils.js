export function addArrayFilter(path, values) {
  return values.length ? { [path]: { $in: values } } : undefined;
}
