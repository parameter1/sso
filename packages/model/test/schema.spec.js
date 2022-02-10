/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { isMap } from 'immutable';
import { entity } from '../src/entity.js';
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
  });
});
