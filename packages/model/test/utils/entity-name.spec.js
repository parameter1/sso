/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import entityName from '../../src/utils/entity-name.js';

describe('utils/entity-name.js', () => {
  it('should throw an error when empty', () => {
    [undefined, null, '', '  ', {}].forEach((value) => {
      expect(() => {
        entityName(value);
      }).to.throw(ValidationError);
    });
  });
  it('should pascal-case the name', () => {
    ['user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((value) => {
      expect(entityName(value)).to.equal('UserEvent');
    });
  });

  it('should ensure the name is singular', () => {
    ['UserEvent', 'user-events', 'userEvents', 'user events', 'user.events', 'UserEvents', 'User Events'].forEach((value) => {
      expect(entityName(value)).to.equal('UserEvent');
    });
  });
});
