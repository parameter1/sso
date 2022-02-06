/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Joi from '@parameter1/joi';
import Definition from '../../src/dnz-manager/definition.js';
import Target from '../../src/dnz-manager/target.js';

describe('dnz-manager/definition.js', () => {
  const fields = ['name', 'slug', 'deep.prop', 'really.deep.prop'].map((name) => ({
    name,
    schema: Joi.string(),
  }));
  const target = new Target({ on: 'foo::bar' });
  const def = new Definition({ fields, target });

  describe('getUpdateFieldPaths', () => {
    it('should return the appropriate paths', () => {
      const paths = def.getUpdateFieldPaths();
      fields.forEach(({ name }) => expect(paths.get(name)).to.equal(`bar.${name}`));
    });
  });

  describe('buildBulkOpFor', () => {
    const values = {
      name: 'foo',
      slug: null,
      'deep.prop': undefined,
      'really.deep.prop': true,
    };
    it('should throw an error when no id is provided', () => {
      ['', null, undefined].forEach((id) => {
        expect(() => def.buildBulkOpFor({ id })).to.throw(Error, 'The foreign, denormalized model ID is required.');
      });
    });
    it('should return null when no values are provided', () => {
      expect(def.buildBulkOpFor({ id: 1234 })).to.equal(null);
    });
    it('should return null when the resolved values are nullish', () => {
      expect(def.buildBulkOpFor({
        id: 1234,
        values: {
          name: null,
          'deep.prop': undefined,
        },
      })).to.equal(null);
    });
    it('should handle non-array, empty sub path targets', () => {
      const r = def.buildBulkOpFor({ id: 1234, values });
      expect(r).to.deep.equal({
        updateMany: {
          filter: { 'bar._id': 1234 },
          update: {
            $set: { 'bar.name': 'foo', 'bar.really.deep.prop': true },
          },
        },
      });
    });
    it('should handle non-array, sub pathed targets', () => {
      const t = new Target({ on: 'foo::bar', subPath: 'baz.dill' });
      const d = new Definition({ fields, target: t });
      const r = d.buildBulkOpFor({ id: 1234, values });
      expect(r).to.deep.equal({
        updateMany: {
          filter: { 'bar.baz.dill._id': 1234 },
          update: {
            $set: { 'bar.baz.dill.name': 'foo', 'bar.baz.dill.really.deep.prop': true },
          },
        },
      });
    });
    it('should handle array, empty sub path targets', () => {
      const t = new Target({ on: 'foo::bar', isArray: true });
      const d = new Definition({ fields, target: t });
      const r = d.buildBulkOpFor({ id: 1234, values });
      expect(r).to.deep.equal({
        updateMany: {
          filter: { 'bar._id': 1234 },
          update: {
            $set: { 'bar.$[elem].name': 'foo', 'bar.$[elem].really.deep.prop': true },
          },
          arrayFilters: [{ 'elem._id': 1234 }],
        },
      });
    });
    it('should handle array, sub pathed targets', () => {
      const t = new Target({ on: 'foo::bar', isArray: true, subPath: 'baz.dill' });
      const d = new Definition({ fields, target: t });
      const r = d.buildBulkOpFor({ id: 1234, values });
      expect(r).to.deep.equal({
        updateMany: {
          filter: { 'bar.baz.dill._id': 1234 },
          update: {
            $set: { 'bar.$[elem].baz.dill.name': 'foo', 'bar.$[elem].baz.dill.really.deep.prop': true },
          },
          arrayFilters: [{ 'elem.baz.dill._id': 1234 }],
        },
      });
    });
  });
});
