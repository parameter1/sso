import { PropTypes } from '@parameter1/prop-types';
import { sluggify } from '@parameter1/slug';
import userProps from './props/user.js';

const { object } = PropTypes;

export const sluggifyUserNames = (names, reverse = false) => {
  const values = reverse ? [...names].reverse() : names;
  return sluggify(values.join(' '));
};

export default {
  create: object({
    email: userProps.email.required(),
    familyName: userProps.familyName.required(),
    givenName: userProps.givenName.required(),
    verified: userProps.verified.default(false),
  }).custom((user) => {
    const domain = user.email.split('@')[1];
    const names = [user.givenName, user.familyName];
    return {
      ...user,
      lastSeenAt: null,
      lastLoggedInAt: null,
      domain,
      loginCount: 0,
      previousEmails: [],
      organizations: [],
      slug: {
        default: sluggifyUserNames(names),
        reverse: sluggifyUserNames(names, true),
      },
      workspaces: [],
    };
  }).required(),
};
