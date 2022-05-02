import { PropTypes } from '@parameter1/prop-types';
import tokenProps from './props/token.js';
import Expr from '../pipelines/utils/expr.js';

const { object } = PropTypes;

export default {
  create: object({
    subject: tokenProps.subject.required(),
    audience: tokenProps.audience.required(),
    issuer: tokenProps.issuer,
    ttl: tokenProps.ttl.default(0),
    data: tokenProps.data.default({}),
  }).custom((token) => {
    const { ttl } = token;
    return {
      ...token,
      issuedAt: '$$NOW',
      ...(ttl && {
        expiresAt: new Expr({ $add: ['$$NOW', ttl * 1000] }),
      }),
    };
  }).required(),
};
