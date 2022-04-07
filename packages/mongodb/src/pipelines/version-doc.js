export default ({
  n,
  deleted = false,
  source,
  context,
}) => ({
  n,
  date: '$$NOW',
  deleted: Boolean(deleted),
  source,
  user: context.userId ? { _id: context.userId } : null,
  ip: context.ip,
  ua: context.ua,
});
