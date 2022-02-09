/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { Record, Set as ImmutableSet } from 'immutable';
import { base } from '../src/base.js';
import { object } from '../src/schema.js';
import common from './common.js';

const { isSet } = ImmutableSet;
const { isRecord } = Record;

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

    /**
     *
     */
    it('should should throw when $maybeRequiresValues is not an array', () => {
      [{}, '', false, null].forEach(($maybeRequiresValues) => {
        expect(() => {
          base({ $maybeRequiresValues });
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should allow empty values', () => {
      [undefined, []].forEach(($maybeRequiresValues) => {
        const record = base({ $maybeRequiresValues });
        expect(isSet(record.get('$maybeRequiresValues'))).to.equal(true);
      });
    });

    /**
     *
     */
    it('should set the values', () => {
      [
        { methods: ['foo'], expected: ['foo'] },
        { methods: ['foo', 'foo'], expected: ['foo'] },
        { methods: ['foo', 'bar'], expected: ['foo', 'bar'] },
      ].forEach(({ methods, expected }) => {
        const value = base({ $maybeRequiresValues: methods }).get('$maybeRequiresValues');
        expect(isSet(value)).to.equal(true);
        expect(value.toArray()).to.deep.equal(expected);
      });
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
  describe('Base.needsValues', () => {
    /**
     *
     */
    it('should not throw when no values are passed', () => {
      const record1 = base();
      const record2 = base({ $maybeRequiresValues: ['name'] });

      expect(isRecord(record1.needsValues())).to.equal(true);
      expect(isRecord(record2.needsValues())).to.equal(true);
    });

    /**
     *
     */
    it('should throw when methods are required and needed but not set', () => {
      const record = base({ $maybeRequiresValues: ['name'], name: null });
      expect(() => {
        record.needsValues('name');
      }).to.throw(Error, 'The `name` value must be set before continuing.');
    });

    /**
     *
     */
    it('should not throw when methods are required, needed, and set', () => {
      const record = base({ $maybeRequiresValues: ['name', 'foo'], name: null, foo: null });
      const r = record.set('name', 'foo').set('foo', 'bar');
      expect(isRecord(r.needsValues('name', 'foo'))).to.equal(true);
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
