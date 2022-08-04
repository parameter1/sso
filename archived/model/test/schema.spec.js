/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { isMap } from 'immutable';
import { entity } from '../src/entity.js';
import { many, one } from '../src/relationship.js';
import { createSchema } from '../src/schema.js';
import common from './common.js';

describe('schema.js', () => {
  /**
   *
   */
  describe('Schema.entities', () => {
    /**
     *
     */
    it('should throw an error when invalid', () => {
      common.testInvalidRequiredStrings((key) => {
        createSchema().entities(key);
      });
    });

    /**
     *
     */
    it('should error when the entity already exists', () => {
      expect(() => {
        createSchema().entities([
          entity('Application'),
          entity('application'),
        ]);
      }).to.throw(Error, 'An entity has already be added for `Application`');
    });

    /**
     *
     */
    it('should add the entities', () => {
      const schema = createSchema().entities([
        entity('application'),
        entity('Tag'),
        entity('Users'),
      ]);
      const entities = schema.getEntities();
      expect(isMap(entities)).to.equal(true);
      expect(entities.size).to.equal(3);
      expect([...entities.keys()]).to.deep.equal(['Application', 'Tag', 'User']);
    });

    /**
     *
     */
    it('should add the entities using subsequent calls', () => {
      const schema = createSchema()
        .entities([entity('application')])
        .entities([entity('Tag')])
        .entities([entity('Users')]);

      const entities = schema.getEntities();
      expect(isMap(entities)).to.equal(true);
      expect(entities.size).to.equal(3);
      expect([...entities.keys()]).to.deep.equal(['Application', 'Tag', 'User']);
    });
  });

  /**
   *
   */
  describe('Schema.relationships', () => {
    /**
     *
     */
    it('should throw an error when invalid', () => {
      common.testInvalidRequiredStrings((key) => {
        createSchema().relationships(key);
      });
    });

    /**
     *
     */
    it('should error when the relationship already exists', () => {
      expect(() => {
        createSchema().relationships([
          many('Applications').haveMany('Tags'),
          many('Applications').haveMany('Tags'),
        ]);
      }).to.throw(Error, 'A `many` relationship using field `tag` is already registered for `Application`');

      expect(() => {
        createSchema().relationships([
          many('Applications').haveMany('Tags'),
          many('Applications').haveMany('Foos').as('tags'),
        ]);
      }).to.throw(Error, 'A `many` relationship using field `tag` is already registered for `Application`');

      expect(() => {
        createSchema().relationships([
          one('Applications').haveMany('Tags'),
          many('Applications').haveMany('Tags'),
        ]);
      }).to.throw(Error, 'A `many` relationship using field `tag` is already registered for `Application`');
    });

    /**
     *
     */
    it('should add the relationships', () => {
      const schema = createSchema().relationships([
        many('Organizations').haveMany('Users').as('managers'),
        many('Organizations').haveMany('Users'),
        one('Organization').hasMany('Workspaces'),
        many('UserEvents').haveOne('User'),
      ]);
      const relationships = schema.getRelationships();
      expect(isMap(relationships)).to.equal(true);
      expect([...relationships.keys()]).to.deep.equal([
        'Organization.many.manager',
        'Organization.many.user',
        'Organization.many.workspace',
        'UserEvent.one.user',
      ]);
    });

    /**
     *
     */
    it('should add the relationships using subsequent calls', () => {
      const schema = createSchema()
        .relationships([many('Organizations').haveMany('Users').as('managers')])
        .relationships([one('Organization').hasMany('Workspaces')])
        .relationships([many('UserEvents').haveOne('User')]);

      const relationships = schema.getRelationships();
      expect(isMap(relationships)).to.equal(true);
      expect([...relationships.keys()]).to.deep.equal([
        'Organization.many.manager',
        'Organization.many.workspace',
        'UserEvent.one.user',
      ]);
    });
  });
});
