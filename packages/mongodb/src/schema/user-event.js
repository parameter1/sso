import { PropTypes } from '@sso/prop-types';
import userProps from './props/user.js';
import userEventProps from './props/user-event.js';

const { object } = PropTypes;

export default {
  create: object({
    userId: userProps.id.required(),
    action: userEventProps.action.required(),
    ip: userEventProps.ip,
    ua: userEventProps.ua,
    data: userEventProps.data,
    session: object(),
  }).required(),
};
