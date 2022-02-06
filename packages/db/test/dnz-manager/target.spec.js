/* eslint-disable import/no-extraneous-dependencies */
import { describe, it } from 'mocha';
import { expect } from 'chai';
import Target from '../../src/dnz-manager/target.js';

describe('dnz-manager/target.js', () => {
  it('should throw an error when the `on` value is not a string', () => {
    [null, undefined, 0, true, [], {}].forEach((on) => {
      expect(() => new Target({ on })).to.throw(Error, 'The on value must be a string.');
    });
  });
  it('should throw an error when the `on` value cannot be resolved', () => {
    ['', 'foo', '::bar', '  ::bar', '::', 'foo::', 'foo::  '].forEach((on) => {
      expect(() => new Target({ on })).to.throw(Error, 'Unable to extract a repo name or root field name from the target.');
    });
  });
  it('should trim the repo name and root path from the `on` value', () => {
    ['foo::bar', '  foo::bar  ', ' foo :: bar '].forEach((on) => {
      const target = new Target({ on });
      expect(target.repoName).to.equal('foo');
      expect(target.rootPath).to.equal('bar');
    });
  });

  describe('getArrayFilterField', () => {
    it('should return null when the target is not an array.', () => {
      const target = new Target({ on: 'foo::bar' });
      expect(target.getArrayFilterField()).to.equal(null);
    });
    it('should always start with elem when an array', () => {
      [undefined, 'foo'].forEach((subPath) => {
        const target = new Target({ on: 'foo::bar', isArray: true, subPath });
        expect(target.getArrayFilterField()).to.match(/^elem\./);
      });
    });
    it('should always end with _id when an array', () => {
      [undefined, 'foo'].forEach((subPath) => {
        const target = new Target({ on: 'foo::bar', isArray: true, subPath });
        expect(target.getArrayFilterField()).to.match(/\._id$/);
      });
    });
    it('should include the sub path when present when an array', () => {
      ['foo', 'foo.bar'].forEach((subPath) => {
        const target = new Target({ on: 'foo::bar', isArray: true, subPath });
        expect(target.getArrayFilterField()).to.equal(`elem.${subPath}._id`);
      });
    });
    it('should not include the sub path when not present when an array', () => {
      const target = new Target({ on: 'foo::bar', isArray: true });
      expect(target.getArrayFilterField()).to.equal('elem._id');
    });
  });
  describe('getQueryIDField', () => {
    it('should always start with the root path value', () => {
      [
        { subPath: 'baz', isArray: false },
        { subPath: 'baz', isArray: true },
        { isArray: true },
        { isArray: false },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getQueryIDField()).to.match(/^bar\./);
      });
    });
    it('should always end with _id', () => {
      [
        { subPath: 'baz', isArray: false },
        { subPath: 'baz', isArray: true },
        { isArray: true },
        { isArray: false },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getQueryIDField()).to.match(/\._id$/);
      });
    });
    it('should include the sub path when present', () => {
      [
        { subPath: 'baz', isArray: false },
        { subPath: 'baz', isArray: true },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getQueryIDField()).to.equal('bar.baz._id');
      });
      [
        { subPath: 'baz.dill', isArray: false },
        { subPath: 'baz.dill', isArray: true },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getQueryIDField()).to.equal('bar.baz.dill._id');
      });
    });
    it('should not include the sub path when not present', () => {
      [
        { subPath: '', isArray: false },
        { subPath: '', isArray: true },
        { isArray: false },
        { isArray: true },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getQueryIDField()).to.equal('bar._id');
      });
    });
  });
  describe('getUpdateFieldPathFor', () => {
    it('should return the appended path', () => {
      ['name', 'slug', 'deep.prop'].forEach((path) => {
        const t1 = new Target({ on: 'foo::bar' });
        expect(t1.getUpdateFieldPathFor(path)).equal(`bar.${path}`);

        const t2 = new Target({ on: 'foo::bar', isArray: true });
        expect(t2.getUpdateFieldPathFor(path)).equal(`bar.$[elem].${path}`);

        const t3 = new Target({ on: 'foo::bar', subPath: 'baz' });
        expect(t3.getUpdateFieldPathFor(path)).equal(`bar.baz.${path}`);

        const t4 = new Target({ on: 'foo::bar', subPath: 'baz', isArray: true });
        expect(t4.getUpdateFieldPathFor(path)).equal(`bar.$[elem].baz.${path}`);
      });
    });
  });
  describe('getUpdateFieldPrefix', () => {
    it('should always equal the root path when not an array lacking a subpath', () => {
      [
        {},
        { isArray: false },
        { isArray: false, subPath: '' },
        { isArray: false, subPath: null },
        { subPath: null },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getUpdateFieldPrefix()).to.equal('bar');
      });
    });
    it('should always end with the sub path when present', () => {
      [
        { isArray: true, subPath: 'baz' },
        { isArray: false, subPath: 'baz' },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getUpdateFieldPrefix()).to.match(/\.baz$/);
      });
    });
    it('should end with $[elem] when an array without a sub path', () => {
      [
        { isArray: true },
        { isArray: true, subPath: '' },
        { isArray: true, subPath: null },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getUpdateFieldPrefix()).to.equal('bar.$[elem]');
      });
    });
    it('should end with $[elem] and the sub path when an array with a sub path', () => {
      [
        { isArray: true, subPath: 'baz' },
        { isArray: true, subPath: 'baz.dill' },
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getUpdateFieldPrefix()).to.equal(`bar.$[elem].${params.subPath}`);
      });
    });
    it('should never contain $[elem] when not an array', () => {
      [
        { isArray: false, subPath: 'baz' },
        { subPath: 'baz.dill' },
        {},
      ].forEach((params) => {
        const target = new Target({ on: 'foo::bar', ...params });
        expect(target.getUpdateFieldPrefix()).to.not.contain('$[elem]');
      });
    });
  });
});
