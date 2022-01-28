export default (next) => {
  if (!next) return { valid: false };
  if (/^http[s]?:/.test(next)) return { valid: true, type: 'external' };
  if (/^\//.test(next)) return { valid: true, type: 'internal' };
  return { valid: false };
};
