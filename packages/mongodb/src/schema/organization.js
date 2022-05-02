import { PropTypes } from '@parameter1/prop-types';
import organizationProps from './props/organization.js';

const { object } = PropTypes;

export default {
  create: object({
    name: organizationProps.name.required(),
    key: organizationProps.key.required(),
    emailDomains: organizationProps.emailDomains.default([]),
  }).required(),
};
