/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { isRecord, isMap } from 'immutable';
import { withProps } from '../src/with-props.js';
import { PropTypes, isPropType } from '../src/prop-types.js';
import { Prop } from '../src/prop.js';
import common from './common.js';

const { string } = PropTypes;

describe('with-props.js', () => {
  /**
   *
   */
  describe('withProps()', () => {
    /**
     *
     */
    it('should return a new record', () => {
      const record = withProps();
      expect(isRecord(record)).to.equal(true);
    });
  });

  /**
   *
   */
  describe('WithProps.getProp', () => {
    /**
     *
     */
    it('should throw an error when the prop does not exist', () => {
      expect(() => {
        withProps().getProp('bar');
      }).to.throw(Error, 'No prop was found for `bar`');
    });

    /**
     *
     */
    it('should return the property definition', () => {
      const prop = withProps().prop('bar', string()).getProp('bar');
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
      const props = withProps('Foo').props({
        bar: string(),
        baz: string(),
      }).getProps();
      expect(isMap(props)).to.equal(true);
      props.forEach((prop) => {
        expect(prop).to.be.an.instanceOf(Prop);
      });
    });
  });

  /**
   *
   */
  describe('WithProps.prop', () => {
    /**
     *
     */
    it('should throw an error when the name is invalid', () => {
      common.testInvalidRequiredStrings((name) => {
        withProps().prop(name);
      });
    });

    /**
     *
     */
    it('should throw an error when an existing prop is already set', () => {
      expect(() => {
        withProps().prop('bar', string()).prop('bar', string());
      }).to.throw(Error, 'A prop already exists for `bar`');
    });

    /**
     *
     */
    it('should throw an error when schema is not a Joi object', () => {
      [undefined, null, {}, string].forEach((schema) => {
        expect(() => {
          withProps().prop('bar', schema);
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should camelize the prop name', () => {
      ['foo_bar', 'FooBar', 'foo-bar', 'foo bar', 'foo.bar', 'foo__bar'].forEach((name) => {
        const record = withProps().prop(name, string());
        expect(record.get('$props').has('fooBar')).to.equal(true);
      });
    });

    /**
     *
     */
    it('should set the schema to the prop', () => {
      const record = withProps().prop('fooBar', string());
      const prop = record.getProp('fooBar');
      expect(isPropType(prop.getType())).to.equal(true);
    });

    /**
     *
     */
    it('should unset the prop when the schema is null', () => {
      const record = withProps().prop('fooBar', string());
      expect(record.hasProp('fooBar')).to.equal(true);
      const removed = record.prop('foo_bar', null);
      expect(removed.hasProp('fooBar')).to.equal(false);
      expect(removed.hasProp('foo_bar')).to.equal(false);
    });
  });

  /**
   *
   */
  describe('WithProps.props', () => {
    /**
     *
     */
    it('should throw an error when the values are invalid', () => {
      [undefined, null, '', ' '].forEach((value) => {
        expect(() => {
          withProps().props(value);
        }).to.throw(ValidationError);
      });
    });

    /**
     *
     */
    it('should throw an error when an existing prop is already set', () => {
      expect(() => {
        withProps().props({ foo: string(), bar: string() }).props({ foo: string() });
      }).to.throw(Error, 'A prop already exists for `foo`');

      expect(() => {
        withProps().props({ foo: string(), ' foo ': string() });
      }).to.throw(Error, 'A prop already exists for `foo`');
    });

    /**
     *
     */
    it('should set the props', () => {
      const record = withProps().props({
        bar: string(),
        pull_request: string(),
        baz: string(),
      });
      ['bar', 'pullRequest', 'baz'].forEach((name) => {
        const prop = record.getProps().get(name);
        expect(isPropType(prop.getType())).to.equal(true);
      });
    });
  });
});
