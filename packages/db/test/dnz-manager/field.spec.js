/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Joi from '@parameter1/joi';
import Field from '../../src/dnz-manager/field.js';

describe('dnz-manager/field.js', () => {
  it('should throw an error when the name is not a string', () => {
    [null, undefined, true, 0, {}].forEach((name) => {
      expect(() => new Field({ name, schema: Joi.string() })).to.throw(Error, 'The field name must be a string.');
    });
  });
  it('should throw an error when the name is not provided', () => {
    ['', '  ', ' '].forEach((name) => {
      expect(() => new Field({ name, schema: Joi.string() })).to.throw(Error, 'The field name must be provided.');
    });
  });
  it('should throw an error when the schema is not provided', () => {
    expect(() => new Field({ name: 'foo' })).to.throw(Error, 'No Joi schema was provided for this field.');
  });
  it('should throw an error when the schema is not a Joi object', () => {
    expect(() => new Field({ name: 'foo', schema: {} })).to.throw(Error, 'No Joi schema was provided for this field.');
  });
  it('should throw an error when the name equal to _id', () => {
    ['_id', ' _id '].forEach((name) => {
      expect(() => new Field({ name, schema: Joi.string() })).to.throw(Error, 'You cannot define/manipulate the denormalized _id field.');
    });
  });
  it('should trim the name', () => {
    [' foo ', '  foo  '].forEach((name) => {
      const field = new Field({ name, schema: Joi.string() });
      expect(field.name).to.equal('foo');
    });
  });
});
