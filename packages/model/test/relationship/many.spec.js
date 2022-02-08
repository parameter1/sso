/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import many from '../../src/relationship/many.js';

describe('relationship/many.js', () => {
  it('on call, should be set as type `many` with an entity name', () => {
    const r = many('foo');
    expect(r.$get('type')).to.equal('many');
    expect(r.$get('entity')).to.equal('foo');
  });
});
