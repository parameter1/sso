import { ObjectId } from '@parameter1/mongodb';
import mapObject, { mapObjectSkip } from 'map-obj';
import sortKeys from 'sort-keys';
import is from '@sindresorhus/is';

export default function cleanDocument(doc) {
  return sortKeys(mapObject(doc, (key, value) => {
    if (is.undefined(value)) return mapObjectSkip;
    if (is.date(value)) return [key, value, { shouldRecurse: false }];
    if (value && is.directInstanceOf(value, ObjectId)) {
      return [key, value, { shouldRecurse: false }];
    }
    return [key, value];
  }, { deep: true }), { deep: true });
}
