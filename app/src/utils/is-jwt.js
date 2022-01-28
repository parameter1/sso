export default (value) => {
  if (!value) return false;
  return /^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/.test(value);
};
