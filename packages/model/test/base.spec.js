/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { isRecord } from 'immutable';
import { base } from '../src/base.js';
import { Types } from '../src/types.js';
import common from './common.js';

const { object } = Types;

describe('base.js', () => {
  /**
   *
   */
  describe('base()', () => {
    /**
     *
     */
    it('should return a new record', () => {
      const record = base();
      expect(isRecord(record)).to.equal(true);
    });
  });

  /**
   *
   */
  describe('Base.set', () => {
    /**
     *
     */
    it('should throw an error when the key is invalid', () => {
      const record = base();
      common.testInvalidRequiredStrings((key) => {
        record.set(key);
      });
    });

    /**
     *
     */
    it('should throw an error when a value already exists in strict mode', () => {
      expect(() => {
        const record = base({ foo: null });
        record.set('foo', 'baz').set('foo', 'dill', { strict: true });
      }).to.throw(Error, 'A value already exists for `foo`');
    });

    /**
     *
     */
    it('should throw an error when the value fails validation', () => {
      const record = base({ foo: null });
      expect(() => {
        record.set('key', null);
      }).to.throw(ValidationError, '"key" must be a string');
    });

    /**
     *
     */
    it('should set set the value', () => {
      const record = base({ foo: null }).set('foo', 'bar');
      expect(record.get('foo')).to.equal('bar');
    });
  });

  /**
   *
   */
  describe('Base.validateValue', () => {
    /**
     *
     */
    it('should throw when the schema is not a schema object', () => {
      const record = base();
      ['', 'foo', true, [], {}].forEach((schema) => {
        expect(() => {
          record.validateValue('key', 'value', schema);
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should allow null schema values in order to bypass validation', () => {
      const record = base();
      expect(record.validateValue('key', ' value ', null)).to.equal(' value ');
    });

    /**
     *
     */
    it('should use a required string schema by default', () => {
      const record = base();
      expect(() => {
        record.validateValue('key');
      }).to.throw(ValidationError, '"key" is required');
      expect(() => {
        record.validateValue('key', null);
      }).to.throw(ValidationError, '"key" must be a string');
    });

    /**
     *
     */
    it('should validate the value based on the given schema.', () => {
      const record = base();
      expect(record.validateValue('key', ' value ')).to.equal('value');
      expect(record.validateValue('key', {}, object())).to.deep.equal({});
    });
  });
});
