/**
 *
 * @param {import("mongodb").AbstractCursor} cursor
 * @param {Function} cb
 * @returns {Promise<void>}
 */
export async function iterateMongoCursor(cursor, cb) {
  if (await cursor.hasNext()) {
    const doc = await cursor.next();
    await cb(doc);
    await iterateMongoCursor(cursor, cb);
  }
}
