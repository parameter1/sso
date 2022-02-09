/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { isMap } from 'immutable';
import { entity } from '../src/entity.js';
import { Prop } from '../src/prop.js';
import { Schema, isSchema } from '../src/schema.js';
import common from './common.js';

const { string } = Schema;

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
  describe('Entity.prop', () => {
    /**
     *
     */
    it('should throw an error when the name is invalid', () => {
      common.testInvalidRequiredStrings((name) => {
        entity('Foo').prop(name);
      });
    });

    /**
     *
     */
    it('should throw an error when an existing prop is already set', () => {
      expect(() => {
        entity('Foo').prop('bar', string()).prop('bar', string());
      }).to.throw(Error, 'A prop already exists for `bar`');
    });

    /**
     *
     */
    it('should throw an error when schema is not a Joi object', () => {
      [undefined, null, {}, string].forEach((schema) => {
        expect(() => {
          entity('Foo').prop('bar', schema);
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should camelize the prop name', () => {
      ['foo_bar', 'FooBar', 'foo-bar', 'foo bar', 'foo.bar', 'foo__bar'].forEach((name) => {
        const record = entity('Foo').prop(name, string());
        expect(record.get('$props').has('fooBar')).to.equal(true);
      });
    });

    /**
     *
     */
    it('should set the schema to the prop', () => {
      const record = entity('Foo').prop('fooBar', string());
      const prop = record.getProp('fooBar');
      expect(isSchema(prop.getSchema())).to.equal(true);
    });

    /**
     *
     */
    it('should unset the prop when the schema is null', () => {
      const record = entity('Foo').prop('fooBar', string());
      expect(record.hasProp('fooBar')).to.equal(true);
      const removed = record.prop('foo_bar', null);
      expect(removed.hasProp('fooBar')).to.equal(false);
      expect(removed.hasProp('foo_bar')).to.equal(false);
    });
  });

  /**
   *
   */
  describe('Entity.props', () => {
    /**
     *
     */
    it('should throw an error when the values are invalid', () => {
      [undefined, null, '', ' '].forEach((value) => {
        expect(() => {
          entity('Foo').props(value);
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should throw an error when an existing prop is already set', () => {
      expect(() => {
        entity('Foo').props({ foo: string(), bar: string() }).props({ foo: string() });
      }).to.throw(Error, 'A prop already exists for `foo`');

      expect(() => {
        entity('Foo').props({ foo: string(), ' foo ': string() });
      }).to.throw(Error, 'A prop already exists for `foo`');
    });

    /**
     *
     */
    it('should set the props', () => {
      const record = entity('Foo').props({
        bar: string(),
        pull_request: string(),
        baz: string(),
      });
      ['bar', 'pullRequest', 'baz'].forEach((name) => {
        const prop = record.get('$props').get(name);
        expect(isSchema(prop.get('$schema'))).to.equal(true);
      });
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

  /**
   *
   */
  describe('Entity.getProp', () => {
    /**
     *
     */
    it('should throw an error when the prop does not exist', () => {
      expect(() => {
        entity('Foo').getProp('bar');
      }).to.throw(Error, 'No property named `bar` was found on the `Foo` entity.');
    });

    /**
     *
     */
    it('should return the property definition', () => {
      const prop = entity('Foo').prop('bar', string()).getProp('bar');
      expect(prop).to.be.an.instanceOf(Prop);
    });
  });

  /**
   *
   */
  describe('Entity.getProps', () => {
    /**
     *
     */
    it('should return an immutable map of prop definitions', () => {
      const props = entity('Foo').props({
        bar: string(),
        baz: string(),
      }).getProps();
      expect(isMap(props)).to.equal(true);
      props.forEach((prop) => {
        expect(prop).to.be.an.instanceOf(Prop);
      });
    });
  });
});
