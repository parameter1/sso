import is from '@sindresorhus/is';
import { CleanDocument } from '../../utils/clean-document.js';

const $ = (path) => `$${path}`;

export default class Expr {
  constructor(expr) {
    this.expr = expr;
  }

  toObject() {
    return this.expr;
  }

  static $addToSet(path, value) {
    const values = CleanDocument.value(is.array(value) ? value : [value]);
    return {
      [path]: new Expr({ $setUnion: [$(path), values] }),
    };
  }

  static $inc(path, value) {
    return {
      [path]: new Expr({ $add: [$(path), value] }),
    };
  }

  static $pull(path, cond) {
    return {
      [path]: new Expr({ $filter: { input: $(path), as: 'v', cond } }),
    };
  }

  static $mergeArrayObject(path, cond, value) {
    return {
      [path]: new Expr({
        $map: {
          input: $(path),
          as: 'v',
          in: {
            $cond: {
              if: cond,
              then: { $mergeObject: ['$$v', CleanDocument.object(value)] },
              else: '$$v',
            },
          },
        },
      }),
    };
  }
}
