import { PropTypes } from '@sso/prop-types';
import userProps from './props/user.js';
import userEventProps from './props/user-event.js';

const { object } = PropTypes;

export default {
  create: object({
    user: object({
      _id: userProps.id.required(),
    }).required(),
    action: userEventProps.action.required(),
    ip: userEventProps.ip,
    ua: userEventProps.ua,
    data: userEventProps.data,
    session: object(),
  }).custom((event) => ({
    ...event,
    date: '$$NOW',
  })).required(),
};
