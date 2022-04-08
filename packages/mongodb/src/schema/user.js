import { PropTypes } from '@sso/prop-types';
import userProps from './props/user.js';

const { object } = PropTypes;

export default {
  create: object({
    email: userProps.email.required(),
    familyName: userProps.familyName.required(),
    givenName: userProps.givenName.required(),
    verified: userProps.verified.default(false),
  }).custom((user) => {
    const domain = user.email.split('@')[1];
    return {
      ...user,
      lastSeenAt: null,
      lastLoggedInAt: null,
      domain,
      loginCount: 0,
      organizations: [],
      previousEmails: [],
      workspaces: [],
    };
  }).required(),
  updateProps: object({
    email: userProps.email,
    givenName: userProps.givenName,
    familyName: userProps.familyName,
  }).default(),
};
