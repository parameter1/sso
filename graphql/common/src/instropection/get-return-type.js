export default function getReturnType(type) {
  if (type.ofType) return getReturnType(type.ofType);
  return type;
}
