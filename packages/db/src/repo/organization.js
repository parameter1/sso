import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as attrs,
  userAttributes as userAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';
import DenormalizationManager from '../dnz-manager/index.js';

import { buildUpdatePipeline, slugRedirects } from './pipelines/index.js';

export default class OrganizationRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'organizations',
      collatableFields: ['name'],
      indexes: [
        { key: { slug: 1 }, unique: true, collation: { locale: 'en_US' } },
        { key: { redirects: 1 } },

        { key: { name: 1, _id: 1 }, collation: { locale: 'en_US' } },
      ],
    });

    this.dnzManager = new DenormalizationManager({
      repoManager: this.manager,
      globalFields: [
        // @todo vet schema and required prop usage
        { name: 'name', schema: attrs.name, required: true },
        { name: 'slug', schema: attrs.slug, required: true },
      ],
      // @todo automatically update `date.updated`??
      definitions: [
        ['application::workspaces', { subPath: 'org', isArray: true }],
        ['user::manages', { subPath: 'org', isArray: true }],
        ['user::memberships', { subPath: 'workspace.org', isArray: true }],
        ['workspace::org', { subPath: null, isArray: false }],
      ],
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.id
   * @param {string[]} params.emailDomains
   */
  async addEmailDomains(params = {}) {
    const {
      id,
      emailDomains,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      emailDomains: Joi.array().items(attrs.emailDomain.required()).required(),
    }).required(), params);

    const $or = emailDomains.map((domain) => ({ emailDomains: { $ne: domain } }));
    return this.updateOne({
      query: { _id: id, $or },
      update: {
        $set: { 'date.updated': new Date() },
        $addToSet: { emailDomains: { $each: emailDomains } },
      },
    });
  }

  /**
   *
   * @param {object} params
   * @param {object} params.org
   * @param {object} params.user
   * @param {string} params.role
   */
  async addManager(params = {}) {
    const {
      org,
      user,
      role,
    } = await validateAsync(Joi.object({
      org: Joi.object({
        _id: attrs.id.required(),
        name: attrs.name.required(),
        slug: attrs.slug.required(),
      }).required(),
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
        givenName: userAttrs.givenName.required(),
        familyName: userAttrs.familyName.required(),
      }).required(),
      role: attrs.managerRole.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };
    try {
      const results = await Promise.all([
        this.updateOne({
          query: { _id: org._id, 'managers.user._id': { $ne: user._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              managers: cleanDocument({ user, role, date: { added: now, updated: now } }),
            },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: user._id, 'manages.org._id': { $ne: org._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              manages: cleanDocument({ org, role, date: { added: now, updated: now } }),
            },
          },
          options,
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no records were found for the provided criteria or this user is already a manager of this org.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.orgId
   * @param {ObjectId} params.userId
   * @param {string} params.role
   */
  async changeManagerRole(params = {}) {
    const {
      orgId,
      userId,
      role,
    } = await validateAsync(Joi.object({
      orgId: attrs.id.required(),
      userId: userAttrs.id.required(),
      role: attrs.managerRole.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };

    try {
      const results = await Promise.all([
        this.updateOne({
          query: {
            _id: orgId,
            managers: { $elemMatch: { 'user._id': userId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'managers.$[elem].role': role,
              'managers.$[elem].date.updated': now,
              'date.updated': now,
            },
          },
          options: {
            ...options,
            arrayFilters: [{ 'elem.user._id': userId }],
          },
        }),
        this.manager.$('user').updateOne({
          query: {
            _id: userId,
            manages: { $elemMatch: { 'org._id': orgId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'manages.$[elem].role': role,
              'manages.$[elem].date.updated': now,
              'date.updated': now,
            },
          },
          options: {
            ...options,
            arrayFilters: [{ 'elem.org._id': orgId }],
          },
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no record was found for the provided criteria or this user does not a have the requested management role for this org.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.slug
   * @param {string[]} [params.emailDomains=[]]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      name,
      slug,
      emailDomains,
      options,
    } = await validateAsync(Joi.object({
      name: attrs.name.required(),
      slug: attrs.slug.required(),
      emailDomains: attrs.emailDomains.default([]),
      options: Joi.object().default({}),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug });

    const now = new Date();
    return this.insertOne({
      doc: cleanDocument({
        name,
        slug,
        date: {
          created: now,
          updated: now,
        },
        managers: [],
        workspaces: [],
        redirects: [],
        emailDomains,
      }, { preserveEmptyArrays: true }),
      options,
    });
  }

  /**
   * Finds an organization by slug.
   *
   * @param {object} params
   * @param {string} params.slug
   * @param {object} [params.options]
   */
  findBySlug({ slug, options } = {}) {
    return this.findOne({ query: { slug }, options });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.appId
   * @param {object} params.workspace
   * @param {ObjectId} params.workspace._id
   * @param {string} params.workspace.name
   * @param {string} params.workspace.slug
   * @param {object} params.workspace.org
   * @param {object} [params.options={}]
   */
  async pushRelatedWorkspace(params = {}) {
    const {
      orgId,
      workspace,
      options,
    } = await validateAsync(Joi.object({
      orgId: attrs.id.required(),
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        slug: workspaceAttrs.slug.required(),
        name: workspaceAttrs.name.required(),
        app: Joi.object({
          _id: appAttrs.id.required(),
          slug: appAttrs.slug.required(),
          name: appAttrs.name.required(),
        }).required(),
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    return this.updateOne({
      query: { _id: orgId, 'workspaces._id': { $ne: workspace._id } },
      update: { $addToSet: { workspaces: cleanDocument(workspace) } },
      options,
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.id
   * @param {string[]} params.emailDomains
   */
  async removeEmailDomains(params = {}) {
    const {
      id,
      emailDomains,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      emailDomains: Joi.array().items(attrs.emailDomain.required()).required(),
    }).required(), params);

    const $or = emailDomains.map((domain) => ({ emailDomains: domain }));
    return this.updateOne({
      query: { _id: id, $or },
      update: {
        $set: { 'date.updated': new Date() },
        $pull: { emailDomains: { $in: emailDomains } },
      },
    });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.orgId
   * @param {ObjectId} params.userId
   */
  async removeManager(params = {}) {
    const {
      orgId,
      userId,
    } = await validateAsync(Joi.object({
      orgId: attrs.id.required(),
      userId: userAttrs.id.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };
    try {
      const results = await Promise.all([
        this.updateOne({
          query: { _id: orgId, 'managers.user._id': userId },
          update: {
            $set: { 'date.updated': now },
            $pull: { managers: { 'user._id': userId } },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: userId, 'manages.org._id': orgId },
          update: {
            $set: { 'date.updated': now },
            $pull: { manages: { 'org._id': orgId } },
          },
          options,
        }),
      ]);
      await session.commitTransaction();
      return results;
    } catch (e) {
      await session.abortTransaction();
      if (e.statusCode === 404) {
        e.statusCode = 400;
        e.message = 'Either no records were found for the provided criteria or this user is not a manager of this org.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} [params.id]
   * @param {string} [params.slug]
   */
  throwIfSlugHasRedirect({ id, slug } = {}) {
    return this.manager.throwIfSlugHasRedirect({ repo: 'organization', id, slug });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.name
   */
  async updateName(params = {}) {
    const {
      id,
      name,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      name: attrs.name.required(),
    }).required(), params);

    const update = buildUpdatePipeline([
      { path: 'name', value: name },
    ]);
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the org.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      const { dnzManager } = this;
      await dnzManager.executeRepoBulkOps({
        repoBulkOps: dnzManager.buildRepoBulkOpsFor({ id, values: { name } }),
        options: { session },
      });

      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.slug
   */
  async updateSlug(params = {}) {
    const {
      id,
      slug,
    } = await validateAsync(Joi.object({
      id: attrs.id.required(),
      slug: attrs.slug.required(),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ id, slug });
    const update = buildUpdatePipeline([
      { path: 'slug', value: slug, set: () => slugRedirects(slug) },
    ]);

    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the org.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      const { dnzManager } = this;
      await dnzManager.executeRepoBulkOps({
        repoBulkOps: dnzManager.buildRepoBulkOpsFor({ id, values: { slug } }),
        options: { session },
      });

      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}
