/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import inflector from '../src/inflector.js';

describe('utils/inflector.js', () => {
  describe('classify', () => {
    it('should throw an error when a string is not provided.');
    describe('multiple words', () => {
      [
        'UserEvent',
        ' UserEvent ',
        'user event',
        'User Event',
        'User event',
        'user Event',
        'User   event  ',
        'user_event',
        '_user_event',
        'user__event',
        ' user_event ',
        'user-event',
        '-user-event',
        'user--event',
        'userEvent',
      ].forEach((value) => {
        it(`should handle ${value}`, () => {
          expect(inflector.classify(value)).to.equal('UserEvent');
        });
      });
    });
  });
});
