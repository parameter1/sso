/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { ValidationError } from '@parameter1/joi';
import { Relationship, many, one } from '../src/relationship.js';
import { Has } from '../src/relationship/has.js';
import common from './common.js';

describe('relationship.js', () => {
  /**
   *
   */
  describe('many()', () => {
    /**
     *
     */
    it('should set the type to `many` with an entity name', () => {
      const r = many('foo');
      expect(r.getType()).to.equal('many');
      expect(r.getEntityName()).to.equal('Foo');
    });
  });

  /**
   *
   */
  describe('one()', () => {
    /**
     *
     */
    it('should set the type to `one` with an entity name', () => {
      const r = one('foo');
      expect(r.getType()).to.equal('one');
      expect(r.getEntityName()).to.equal('Foo');
    });
  });

  /**
   *
   */
  describe('Relationship.type', () => {
    /**
     *
     */
    it('should throw an error when empty', () => {
      const rel = new Relationship();
      common.testInvalidRequiredStrings((value) => {
        rel.type(value);
      });
    });

    /**
     *
     */
    it('should throw an error when the value is neither one or many', () => {
      expect(() => {
        (new Relationship()).type('foo');
      }).to.throw(ValidationError, '"$type" must be one of [one, many]');
    });

    /**
     *
     */
    it('should throw an error if the value has already been set', () => {
      const rel = (new Relationship()).type('one');
      expect(() => {
        rel.type('many');
      }).to.throw(Error, 'A value already exists for `$type`');
    });

    /**
     *
     */
    it('should accept one as a value', () => {
      const rel = (new Relationship()).type('one');
      expect(rel.getType()).to.equal('one');
    });

    /**
     *
     */
    it('should accept many as a value', () => {
      const rel = (new Relationship()).type('many');
      expect(rel.getType()).to.equal('many');
    });
  });

  /**
   *
   */
  describe('Relationship.entity', () => {
    it('should use the entity name utility when setting the name');

    /**
     *
     */
    it('should throw an error when empty', () => {
      const rel = (new Relationship()).type('one');
      common.testInvalidRequiredStrings((value) => {
        rel.entity(value);
      });
    });

    /**
     *
     */
    it('should throw an error if the value has already been set', () => {
      const rel = (new Relationship()).type('one').entity('foo');
      expect(() => {
        rel.entity('bar');
      }).to.throw(Error, 'A value already exists for `$entity`');
    });

    /**
     *
     */
    it('should set the value', () => {
      const rel = (new Relationship()).type('one').entity('foo');
      expect(rel.getEntityName()).to.equal('Foo');
    });
  });

  /**
   *
   */
  describe('Relationship.hasOne/hasMany', () => {
    it('should use the entity name utility when setting the name');

    /**
     *
     */
    it('should throw an error when the entity is empty', () => {
      const rel = one('foo');
      common.testInvalidRequiredStrings((value) => {
        rel.hasOne(value);
      });
      common.testInvalidRequiredStrings((value) => {
        rel.hasMany(value);
      });
    });
  });

  /**
   *
   */
  describe('Relationship.hasOne', () => {
    /**
     *
     */
    it('should set the value', () => {
      const rel = one('foo').hasOne('bar');
      const has = rel.getHas();
      expect(has).to.be.an.instanceOf(Has);
      expect(has.getType()).to.equal('one');
      expect(has.getEntityName()).to.equal('Bar');
    });
  });

  /**
   *
   */
  describe('Relationship.hasMany', () => {
    /**
     *
     */
    it('should set the value', () => {
      const rel = one('foo').hasMany('bars');
      const has = rel.getHas();
      expect(has).to.be.an.instanceOf(Has);
      expect(has.getType()).to.equal('many');
      expect(has.getEntityName()).to.equal('Bar');
    });
  });
});

// describe('relationship.js', () => {
//   describe('Relationship', () => {

//     describe('as', () => {
//       it('should throw an error if called before the type is set', () => {
//         const rel = new Relationship();
//         expect(() => {
//           rel.as('foo');
//         }).to.throw(Error, 'The `type` value must be set before continuing.');
//       });

//       it('should throw an error if called before the entity is set', () => {
//         const rel = (new Relationship()).type('one');
//         expect(() => {
//           rel.as('foo');
//         }).to.throw(Error, 'The `entity` value must be set before continuing.');
//       });

//       it('should throw an error if called before has is set', () => {
//         const rel = (new Relationship()).type('one').entity('Foo');
//         expect(() => {
//           rel.as('foo');
//         }).to.throw(Error, 'The `has` value must be set before continuing.');
//       });

