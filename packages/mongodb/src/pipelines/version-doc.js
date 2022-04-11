import { PropTypes, attempt } from '@sso/prop-types';

import { CleanDocument } from '../utils/clean-document.js';
import { contextSchema, contextProps } from '../schema/index.js';
import Expr from './utils/expr.js';

const {
  alternatives,
  boolean,
  object,
  sequence,
  string,
} = PropTypes;

export default (params) => {
  const {
    n,
    deleted,
    source,
    context,
  } = attempt(params, object({
    n: alternatives().try(string().valid('$inc'), sequence()).required(),
    deleted: boolean().default(false),
    source: contextProps.source.required(),
    context: contextSchema,
  }).required());

  return CleanDocument.value({
    n: n === '$inc' ? new Expr({ $add: ['$_version.current.n', 1] }) : n,
    date: '$$NOW',
    deleted,
    source,
    user: context.userId ? { _id: context.userId } : null,
    ip: context.ip,
    ua: context.ua,
  });
};
