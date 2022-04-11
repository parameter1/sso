import { ObjectId } from '@parameter1/mongodb';
import mapObject, { mapObjectSkip } from 'map-obj';
import sortKeys from 'sort-keys';
import is from '@sindresorhus/is';
import Expr from '../pipelines/utils/expr.js';

export class CleanDocument {
  static array(arr) {
    if (!is.array(arr)) return [];
    const cleaned = arr.map(CleanDocument.value).filter((v) => v != null);
    // sort when all array values are strings, numbers, or booleans.
    if (is.array(cleaned, is.number)
      || is.array(cleaned, is.string)
      || is.array(cleaned, is.boolean)
    ) {
      return cleaned.sort();
    }
    return cleaned;
  }

  static object(obj) {
    if (is.undefined(obj)) return undefined;
    if (!is.object(obj) || (is.plainObject(obj) && is.emptyObject(obj))) return null;

    if (is.directInstanceOf(obj, ObjectId)) return obj;
    if (is.directInstanceOf(obj, Expr)) return obj.expr;
    if (is.date(obj)) return obj;

    const cleaned = sortKeys(mapObject(obj, (key, value) => {
      const v = CleanDocument.value(value);
      if (is.undefined(v)) return mapObjectSkip;
      return [key, v];
    }));
    return is.emptyObject(cleaned) ? null : cleaned;
  }

  static value(value) {
    if (is.function(value)) return null;
    if (is.plainObject(value)) return CleanDocument.object(value);
    if (is.array(value)) return CleanDocument.array(value);
    return value;
  }
}

/**
 * @deprecated use `CleanDocument.value` instead.
 */
export default function cleanDocument(doc) {
  return CleanDocument.value(doc);
}
