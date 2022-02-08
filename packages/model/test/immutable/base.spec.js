/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { Record, Set } from 'immutable';
import { base } from '../../src/immutable/base.js';

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
    it('should not throw when methods are required, needed, and set');
  });
});
