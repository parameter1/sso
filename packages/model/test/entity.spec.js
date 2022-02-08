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

  it('should use the entity name utility when setting the name');

  describe('name', () => {
    it('should add the plural version of the name', () => {
      ['UserEvents', 'user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((name) => {
        const ent = entity(name);
        expect(ent.$get('plural')).to.equal('UserEvents');
      });
    });
  });
});
