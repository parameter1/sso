/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Joi from '@parameter1/joi';
import Base from '../src/base.js';

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
    const b1 = base.$set('test', 'foo').$set('arr', ['foo'], Joi.array());
    const values = b1.$values();
    values.test = 'bar';
    values.arr.push('bar');
    expect(b1.$get('test')).to.equal('foo');
    expect(b1.$get('arr')).to.deep.equal(['foo']);
    expect(values.test).to.equal('bar');
    expect(values.arr).to.deep.equal(['foo', 'bar']);
  });
});
