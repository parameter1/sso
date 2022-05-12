export default (path, values) => (values.length
  ? { [path]: { $in: values } }
  : undefined
);
