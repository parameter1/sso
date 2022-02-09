/* eslint-disable import/no-extraneous-dependencies */
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';

export default {
  testInvalidRequiredStrings: (cb) => [undefined, null, '', ' ', {}].forEach((value) => {
    expect(() => {
      cb(value);
    }).to.throw(ValidationError);
  }),

  testInvalidRequiredNullableStrings: (cb) => [undefined, '', ' ', {}].forEach((value) => {
    expect(() => {
      cb(value);
    }).to.throw(ValidationError);
  }),
};
