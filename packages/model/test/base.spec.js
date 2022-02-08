/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Base from '../src/base.js';
import common from './common.js';

import { any, array } from '../src/schema.js';

describe('base.js', () => {
  it('should clone on change', () => {
    const base = new Base();

    const b1 = base.$set('test', 'foo');
    const b2 = b1.$set('test', 'bar');

    expect(b1.$get('test')).to.equal('foo');
    expect(b2.$get('test')).to.equal('bar');
  });

  it('should clone when retrieving all values', () => {
    const base = new Base();
    const b1 = base.$set('test', 'foo').$set('arr', ['foo'], { schema: array() });
    const values = b1.$values();
    values.test = 'bar';
    values.arr.push('bar');
    expect(b1.$get('test')).to.equal('foo');
    expect(b1.$get('arr')).to.deep.equal(['foo']);
    expect(values.test).to.equal('bar');
    expect(values.arr).to.deep.equal(['foo', 'bar']);
  });

  it('should clone deep object values', () => {
    const base = new Base();

    const b1 = base.$set('test.foo', 'bar');
    const b2 = b1.$set('test.foo', 'baz');

    expect(b1.$get('test')).to.deep.equal({ foo: 'bar' });
    expect(b2.$get('test')).to.deep.equal({ foo: 'baz' });
  });

  describe('$set', () => {
    it('should throw an error when the path is invalid', () => {
      common.testInvalidRequiredStrings((value) => {
        (new Base()).$set(value);
      });
    });
    it('should throw an error when a value already exists in strict mode', () => {
      expect(() => {
        const base = new Base();
        base.$set('foo.bar', 'baz').$set('foo.bar', 'dill', { strict: true });
      }).to.throw(Error, 'A value already exists for `foo.bar`');
    });
    it('should deeply set', () => {
      const base = (new Base()).$set('foo.bar', 'a').$set('foo.baz', 'b');
      expect(base.$get('foo')).to.deep.equal({ bar: 'a', baz: 'b' });
    });
  });

  describe('$get', () => {
    it('should deeply get', () => {
      const base = (new Base()).$set('foo.bar', 'a');
      expect(base.$get('foo.bar')).to.equal('a');
    });
  });

  describe('$has', () => {
    it('should return false when a value is undefined or null', () => {
      expect((new Base()).$has('foo.bar')).to.equal(false);
      expect((new Base()).$set('foo.bar', null, { schema: any() }).$has('foo.bar')).to.equal(false);
    });
    it('should return true when a value is set', () => {
      expect((new Base()).$set('foo.bar', 'baz').$has('foo.bar')).to.equal(true);
    });
  });
});