//       it('should throw an error when empty', () => {
//         const rel = (new Relationship()).type('one').entity('Foo').hasMany('Bar');
//         common.testInvalidRequiredStrings((value) => {
//           rel.as(value);
//         });
//       });

//       it('should set the camelized value', () => {
//         const rel = (new Relationship()).type('one').entity('foo').hasOne('bar');
//         ['userEvent', 'UserEvent', 'user-event', 'user event', ' userEvent '].forEach((value) => {
//           expect(rel.as(value).$get('as')).to.equal('userEvent');
//         });
//       });
//     });

//     describe('$localField', () => {
//       it('should use the the plural `has.entity` value `has.type` is many', () => {
//         const rel = (new Relationship()).type('one').entity('User').hasMany('UserEvent');
//         expect(rel.$localField()).to.equal('userEvents');
//       });

//       it('should use the the singular `has.entity` value `has.type` is one', () => {
//         const rel = (new Relationship()).type('one').entity('User').hasOne('UserEvents');
//         expect(rel.$localField()).to.equal('userEvent');
//       });

//       it('should use the as value when set', () => {
//         const rel = (new Relationship()).type('one').entity('User')
//           .hasMany('UserEvent')
//           .as('foo_bar');
//         expect(rel.$localField()).to.equal('fooBar');
//       });
//     });

//     describe('with', () => {
//       it('should throw an error if called before the type is set', () => {
//         const rel = new Relationship();
//         expect(() => {
//           rel.with([]);
//         }).to.throw(Error, 'The `type` value must be set before continuing.');
//       });

//       it('should throw an error if called before the entity is set', () => {
//         const rel = (new Relationship()).type('one');
//         expect(() => {
//           rel.with([]);
//         }).to.throw(Error, 'The `entity` value must be set before continuing.');
//       });

//       it('should throw an error if called before has is set', () => {
//         const rel = (new Relationship()).type('one').entity('Foo');
//         expect(() => {
//           rel.with([]);
//         }).to.throw(Error, 'The `has` value must be set before continuing.');
//       });

//       it('should throw an error when the value is not a string, array, or object', () => {
//         const rel = (new Relationship()).type('one').entity('Foo').has('one', 'Bar');
//         [null, undefined, true, 1].forEach((value) => {
//           expect(() => {
//             rel.with(value);
//           }).to.throw(ValidationError);
//         });
//       });

//       it('should set the related props and edges using an object', () => {
//         const rel = (new Relationship())
//           .type('one')
//           .entity('Foo')
//           .has('one', 'Bar')
//           .with({ props: ['foo', 'bar'], edges: ['dill'] })
//           .with({ props: ['baz', 'bar'], edges: ['dill', 'bag'] });
//         const props = rel.$get('with.props');
//         expect(props).to.be.an.instanceOf(Set);
//         expect(props.size).to.equal(3);
//         ['foo', 'bar', 'baz'].forEach((prop) => expect(props.has(prop)).to.equal(true));

//         const edges = rel.$get('with.edges');
//         expect(edges).to.be.an.instanceOf(Set);
//         expect(edges.size).to.equal(2);
//         ['dill', 'bag'].forEach((prop) => expect(edges.has(prop)).to.equal(true));
//       });

//       it('should set the related props using a string', () => {
//         const rel = (new Relationship())
//           .type('one')
//           .entity('Foo')
//           .has('one', 'Bar')
//           .with('foo')
//           .with('bar')
//           .with('foo');
//         const props = rel.$get('with.props');
//         expect(props).to.be.an.instanceOf(Set);
//         expect(props.size).to.equal(2);
//         ['foo', 'bar'].forEach((prop) => expect(props.has(prop)).to.equal(true));
//       });

//       it('should set the related props using an array', () => {
//         const rel = (new Relationship())
//           .type('one')
//           .entity('Foo')
//           .has('one', 'Bar')
//           .with(['foo', 'bar'])
//           .with(['baz', 'foo']);
//         const props = rel.$get('with.props');
//         expect(props).to.be.an.instanceOf(Set);
//         expect(props.size).to.equal(3);
//         ['foo', 'bar', 'baz'].forEach((prop) => expect(props.has(prop)).to.equal(true));
//       });

//       it('should filter the `_id` field from props and edges', () => {
//         const rel = (new Relationship())
//           .type('one')
//           .entity('Foo')
//           .has('one', 'Bar')
//           .with({ props: ['_id'], edges: ['_id'] });
//         const props = rel.$get('with.props');
//         expect(props).to.be.an.instanceOf(Set);
//         expect(props.size).to.equal(0);

//         const edges = rel.$get('with.edges');
//         expect(edges).to.be.an.instanceOf(Set);
//         expect(edges.size).to.equal(0);
//       });
//     });
//   });
// });
