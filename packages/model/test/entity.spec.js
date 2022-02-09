/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { entity, Entity } from '../src/entity.js';
import { isSchema, string } from '../src/schema.js';
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
  describe('Entity.collection()', () => {
    /**
     *
     */
    it('should throw an error if called before the name is set', () => {
      expect(() => {
        (new Entity()).collection('foo');
      }).to.throw(Error, 'The `name` value must be set before continuing.');
    });

    /**
     *
     */
    it('should throw an error when invalid', () => {
      const record = entity('Foo');
      common.testInvalidRequiredStrings((key) => {
        record.collection(key);
      });
    });

    /**
     *
     */
    it('should set the trimmed value as passed', () => {
      ['some_collection', ' some_collection  '].forEach((value) => {
        expect(entity('Foo').collection(value).get('$collection')).to.equal('some_collection');
      });
    });
  });

  /**
   *
   */
  describe('Entity.name()', () => {
    /**
     *
     */
    it('should PascalCase the name', () => {
      ['user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((value) => {
        expect(entity(value).get('$name')).to.equal('UserEvent');
      });
    });

    /**
     *
     */
    it('should ensure the name is singular', () => {
      ['UserEvent', 'user-events', 'userEvents', 'user events', 'user.events', 'UserEvents', 'User Events'].forEach((value) => {
        expect(entity(value).get('$name')).to.equal('UserEvent');
      });
    });

    /**
     *
     */
    it('should add the plural version of the name', () => {
      ['UserEvents', 'user-event', 'userEvent', 'user event', 'user.event', 'UserEvent', 'User Event'].forEach((name) => {
        const ent = entity(name);
        expect(ent.get('$plural')).to.equal('UserEvents');
      });
    });

    /**
     *
     */
    it('should pluralize and param-case the collection name by default', () => {
      const ent1 = entity('Application');
      const ent2 = entity('UserEvent');

      expect(ent1.get('$collection')).to.equal('applications');
      expect(ent2.get('$collection')).to.equal('user-events');
    });
  });

  /**
   *
   */
  describe('Entity.prop()', () => {
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
      }).to.throw(Error, 'A value already exists for `props.bar`');
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
      const prop = record.get('$props').get('fooBar');
      expect(isSchema(prop.get('$schema'))).to.equal(true);
    });
  });
});

//   describe('props', () => {
//     it('should throw an error when the values array is invalid', () => {
//       ['', null, undefined, [], ['foo'], [{ name: null }], [{ schema: {} }]].forEach((values) => {
//         expect(() => {
//           const ent = entity('foo');
//           ent.props(values);
//         }).to.throw(ValidationError);
//       });
//     });

//     it('should set the props', () => {
//       const ent = entity('foo').props([
//         { name: 'bar', schema: string() },
//         { name: 'pull_request', schema: string() },
//         { name: 'baz', schema: string() },
//       ]);
//       ['bar', 'pullRequest', 'baz'].forEach((name) => {
//         const prop = ent.$props.get(name);
//         expect(prop).to.be.an('object');
//         expect(prop.$get('name')).to.equal(name);
//         expect(isSchema(prop.$get('schema'))).to.equal(true);
//       });
//     });
//   });
// });
