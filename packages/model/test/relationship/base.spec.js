/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import BaseRelationship from '../../src/relationship/base.js';

describe('relationship/base.js', () => {
  describe('type', () => {
    it('should throw an error when empty', () => {
      const rel = new BaseRelationship();
      [undefined, null, '', '  ', {}].forEach((value) => {
        expect(() => {
          rel.type(value);
        }).to.throw(ValidationError);
      });
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
      [undefined, null, '', '  ', {}].forEach((value) => {
        expect(() => {
          rel.entity(value);
        }).to.throw(ValidationError);
      });
    });
    it('should set the value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo');
      expect(rel.$get('entity')).to.equal('Foo');
    });
  });

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
      [undefined, null, '', '  ', {}].forEach((value) => {
        expect(() => {
          rel.hasOne(value);
        }).to.throw(ValidationError);
      });
    });
    it('should set the value', () => {
      const rel = (new BaseRelationship()).type('one').entity('foo').hasOne('bar');
      expect(rel.$get('has')).to.equal('Bar');
    });
  });

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
      expect(rel.$get('has')).to.equal('Bar');
    });
  });
});
