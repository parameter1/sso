/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import one from '../../src/relationship/one.js';

describe('relationship/one.js', () => {
  it('on call, should be set as type `one` with an entity name', () => {
    const r = one('foo');
    expect(r.$get('type')).to.equal('one');
    expect(r.$get('entity')).to.equal('foo');
  });
});
