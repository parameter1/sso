/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import BaseRelationship from '../../src/relationship/base.js';
import common from '../common.js';

describe('relationship/base.js', () => {
  describe('type', () => {
    it('should throw an error when empty', () => {
      const rel = new BaseRelationship();
      common.testInvalidRequiredStrings((value) => {
        rel.type(value);
      });
    });
    it('should throw an error when the value is neither one or many', () => {
      expect(() => {
        (new BaseRelationship()).type('foo');
      }).to.throw(Error, '"type" must be one of [one, many]');
    });
    it('should throw an error if the value has already been set', () => {
      const rel = (new BaseRelationship()).type('one');
      expect(() => {
        rel.type('many');
      }).to.throw(Error, 'A value already exists for `type`');
    });
    it('should accept one as a value', () => {
      const rel = new BaseRelationship();
      const r = rel.type('one');
      expect(r.$get('type')).to.equal('one');
    });
    it('should accept many as a value', () => {
      const rel = new BaseRelationship();
      const r = rel.type('many');
      expect(r.$get('type')).to.equal('many');
    });
  });

  describe('entity', () => {
    it('should use the entity name utility when setting the name');
    it('should throw an error if called before the type is set', () => {
      const rel = new BaseRelationship();
      expect(() => {
        rel.entity('foo');
      }).to.throw(Error, 'The relationship `type` value must be set first.');
    });
    it('should throw an error when empty', () => {
      const rel = (new BaseRelationship()).type('one');
      common.testInvalidRequiredStrings((value) => {
        rel.entity(value);
      });
    });
    it('should throw an error if the value has already been set', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo');
      expect(() => {
        rel.entity('bar');
      }).to.throw(Error, 'A value already exists for `entity`');
    });
    it('should set the value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo');
      expect(rel.$get('entity')).to.equal('Foo');
    });
  });

  describe('has', () => {
    it('should throw an error if the value has already been set', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo').hasMany('bar');
      expect(() => {
        rel.hasMany('foo');
      }).to.throw(Error, 'A value already exists for `has.type`');
    });
    it('should throw an error when the type is neither one or many', () => {
      expect(() => {
        (new BaseRelationship()).type('one').entity('Foo').has('df', 'bar');
      }).to.throw(Error, '"has.type" must be one of [one, many]');
    });
  });

  // @todo convert to sinon
  describe('hasOne', () => {
    it('should use the entity name utility when setting the name');
    it('should throw an error if called before the type is set', () => {
      const rel = new BaseRelationship();
      expect(() => {
        rel.hasOne('foo');
      }).to.throw(Error, 'The relationship `type` value must be set first.');
    });

    it('should throw an error if called before the entity is set', () => {
      const rel = (new BaseRelationship()).type('one');
      expect(() => {
        rel.hasOne('foo');
      }).to.throw(Error, 'The relationship `entity` value must be set first.');
    });

    it('should throw an error when empty', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo');
      common.testInvalidRequiredStrings((value) => {
        rel.hasOne(value);
      });
    });
    it('should set the value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo').hasOne('bar');
      expect(rel.$get('has')).to.deep.equal({ type: 'one', entity: 'Bar' });
    });
  });

  // @todo convert to sinon
  describe('hasMany', () => {
    it('should use the entity name utility when setting the name');
    it('should throw an error if called before the type is set', () => {
      const rel = new BaseRelationship();
      expect(() => {
        rel.hasMany('foo');
      }).to.throw(Error, 'The relationship `type` value must be set first.');
    });

    it('should throw an error if called before the entity is set', () => {
      const rel = (new BaseRelationship()).type('one');
      expect(() => {
        rel.hasMany('foo');
      }).to.throw(Error, 'The relationship `entity` value must be set first.');
    });

    it('should set the value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo').hasMany('bar');
      expect(rel.$get('has')).to.deep.equal({ type: 'many', entity: 'Bar' });
    });
  });

  describe('as', () => {
    it('should throw an error if called before the type is set', () => {
      const rel = new BaseRelationship();
      expect(() => {
        rel.as('foo');
      }).to.throw(Error, 'The relationship `type` value must be set first.');
    });

    it('should throw an error if called before the entity is set', () => {
      const rel = (new BaseRelationship()).type('one');
      expect(() => {
        rel.as('foo');
      }).to.throw(Error, 'The relationship `entity` value must be set first.');
    });

    it('should throw an error if called before has is set', () => {
      const rel = (new BaseRelationship()).type('one').entity('Foo');
      expect(() => {
        rel.as('foo');
      }).to.throw(Error, 'The relationship `has` value must be set first.');
    });

    it('should throw an error when empty', () => {
      const rel = (new BaseRelationship()).type('one').entity('Foo').hasMany('Bar');
      common.testInvalidRequiredStrings((value) => {
        rel.as(value);
      });
    });

    it('should set the camelized value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo').hasOne('bar');
      ['userEvent', 'UserEvent', 'user-event', 'user event', ' userEvent '].forEach((value) => {
        expect(rel.as(value).$get('as')).to.equal('userEvent');
      });
    });
  });

  describe('$localField', () => {
    it('should use the the plural `has.entity` value `has.type` is many', () => {
      const rel = (new BaseRelationship()).type('one').entity('User').hasMany('UserEvent');
      expect(rel.$localField()).to.equal('userEvents');
    });

    it('should use the the singular `has.entity` value `has.type` is one', () => {
      const rel = (new BaseRelationship()).type('one').entity('User').hasOne('UserEvents');
      expect(rel.$localField()).to.equal('userEvent');
    });

    it('should use the as value when set', () => {
      const rel = (new BaseRelationship()).type('one').entity('User')
        .hasMany('UserEvent')
        .as('foo_bar');
      expect(rel.$localField()).to.equal('fooBar');
    });
  });
});
