/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import entity from '../src/entity.js';

describe('entity.js', () => {
  it('should pluralize and dasherize the collection name by default', () => {
    const ent1 = entity('Application');
    const ent2 = entity('UserEvent');

    expect(ent1.$get('collection')).to.equal('applications');
    expect(ent1.$values().collection).to.equal('applications');
    expect(ent2.$get('collection')).to.equal('user-events');
    expect(ent2.$values().collection).to.equal('user-events');
  });

  it('should create a plural by default', () => {
    const ent1 = entity('Application');
    const ent2 = entity('UserEvent');

    expect(ent1.$get('plural')).to.equal('Applications');
    expect(ent1.$values().plural).to.equal('Applications');
    expect(ent2.$get('plural')).to.equal('UserEvents');
    expect(ent2.$values().plural).to.equal('UserEvents');
  });

  it('should set the plural value', () => {
    const ent1 = entity('Application').plural('Foo');

    expect(ent1.$get('plural')).to.equal('Foo');
    expect(ent1.$values().plural).to.equal('Foo');
  });
});
