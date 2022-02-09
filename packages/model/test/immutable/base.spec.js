/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { Record, Set } from 'immutable';
import { base } from '../../src/immutable/base.js';
import { object } from '../../src/immutable/schema.js';

const { isSet } = Set;
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
    it('should should throw when $maybeRequiresMethods is not an array', () => {
      [{}, '', false, null].forEach(($maybeRequiresMethods) => {
        expect(() => {
          base({ $maybeRequiresMethods });
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should allow empty values', () => {
      [undefined, []].forEach(($maybeRequiresMethods) => {
        const record = base({ $maybeRequiresMethods });
        expect(isSet(record.get('$maybeRequiresMethods'))).to.equal(true);
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
        const value = base({ $maybeRequiresMethods: methods }).get('$maybeRequiresMethods');
        expect(isSet(value)).to.equal(true);
        expect(value.toArray()).to.deep.equal(expected);
      });
    });
  });

  /**
   *
   */
  describe('Base.$needs', () => {
    /**
     *
     */
    it('should not throw when no values are passed', () => {
      const record1 = base();
      const record2 = base({ $maybeRequiresMethods: ['name'] });

      expect(isRecord(record1.$needs())).to.equal(true);
      expect(isRecord(record2.$needs())).to.equal(true);
    });

    /**
     *
     */
    it('should throw when methods are required and needed but not set', () => {
      const record = base({ $maybeRequiresMethods: ['name'], name: null });
      expect(() => {
        record.$needs('name');
      }).to.throw(Error, 'The `name` value must be set before continuing.');
    });

    /**
     *
     */
    it('should not throw when methods are required, needed, and set', () => {
      const record = base({ $maybeRequiresMethods: ['name', 'foo'], name: null, foo: null });
      const r = record.set('name', 'foo').set('foo', 'bar');
      expect(isRecord(r.$needs('name', 'foo'))).to.equal(true);
    });
  });

  /**
   *
   */
  describe('Base.$validate', () => {
    it('should throw when the schema is not a schema object', () => {
      const record = base();
      ['', 'foo', true, [], {}].forEach((schema) => {
        expect(() => {
          record.$validate('key', 'value', schema);
        }).to.throw(ValidationError);
      });
    });
    it('should allow null schema values in order to bypass validation', () => {
      const record = base();
      expect(record.$validate('key', ' value ', null)).to.equal(' value ');
    });
    it('should use a required string schema by default', () => {
      const record = base();
      expect(() => {
        record.$validate('key');
      }).to.throw(ValidationError, '"key" is required');
      expect(() => {
        record.$validate('key', null);
      }).to.throw(ValidationError, '"key" must be a string');
    });
    it('should validate the value based on the given schema.', () => {
      const record = base();
      expect(record.$validate('key', ' value ')).to.equal('value');
      expect(record.$validate('key', {}, object())).to.deep.equal({});
    });
  });
});
