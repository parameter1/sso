import { ManagedRepo, cleanDocument } from '@parameter1/mongodb';
import Joi, { validateAsync } from '@parameter1/joi';
import {
  applicationAttributes as appAttrs,
  organizationAttributes as orgAttrs,
  userAttributes as userAttrs,
  workspaceAttributes as workspaceAttrs,
} from '../schema/attributes/index.js';

import { buildUpdateNamePipeline } from './pipelines/index.js';

export default class WorkspaceRepo extends ManagedRepo {
  /**
   *
   * @param {object} params
   */
  constructor(params = {}) {
    super({
      ...params,
      collectionName: 'workspaces',
      collatableFields: [],
      indexes: [
        { key: { 'org._id': 1, 'app._id': 1, slug: 1 }, unique: true },
        { key: { redirects: 1 } },
      ],
    });
  }

  /**
   *
   * @param {object} params
   * @param {object} params.workspace
   * @param {object} params.workspace.app
   * @param {object} params.workspace.org
   * @param {object} params.user
   * @param {string} params.role
   */
  async addMember(params = {}) {
    const {
      workspace,
      user,
      role,
    } = await validateAsync(Joi.object({
      workspace: Joi.object({
        _id: workspaceAttrs.id.required(),
        slug: workspaceAttrs.slug.required(),
        name: Joi.string().required(),
        app: Joi.object({
          _id: appAttrs.id.required(),
          slug: appAttrs.slug.required(),
          name: appAttrs.name.required(),
        }).required(),
        org: Joi.object({
          _id: orgAttrs.id.required(),
          slug: orgAttrs.slug.required(),
          name: orgAttrs.name.required(),
        }).required(),
      }).required(),
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email.required(),
        familyName: userAttrs.familyName.required(),
        givenName: userAttrs.givenName.required(),
      }).required(),
      role: Joi.string().required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true };
    try {
      const results = await Promise.all([
        this.updateOne({
          query: { _id: workspace._id, 'members.user._id': { $ne: user._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              members: cleanDocument({ user, role, date: { added: now, updated: now } }),
            },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: user._id, 'memberships.workspace._id': { $ne: workspace._id } },
          update: {
            $set: { 'date.updated': now },
            $addToSet: {
              memberships: cleanDocument({ workspace, role, date: { added: now, updated: now } }),
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
        e.message = 'Either no records were found for the provided criteria or this user is already a member of this workspace.';
      }
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.workspaceId
   * @param {ObjectId} params.userId
   * @param {string} params.role
   */
  async changeMemberRole(params = {}) {
    const {
      workspaceId,
      userId,
      role,
    } = await validateAsync(Joi.object({
      workspaceId: workspaceAttrs.id.required(),
      userId: userAttrs.id.required(),
      role: workspaceAttrs.role.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };

    try {
      const results = await Promise.all([
        this.updateOne({
          query: {
            _id: workspaceId,
            members: { $elemMatch: { 'user._id': userId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'members.$[elem].role': role,
              'members.$[elem].date.updated': now,
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
            memberships: { $elemMatch: { 'workspace._id': workspaceId, role: { $ne: role } } },
          },
          update: {
            $set: {
              'memberships.$[elem].role': role,
              'memberships.$[elem].date.updated': now,
              'date.updated': now,
            },
          },
          options: {
            ...options,
            arrayFilters: [{ 'elem.workspace._id': workspaceId }],
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
   *
   * @param {object} params.app
   * @param {ObjectId} params.app._id
   * @param {string} params.app.slug
   * @param {string} params.app.name
   *
   * @param {object} params.org
   * @param {ObjectId} params.org._id
   * @param {string} params.org.slug
   * @param {string} params.org.name
   *
   * @param {string} params.slug
   * @param {string} params.name
   *
   * @param {object[]} params.urls
   */
  async create(params = {}) {
    const {
      app,
      org,
      slug,
      name,
      // urls,
    } = await validateAsync(Joi.object({
      app: Joi.object({
        _id: appAttrs.id.required(),
        slug: appAttrs.slug.required(),
        name: appAttrs.name.required(),
      }).required(),
      org: Joi.object({
        _id: orgAttrs.id.required(),
        slug: orgAttrs.slug.required(),
        name: orgAttrs.name.required(),
      }).required(),
      slug: workspaceAttrs.slug.required(),
      name: workspaceAttrs.name.required(),
      // urls: Joi.array().items(
      //   Joi.object({
      //     env: Joi.string().lowercase().required(),
      //     value: workspaceAttrs.url.required(),
      //   }).required(),
      // ).required(),
    }).required(), params);

    await this.throwIfSlugHasRedirect({ slug, appId: app._id, orgId: org._id });

    const now = new Date();
    const doc = cleanDocument({
      app,
      org,
      slug,
      name,
      // urls,
      date: {
        created: now,
        updated: now,
      },
      members: [],
      redirects: [],
    }, { preserveEmptyArrays: true });

    const session = await this.client.startSession();
    session.startTransaction();

    const options = { strict: true, session };
    try {
      const workspace = await this.insertOne({ doc, options });
      const rel = { _id: workspace._id, name: workspace.name, slug: workspace.slug };

      await Promise.all([
        this.manager.$('application').pushRelatedWorkspace({
          appId: app._id,
          workspace: { ...rel, org: workspace.org },
          options,
        }),
        this.manager.$('organization').pushRelatedWorkspace({
          orgId: org._id,
          workspace: { ...rel, app: workspace.app },
          options,
        }),
      ]);

      await session.commitTransaction();
      return workspace;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.workspaceId
   * @param {ObjectId} params.userId
   */
  async removeMember(params = {}) {
    const {
      workspaceId,
      userId,
    } = await validateAsync(Joi.object({
      workspaceId: workspaceAttrs.id.required(),
      userId: userAttrs.id.required(),
    }).required(), params);

    const session = await this.client.startSession();
    session.startTransaction();

    const now = new Date();
    const options = { strict: true, session };
    try {
      const results = await Promise.all([
        this.updateOne({
          query: { _id: workspaceId, 'members.user._id': userId },
          update: {
            $set: { 'date.updated': now },
            $pull: { members: { 'user._id': userId } },
          },
          options,
        }),
        this.manager.$('user').updateOne({
          query: { _id: userId, 'memberships.workspace._id': workspaceId },
          update: {
            $set: { 'date.updated': now },
            $pull: { memberships: { 'workspace._id': workspaceId } },
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
        e.message = 'Either no record was found for the provided criteria or this user is not a member of this workspace.';
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
   * @param {string} params.slug
   * @param {ObjectId} params.appId
   * @param {ObjectId} params.orgId
   */
  async throwIfSlugHasRedirect(params = {}) {
    const {
      id,
      slug,
      appId,
      orgId,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id,
      slug: workspaceAttrs.slug.required(),
      appId: appAttrs.id.required(),
      orgId: orgAttrs.id.required(),
    }).required(), params);
    return this.manager.throwIfSlugHasRedirect({
      repo: 'workspace',
      id,
      slug,
      query: { 'app._id': appId, 'org._id': orgId },
    });
  }

  async updateForeignNameValues(params = {}) {
    const {
      id,
      name,
      options,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id.required(),
      name: workspaceAttrs.name.required(),
      options: Joi.object().default({}),
    }).required(), params);

    return Promise.all([
      // user memberships
      this.manager.$('user').updateRelatedMembershipWorkspaces({ id, name, options }),
      // app workspaces
      this.manager.$('application').updateRelatedWorkspaces({ id, name, options }),
      // org workspaces
      this.manager.$('organization').updateRelatedWorkspaces({ id, name, options }),
    ]);
  }

  async updateForiegnSlugValues(params = {}) {
    const {
      id,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id.required(),
      slug: workspaceAttrs.slug.required(),
      options: Joi.object().default({}),
    }).required(), params);

    return Promise.all([
      // user memberships
      this.manager.$('user').updateRelatedMembershipWorkspaces({ id, slug, options }),
      // app workspaces
      this.manager.$('application').updateRelatedWorkspaces({ id, slug, options }),
      // org workspaces
      this.manager.$('organization').updateRelatedWorkspaces({ id, slug, options }),
    ]);
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
      id: workspaceAttrs.id.required(),
      name: workspaceAttrs.name.required(),
    }).required(), params);

    const update = await buildUpdateNamePipeline({ name });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the workspace.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await this.updateForeignNameValues({ id, name, options: { session } });

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
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   * @param {string} [params.slug]
   * @param {object} [params.options={}]
   */
  async updateRelatedApps(params = {}) {
    const {
      id,
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: appAttrs.id.required(),
      name: appAttrs.name,
      slug: appAttrs.slug,
      options: Joi.object().default({}),
    }).required(), params);

    if ([name, slug].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'app._id': id },
      update: {
        $set: {
          ...(name && { 'app.name': name }),
          ...(slug && { 'app.slug': slug }),
        },
      },
      options,
    });
  }

  /**
   *
   * @param {object} params
   * @param {object} params.user
   * @param {ObjectId} params.user._id
   * @param {string} [params.user.email]
   * @param {string} [params.user.givenName]
   * @param {string} [params.user.familyName]
   * @param {object} [params.options={}]
   */
  async updateRelatedMembers(params = {}) {
    const {
      user,
      options,
    } = await validateAsync(Joi.object({
      user: Joi.object({
        _id: userAttrs.id.required(),
        email: userAttrs.email,
        givenName: userAttrs.givenName,
        familyName: userAttrs.familyName,
      }).required(),
      options: Joi.object().default({}),
    }).required(), params);

    if ([user.email, user.givenName, user.familyName].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'members.user._id': user._id },
      update: {
        $set: {
          ...(user.email && { 'members.$[elem].user.email': user.email }),
          ...(user.givenName && { 'members.$[elem].user.givenName': user.givenName }),
          ...(user.familyName && { 'members.$[elem].user.familyName': user.familyName }),
        },
      },
      options: {
        ...options,
        arrayFilters: [{ 'elem.user._id': user._id }],
      },
    });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} [params.name]
   * @param {string} [params.slug]
   * @param {object} [params.options={}]
   */
  async updateRelatedOrgs(params = {}) {
    const {
      id,
      name,
      slug,
      options,
    } = await validateAsync(Joi.object({
      id: orgAttrs.id.required(),
      name: orgAttrs.name,
      slug: orgAttrs.slug,
      options: Joi.object().default({}),
    }).required(), params);

    if ([name, slug].every((v) => !v)) return null;
    return this.updateMany({
      query: { 'org._id': id },
      update: {
        $set: {
          ...(name && { 'org.name': name }),
          ...(slug && { 'org.slug': slug }),
        },
      },
      options,
    });
  }

  /**
   * @param {object} params
   * @param {ObjectId} params.id
   * @param {string} params.slug
   * @param {ObjectId} params.appId
   * @param {ObjectId} params.orgId
   */
  async updateSlug(params = {}) {
    const {
      id,
      slug,
      appId,
      orgId,
    } = await validateAsync(Joi.object({
      id: workspaceAttrs.id,
      slug: workspaceAttrs.slug.required(),
      appId: appAttrs.id.required(),
      orgId: orgAttrs.id.required(),
    }).required(), params);

    const update = await this.manager.prepareSlugUpdatePipeline({
      repo: 'workspace',
      id,
      slug,
      query: { 'app._id': appId, 'org._id': orgId },
    });
    const session = await this.client.startSession();
    session.startTransaction();

    try {
      // attempt to update the workspace.
      const result = await this.updateOne({
        query: { _id: id },
        update,
        options: { strict: true, session },
      });

      // if nothing changed, skip updating related fields
      if (!result.modifiedCount) return result;

      // then update relationships.
      await this.updateForiegnSlugValues({ id, slug, options: { session } });

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
