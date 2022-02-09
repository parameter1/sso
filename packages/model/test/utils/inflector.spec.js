/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  camel,
  none,
  pascal,
  param,
} from '../../src/utils/inflector.js';

const words = [
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
];

describe('utils/inflector.js', () => {
  describe('pascal', () => {
    describe('multiple words', () => {
      words.forEach((value) => {
        it(`should handle ${value}`, () => {
          expect(pascal(value)).to.equal('UserEvent');
        });
      });
    });
  });

  describe('param', () => {
    describe('multiple words', () => {
      words.forEach((value) => {
        it(`should handle ${value}`, () => {
          expect(param(value)).to.equal('user-event');
        });
      });
    });
  });

  describe('camel', () => {
    describe('multiple words', () => {
      words.forEach((value) => {
        it(`should handle ${value}`, () => {
          expect(camel(value)).to.equal('userEvent');
        });
      });
    });
  });

  describe('none', () => {
    describe('multiple words', () => {
      words.forEach((value) => {
        it(`should handle ${value}`, () => {
          expect(none(value)).to.equal('user event');
        });
      });
    });
  });
});
