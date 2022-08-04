/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { entity } from '../src/entity.js';
import common from './common.js';

describe('entity.js', () => {
  /**
   *
   */
  describe('entity()', () => {
    /**
     *
     */
    it('should throw an error when invalid', () => {
      common.testInvalidRequiredStrings((key) => {
        entity(key);
      });
    });
  });

  /**
   *
   */
  describe('Entity.collection', () => {
    /**
     *
     */
    it('should throw an error when invalid', () => {
      const record = entity('Foo');
      common.testInvalidRequiredNullableStrings((key) => {
        record.collection(key);
      });
    });

    /**
     *
     */
    it('should set the trimmed value as passed', () => {
      ['some_collection', ' some_collection  '].forEach((value) => {
        expect(entity('Foo').collection(value).getCollection()).to.equal('some_collection');
      });
    });

    /**
     *
     */
    it('should unset the value when a null is passed', () => {
      const record = entity('Foo').collection('bar');
      expect(record.getCollection()).to.equal('bar');
      expect(record.collection(null).getCollection()).to.equal('foos');
    });
  });

  /**
   *
   */
  describe('Entity.name', () => {
    /**
     *
     */
    it('should PascalCase the name', () => {
      ['user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((value) => {
        expect(entity(value).getName()).to.equal('UserEvent');
      });
    });

    /**
     *
     */
    it('should ensure the name is singular', () => {
      ['UserEvent', 'user-events', 'userEvents', 'user events', 'user.events', 'UserEvents', 'User Events'].forEach((value) => {
        expect(entity(value).getName()).to.equal('UserEvent');
      });
    });

    /**
     *
     */
    it('should add the plural version of the name', () => {
      ['UserEvents', 'user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((name) => {
        const ent = entity(name);
        expect(ent.getPluralName()).to.equal('UserEvents');
      });
    });

    /**
     *
     */
    it('should pluralize and param-case the collection name by default', () => {
      const ent1 = entity('Application');
      const ent2 = entity('UserEvent');

      expect(ent1.getCollection()).to.equal('applications');
      expect(ent2.getCollection()).to.equal('user-events');
    });
  });

  /**
   *
   */
  describe('Entity.getCollection', () => {
    /**
     *
     */
    it('should return the collection name', () => {
      expect(entity('Foo').getCollection()).to.equal('foos');
    });
  });

  /**
   *
   */
  describe('Entity.getName', () => {
    /**
     *
     */
    it('should return the entity name', () => {
      expect(entity('Foo').getName()).to.equal('Foo');
    });
  });
});
