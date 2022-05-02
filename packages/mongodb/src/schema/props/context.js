import { PropTypes } from '@parameter1/prop-types';

const { object, string } = PropTypes;

export default {
  ip: string().allow(null).empty(null),
  source: object({
    name: string().required(),
    v: string().required(),
  }),
  ua: string().allow(null).empty(null),
};
