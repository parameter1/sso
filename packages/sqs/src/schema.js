import { PropTypes } from '@parameter1/sso-prop-types-core';

const {
  any,
  array,
  object,
  string,
} = PropTypes;

export const attributeValueFieldMap = new Map([
  ['Binary', 'BinaryValue'],
  ['Number', 'StringValue'],
  ['String', 'StringValue'],
]);

export const sqsMessagesSchema = array().items(object({
  attributes: array().items(object({
    name: string().required(),
    type: string().allow(...[...attributeValueFieldMap.keys()]).default('String'),
    value: any().required(),
  })).default([]),
  body: object().required(),
}).required()).required();
